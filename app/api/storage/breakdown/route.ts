import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Aggregate storage by file type
        const breakdown = await File.aggregate([
            {
                $match: {
                    userId: user._id,
                    type: 'file',
                    isTrashed: false,
                    isDeleted: { $ne: true },
                }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $regexMatch: { input: '$mimeType', regex: /^image\// } }, then: 'images' },
                                { case: { $regexMatch: { input: '$mimeType', regex: /^video\// } }, then: 'videos' },
                                { case: { $regexMatch: { input: '$mimeType', regex: /^audio\// } }, then: 'audio' },
                                {
                                    case: {
                                        $or: [
                                            { $regexMatch: { input: '$mimeType', regex: /^text\// } },
                                            { $eq: ['$mimeType', 'application/pdf'] },
                                            { $regexMatch: { input: '$mimeType', regex: /document/ } },
                                            { $regexMatch: { input: '$mimeType', regex: /spreadsheet/ } },
                                            { $regexMatch: { input: '$mimeType', regex: /presentation/ } },
                                        ]
                                    },
                                    then: 'documents'
                                },
                            ],
                            default: 'other'
                        }
                    },
                    totalSize: { $sum: '$size' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to object format
        const result: Record<string, { size: number; count: number }> = {
            images: { size: 0, count: 0 },
            videos: { size: 0, count: 0 },
            audio: { size: 0, count: 0 },
            documents: { size: 0, count: 0 },
            other: { size: 0, count: 0 },
        };

        breakdown.forEach((item: any) => {
            if (item._id && result[item._id]) {
                result[item._id] = {
                    size: item.totalSize,
                    count: item.count,
                };
            }
        });

        return NextResponse.json({
            breakdown: result,
            total: user.storageUsed,
            limit: user.storageLimit,
        });
    } catch (error) {
        console.error('Storage breakdown error:', error);
        return NextResponse.json({ error: 'Failed to get storage breakdown' }, { status: 500 });
    }
}
