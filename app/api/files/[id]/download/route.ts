import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { getSignedS3Url } from '@/lib/s3';

export async function GET(
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

        // Find file and verify ownership
        const file = await File.findOne({ _id: id, userId: user._id });
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check if it's a file (not a folder)
        if (file.type !== 'file') {
            return NextResponse.json({ error: 'Cannot download a folder' }, { status: 400 });
        }

        // Check if file has S3 key
        if (!file.s3Key) {
            return NextResponse.json({ error: 'File not available for download' }, { status: 400 });
        }

        // Generate signed URL with 60 second expiry for security
        const signedUrl = await getSignedS3Url(file.s3Key, 60);

        return NextResponse.json({
            url: signedUrl,
            filename: file.name,
            mimeType: file.mimeType
        });
    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }
}
