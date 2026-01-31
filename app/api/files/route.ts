import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const starred = searchParams.get('starred');
    const trash = searchParams.get('trash');

    // Build query based on filters
    let query: any = { userId: user._id, isDeleted: { $ne: true } };

    if (trash === 'true') {
      // Get trashed files (not permanently deleted)
      query.isTrashed = true;
    } else if (starred === 'true') {
      // Get starred files (not trashed)
      query.isStarred = true;
      query.isTrashed = false;
    } else {
      // Default: get non-trashed files at root level
      query.parentId = null;
      query.isTrashed = false;
    }

    const files = await File.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error('Files fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch files' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, parentId, size, mimeType } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ message: 'Name and type required' }, { status: 400 });
    }

    const file = new File({
      userId: user._id,
      parentId: parentId || null,
      name,
      type,
      mimeType,
      size: size || 0,
    });

    await file.save();

    // Update parent folder's size if needed
    if (parentId && type === 'file') {
      await File.findByIdAndUpdate(parentId, { $inc: { size } });
    }

    // Update user's storage used
    if (type === 'file') {
      await import('@/lib/models/User').then((mod) =>
        mod.default.findByIdAndUpdate(user._id, { $inc: { storageUsed: size || 0 } })
      );
    }

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error('File creation error:', error);
    return NextResponse.json({ message: 'Failed to create file' }, { status: 500 });
  }
}
