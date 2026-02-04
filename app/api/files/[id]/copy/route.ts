import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import { logActivityAsync } from '@/lib/activity';

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

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
        const body = await request.json().catch(() => ({}));
        const { targetFolderId } = body;

        // Find the original file
        const originalFile = await File.findOne({ _id: id, userId: user._id, type: 'file' });
        if (!originalFile) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check if file has s3Key
        if (!originalFile.s3Key) {
            return NextResponse.json({ error: 'File has no S3 storage key' }, { status: 400 });
        }

        // Verify target folder exists and belongs to user (if specified)
        if (targetFolderId) {
            const targetFolder = await File.findOne({
                _id: targetFolderId,
                userId: user._id,
                type: 'folder'
            });
            if (!targetFolder) {
                return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
            }
        }

        // Check storage limit
        const currentUser = await User.findById(user._id);
        if (currentUser.storageUsed + originalFile.size > currentUser.storageLimit) {
            return NextResponse.json({ error: 'Storage limit exceeded' }, { status: 400 });
        }

        // Generate new file name
        const nameParts = originalFile.name.split('.');
        const extension = nameParts.length > 1 ? '.' + nameParts.pop() : '';
        const baseName = nameParts.join('.');
        const newName = `${baseName} (Copy)${extension}`;

        // Generate new S3 key
        const newS3Key = `${user._id}/${Date.now()}-${newName.replace(/\s+/g, '_')}`;

        try {
            // Copy object in S3
            await s3Client.send(new CopyObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                CopySource: `/${process.env.AWS_BUCKET_NAME}/${originalFile.s3Key}`,
                Key: newS3Key,
            }));
        } catch (s3Error: any) {
            console.error('S3 Copy error:', s3Error);
            return NextResponse.json({
                error: `S3 copy failed: ${s3Error.message || 'Unknown S3 error'}`
            }, { status: 500 });
        }

        // Create new file record in the target folder (or root if not specified)
        const newFile = await File.create({
            userId: user._id,
            parentId: targetFolderId || null,
            name: newName,
            type: 'file',
            mimeType: originalFile.mimeType,
            size: originalFile.size,
            s3Key: newS3Key,
            s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newS3Key}`,
            isStarred: false,
            isTrashed: false,
        });

        // Update user's storage used
        await User.findByIdAndUpdate(user._id, {
            $inc: { storageUsed: originalFile.size },
        });

        // Log activity
        logActivityAsync(user._id.toString(), 'file_copy', 'file', newFile._id.toString(), newFile.name, {
            originalFileId: originalFile._id.toString(),
            originalFileName: originalFile.name,
            targetFolderId: targetFolderId || 'root'
        });

        return NextResponse.json({
            message: 'File copied successfully',
            file: {
                _id: newFile._id,
                name: newFile.name,
                parentId: newFile.parentId,
            },
        });
    } catch (error: any) {
        console.error('Copy file error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to copy file'
        }, { status: 500 });
    }
}

