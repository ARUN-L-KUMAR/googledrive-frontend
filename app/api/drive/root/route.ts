import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { getSignedS3Url } from '@/lib/s3';

// GET - Get all items in root directory (no parent)
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get type filter from query params
        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type') || 'all';

        // Build filter query
        const filter: Record<string, any> = {
            userId: user._id,
            parentId: null,
            isTrashed: false,
            isDeleted: { $ne: true },
        };

        // Add type filter
        if (typeFilter !== 'all') {
            switch (typeFilter) {
                case 'folders':
                    filter.type = 'folder';
                    break;
                case 'images':
                    filter.type = 'file';
                    filter.mimeType = { $regex: '^image/' };
                    break;
                case 'videos':
                    filter.type = 'file';
                    filter.mimeType = { $regex: '^video/' };
                    break;
                case 'audio':
                    filter.type = 'file';
                    filter.mimeType = { $regex: '^audio/' };
                    break;
                case 'documents':
                    filter.type = 'file';
                    filter.$or = [
                        { mimeType: 'application/pdf' },
                        { mimeType: { $regex: '^text/' } },
                        { mimeType: { $regex: 'document' } },
                        { mimeType: { $regex: 'spreadsheet' } },
                        { mimeType: { $regex: 'presentation' } },
                    ];
                    break;
            }
        }

        // Get all files and folders at root level (parentId is null)
        const items = await File.find(filter).sort({ type: -1, name: 1 }); // Folders first, then alphabetically

        // Add signed URLs for image/video files for thumbnail display
        const itemsWithThumbnails = await Promise.all(
            items.map(async (item) => {
                const itemObj = item.toObject();

                if (item.type === 'file' && item.s3Key) {
                    // For audio files, use the stored thumbnailUrl (album art) if it exists
                    if (item.mimeType?.startsWith('audio/') && item.thumbnailS3Key) {
                        try {
                            itemObj.thumbnailUrl = await getSignedS3Url(item.thumbnailS3Key, 3600);
                        } catch (error) {
                            console.error('Failed to generate audio thumbnail URL:', error);
                        }
                    }
                    // For images and videos, generate signed URL from the main file
                    else if (item.mimeType?.startsWith('image/') || item.mimeType?.startsWith('video/')) {
                        try {
                            itemObj.thumbnailUrl = await getSignedS3Url(item.s3Key, 3600);
                        } catch (error) {
                            console.error('Failed to generate thumbnail URL:', error);
                        }
                    }
                }
                return itemObj;
            })
        );

        return NextResponse.json({ items: itemsWithThumbnails });
    } catch (error) {
        console.error('Root directory fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch root directory' }, { status: 500 });
    }
}
