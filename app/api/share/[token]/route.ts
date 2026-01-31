import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import ShareLink from '@/lib/models/ShareLink';
import { getSignedS3Url } from '@/lib/s3';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectToDatabase();

        const { token } = await params;

        // Find the share link
        const shareLink = await ShareLink.findOne({ token });

        if (!shareLink) {
            return NextResponse.json({
                error: 'Share link not found or has expired',
                expired: true
            }, { status: 404 });
        }

        // Check if link has expired
        if (new Date() > shareLink.expiresAt) {
            return NextResponse.json({
                error: 'This share link has expired',
                expired: true
            }, { status: 410 });
        }

        // Check download limit if set
        if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
            return NextResponse.json({
                error: 'Download limit reached for this share link',
                limitReached: true
            }, { status: 403 });
        }

        // Get the file
        const file = await File.findById(shareLink.fileId);

        if (!file) {
            return NextResponse.json({ error: 'File no longer exists' }, { status: 404 });
        }

        if (!file.s3Key) {
            return NextResponse.json({ error: 'File not available for download' }, { status: 400 });
        }

        // Generate signed URL for download (short expiry for security)
        const signedUrl = await getSignedS3Url(file.s3Key, 60);

        // Increment download count
        await ShareLink.findByIdAndUpdate(shareLink._id, {
            $inc: { downloadCount: 1 },
        });

        // Redirect to the signed URL for direct download
        return NextResponse.redirect(signedUrl);
    } catch (error) {
        console.error('Public share download error:', error);
        return NextResponse.json({ error: 'Failed to process share link' }, { status: 500 });
    }
}
