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

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const type = searchParams.get('type') || 'all'; // all, images, videos, documents, audio, folders
        const sortBy = searchParams.get('sort') || 'name'; // name, date, size
        const sortOrder = searchParams.get('order') || 'asc'; // asc, desc

        // Build filter query
        const filter: Record<string, any> = {
            userId: user._id,
            isTrashed: false,
            isDeleted: { $ne: true },
        };

        // Add name search with regex (case-insensitive)
        if (query) {
            filter.name = { $regex: query, $options: 'i' };
        }

        // Add type filter
        if (type !== 'all') {
            switch (type) {
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

        // Build sort query
        const sortField = sortBy === 'date' ? 'updatedAt' : sortBy === 'size' ? 'size' : 'name';
        const sort: Record<string, 1 | -1> = {
            [sortField]: sortOrder === 'desc' ? -1 : 1,
        };

        // Execute search with limit
        const files = await File.find(filter)
            .sort(sort)
            .limit(50)
            .select('_id name type mimeType size updatedAt isStarred parentId');

        return NextResponse.json({
            results: files,
            query,
            type,
            sortBy,
            sortOrder,
            count: files.length,
        });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Failed to search files' }, { status: 500 });
    }
}
