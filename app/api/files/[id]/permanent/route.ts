import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';
import { logActivityAsync } from '@/lib/activity';

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
        const fileSize = file.size;

        // Permanent Deletion Logic - completely remove from everywhere

        // 1. If it's a file, delete from S3
        if (file.type === 'file' && file.s3Key) {
            try {
                await deleteFromS3(file.s3Key);
            } catch (err) {
                console.error('Failed to delete from S3:', err);
                // Continue with DB deletion even if S3 fails
            }
        }

        // 2. Update user's storage used
        if (file.size) {
            await import('@/lib/models/User').then((mod) =>
                mod.default.findByIdAndUpdate(user._id, { $inc: { storageUsed: -file.size } })
            );
        }

        // 3. Permanently delete from Database
        await File.deleteOne({ _id: id });

        // Log activity
        logActivityAsync(user._id.toString(), 'file_permanent_delete', fileType, id, fileName, { size: fileSize });

        return NextResponse.json({ message: 'File permanently deleted' }, { status: 200 });
    } catch (error) {
        console.error('Permanent file deletion error:', error);
        return NextResponse.json({ message: 'Failed to delete file' }, { status: 500 });
    }
}
