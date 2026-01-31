import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';

// Categorize files by mime type
function categorizeByMimeType(mimeType?: string): string {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
        mimeType === 'application/pdf' ||
        mimeType.startsWith('text/') ||
        mimeType.includes('document') ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('presentation')
    ) return 'documents';
    return 'other';
}

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all user's files (not trashed and not deleted)
        const files = await File.find({
            userId: user._id,
            isTrashed: false,
            isDeleted: { $ne: true }
        }).select('name type mimeType size');

        // Calculate analytics
        let totalFiles = 0;
        let totalFolders = 0;
        let totalSize = 0;

        const byType: Record<string, { count: number; size: number }> = {
            images: { count: 0, size: 0 },
            videos: { count: 0, size: 0 },
            documents: { count: 0, size: 0 },
            audio: { count: 0, size: 0 },
            other: { count: 0, size: 0 },
        };

        const filesList: Array<{ _id: string; name: string; size: number; mimeType?: string }> = [];

        for (const file of files) {
            if (file.type === 'folder') {
                totalFolders++;
            } else {
                totalFiles++;
                totalSize += file.size || 0;

                const category = categorizeByMimeType(file.mimeType);
                byType[category].count++;
                byType[category].size += file.size || 0;

                filesList.push({
                    _id: file._id.toString(),
                    name: file.name,
                    size: file.size || 0,
                    mimeType: file.mimeType,
                });
            }
        }

        // Sort by size descending and get top 5
        const largestFiles = filesList
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);

        return NextResponse.json({
            totalFiles,
            totalFolders,
            totalSize,
            byType,
            largestFiles,
            storageUsed: user.storageUsed,
            storageLimit: user.storageLimit,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
    }
}
