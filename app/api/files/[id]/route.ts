import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';
import { logActivityAsync } from '@/lib/activity';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { isStarred, name } = await request.json();

    const file = await File.findOne({ _id: id, userId: user._id });
    if (!file) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    const oldName = file.name;

    if (isStarred !== undefined) {
      file.isStarred = isStarred;
    }

    if (name !== undefined) {
      file.name = name;
    }

    await file.save();

    // Log activity for starring/unstarring
    if (isStarred !== undefined) {
      const action = isStarred ? 'file_star' : 'file_unstar';
      logActivityAsync(user._id.toString(), action, file.type, file._id.toString(), file.name);
    }

    // Log activity for renaming
    if (name !== undefined && name !== oldName) {
      logActivityAsync(user._id.toString(), 'file_rename', file.type, file._id.toString(), file.name, { oldName });
    }

    return NextResponse.json({ file }, { status: 200 });
  } catch (error) {
    console.error('File update error:', error);
    return NextResponse.json({ message: 'Failed to update file' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const file = await File.findOne({ _id: id, userId: user._id });
    if (!file) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    const fileName = file.name;
    const fileType = file.type;

    // Mark as trashed
    file.isTrashed = true;
    file.trashedAt = new Date();
    await file.save();

    // Log activity
    logActivityAsync(user._id.toString(), fileType === 'folder' ? 'folder_trash' : 'file_trash', fileType, file._id.toString(), fileName);

    // Note: We do NOT delete from S3 or update storage here anymore.
    // That should only happen on permanent delete.

    return NextResponse.json({ message: 'File deleted' }, { status: 200 });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ message: 'Failed to delete file' }, { status: 500 });
  }
}

