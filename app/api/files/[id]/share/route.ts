import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import ShareLink from '@/lib/models/ShareLink';
import { getCurrentUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

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
        const { expiresInSeconds = 600 } = await request.json();

        // Validate expiry time (min 1 min, max 7 days)
        const expiry = Math.min(Math.max(expiresInSeconds, 60), 604800);

        // Find file and verify ownership
        const file = await File.findOne({ _id: id, userId: user._id });
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check if it's a file (not a folder)
        if (file.type !== 'file') {
            return NextResponse.json({ error: 'Cannot share a folder' }, { status: 400 });
        }

        // Generate unique token
        const token = randomUUID();

        // Calculate expiration date
        const expiresAt = new Date(Date.now() + expiry * 1000);

        // Create share link
        const shareLink = await ShareLink.create({
            fileId: file._id,
            userId: user._id,
            token,
            expiresAt,
        });

        // Build the share URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const shareUrl = `${baseUrl}/api/share/${token}`;

        return NextResponse.json({
            shareUrl,
            token,
            expiresAt: shareLink.expiresAt,
            expiresInSeconds: expiry,
        });
    } catch (error) {
        console.error('Share link creation error:', error);
        return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
    }
}

// Get all share links for a file
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

        // Get all active share links for this file
        const shareLinks = await ShareLink.find({
            fileId: id,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        return NextResponse.json({
            links: shareLinks.map(link => ({
                token: link.token,
                shareUrl: `${baseUrl}/api/share/${link.token}`,
                expiresAt: link.expiresAt,
                downloadCount: link.downloadCount,
            })),
        });
    } catch (error) {
        console.error('Get share links error:', error);
        return NextResponse.json({ error: 'Failed to get share links' }, { status: 500 });
    }
}

// Delete/revoke a share link
export async function DELETE(
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
        const { token } = await request.json();

        // Find and delete the share link
        const result = await ShareLink.findOneAndDelete({
            fileId: id,
            userId: user._id,
            token,
        });

        if (!result) {
            return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Share link revoked' });
    } catch (error) {
        console.error('Revoke share link error:', error);
        return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 });
    }
}
