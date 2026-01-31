import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { getSignedS3Url } from '@/lib/s3';

// GET - Get contents of a specific folder
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get type filter from query params
        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type') || 'all';

        // First verify the folder exists and belongs to user
        const folder = await File.findOne({
            _id: id,
            userId: user._id,
            type: 'folder',
            isTrashed: false,
            isDeleted: { $ne: true }
        });

        if (!folder) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
        }

        // Build filter query for items inside this folder
        const filter: Record<string, any> = {
            userId: user._id,
            parentId: id,
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

        // Get all items inside this folder
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

        // Get breadcrumb path
        const breadcrumbs = await getBreadcrumbs(folder, user._id);

        return NextResponse.json({
            folder,
            items: itemsWithThumbnails,
            breadcrumbs
        });
    } catch (error) {
        console.error('Folder contents fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch folder contents' }, { status: 500 });
    }
}

// Helper function to build breadcrumb path
async function getBreadcrumbs(folder: any, userId: any) {
    const breadcrumbs = [];
    let currentFolder = folder;

    while (currentFolder) {
        breadcrumbs.unshift({
            _id: currentFolder._id,
            name: currentFolder.name,
        });

        if (currentFolder.parentId) {
            currentFolder = await File.findOne({
                _id: currentFolder.parentId,
                userId: userId,
                type: 'folder',
            });
        } else {
            currentFolder = null;
        }
    }

    return breadcrumbs;
}
