import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';

// POST - Create a new folder
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, parentId } = await request.json();

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        // If parentId is provided, verify it exists and belongs to user
        if (parentId) {
            const parentFolder = await File.findOne({
                _id: parentId,
                userId: user._id,
                type: 'folder'
            });
            if (!parentFolder) {
                return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
            }
        }

        // Check if folder with same name exists in the same location
        const existingFolder = await File.findOne({
            userId: user._id,
            parentId: parentId || null,
            name: name.trim(),
            type: 'folder',
            isTrashed: false
        });

        if (existingFolder) {
            return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 400 });
        }

        // Create the folder
        const folder = new File({
            userId: user._id,
            parentId: parentId || null,
            name: name.trim(),
            type: 'folder',
            size: 0,
        });

        await folder.save();

        // Create notification
        try {
            await import('@/lib/models/Notification').then(mod => mod.default.create({
                recipient: user._id,
                type: 'success',
                title: 'Folder created',
                message: `Folder "${name.trim()}" was created successfully`,
                relatedId: folder._id,
            }));
        } catch (notifErr) {
            console.error('Failed to create notification:', notifErr);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({ folder }, { status: 201 });
    } catch (error) {
        console.error('Folder creation error:', error);
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }
}
