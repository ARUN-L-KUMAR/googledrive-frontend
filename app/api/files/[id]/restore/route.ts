import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
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

    if (!file.isTrashed) {
      return NextResponse.json({ message: 'File is not in trash' }, { status: 400 });
    }

    // Restore file
    file.isTrashed = false;
    file.trashedAt = undefined;
    await file.save();

    return NextResponse.json({ file }, { status: 200 });
  } catch (error) {
    console.error('File restore error:', error);
    return NextResponse.json({ message: 'Failed to restore file' }, { status: 500 });
  }
}
