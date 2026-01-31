import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';

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

    if (isStarred !== undefined) {
      file.isStarred = isStarred;
    }

    if (name !== undefined) {
      file.name = name;
    }

    await file.save();

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

    // Mark as trashed
    file.isTrashed = true;
    file.trashedAt = new Date();
    await file.save();

    // Note: We do NOT delete from S3 or update storage here anymore.
    // That should only happen on permanent delete.

    return NextResponse.json({ message: 'File deleted' }, { status: 200 });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ message: 'Failed to delete file' }, { status: 500 });
  }
}
