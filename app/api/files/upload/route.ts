import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { extractAlbumArt } from '@/lib/thumbnail';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentId = formData.get('parentId') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const filename = file.name;
    const mimeType = file.type;
    const fileSize = buffer.byteLength;

    // Check storage limit
    const userDoc = await User.findById(user._id);
    if (userDoc.storageUsed + fileSize > userDoc.storageLimit) {
      return NextResponse.json({ message: 'Storage limit exceeded' }, { status: 400 });
    }

    // Upload to S3
    const s3Key = `${user._id}/${Date.now()}-${filename}`;
    const { url } = await uploadToS3(s3Key, new Uint8Array(buffer), mimeType);

    // Initialize thumbnail fields
    let thumbnailUrl: string | undefined;
    let thumbnailS3Key: string | undefined;

    // Extract and upload album art for audio files
    if (mimeType.startsWith('audio/')) {
      console.log('Processing audio file for thumbnail:', filename);
      try {
        const albumArt = await extractAlbumArt(Buffer.from(buffer), mimeType);
        console.log('Extraction result:', albumArt ? 'Found artwork' : 'No artwork found');

        if (albumArt) {
          // Generate thumbnail filename
          const thumbnailFilename = `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}-thumb.jpg`;
          thumbnailS3Key = `${user._id}/thumbnails/${thumbnailFilename}`;

          console.log('Uploading thumbnail to:', thumbnailS3Key);

          // Upload thumbnail to S3
          const { url: thumbUrl } = await uploadToS3(
            thumbnailS3Key,
            albumArt.buffer,
            albumArt.format
          );

          thumbnailUrl = thumbUrl;
          console.log('Thumbnail uploaded successfully:', thumbnailUrl);
        }
      } catch (error) {
        console.error('Failed to extract/upload album art:', error);
        // Continue without thumbnail if extraction fails
      }
    }

    // Create file record
    const fileRecord = new File({
      userId: user._id,
      parentId: parentId || null,
      name: filename,
      type: 'file',
      mimeType,
      size: fileSize,
      s3Key,
      s3Url: url,
      thumbnailUrl,
      thumbnailS3Key,
    });

    await fileRecord.save();

    // Update user storage
    userDoc.storageUsed += fileSize;
    await userDoc.save();

    // Create notification asynchronously
    createUploadNotification(user._id.toString(), filename, fileRecord._id.toString());

    return NextResponse.json({ file: fileRecord }, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ message: 'File upload failed' }, { status: 500 });
  }
}

// Helper to create notifications asynchronously
async function createUploadNotification(userId: string, fileName: string, fileId: string) {
  try {
    const Notification = (await import('@/lib/models/Notification')).default;
    await Notification.create({
      recipient: userId,
      type: 'info',
      title: 'File uploaded',
      message: `File "${fileName}" was uploaded successfully`,
      relatedId: fileId,
    });
  } catch (err) {
    console.error('Failed to create upload notification:', err);
  }
}
