import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { logActivityAsync } from '@/lib/activity';

export async function POST(
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
        const { targetFolderId } = await request.json();

        // Find the file to move
        const file = await File.findOne({ _id: id, userId: user._id });
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Verify target folder exists and belongs to user (if not root)
        if (targetFolderId) {
            const targetFolder = await File.findOne({
                _id: targetFolderId,
                userId: user._id,
                type: 'folder'
            });

            if (!targetFolder) {
                return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
            }

            // Prevent moving a folder into itself or its descendants
            if (file.type === 'folder') {
                // Check if target is a descendant of the file being moved
                let currentFolder = targetFolder;
                while (currentFolder.parentId) {
                    if (currentFolder.parentId.toString() === id) {
                        return NextResponse.json({
                            error: 'Cannot move a folder into its own subfolder'
                        }, { status: 400 });
                    }
                    currentFolder = await File.findById(currentFolder.parentId);
                    if (!currentFolder) break;
                }
            }
        }

        // Update the file's parent
        file.parentId = targetFolderId || null;
        await file.save();

        // Log activity
        logActivityAsync(user._id.toString(), 'file_move', file.type, file._id.toString(), file.name, { targetFolderId: targetFolderId || 'root' });

        return NextResponse.json({
            message: 'File moved successfully',
            file: {
                _id: file._id,
                name: file.name,
                parentId: file.parentId,
            }
        });
    } catch (error) {
        console.error('Move file error:', error);
        return NextResponse.json({ error: 'Failed to move file' }, { status: 500 });
    }
}
