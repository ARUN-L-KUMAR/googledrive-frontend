import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import File from '@/lib/models/File';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all user files to delete from S3
        const files = await File.find({
            userId: user._id,
            type: 'file',
        });

        // Delete all files from S3
        for (const file of files) {
            if (file.s3Key) {
                try {
                    await deleteFromS3(file.s3Key);
                } catch (err) {
                    console.error(`Failed to delete S3 file: ${file.s3Key}`, err);
                }
            }
            if (file.thumbnailS3Key) {
                try {
                    await deleteFromS3(file.thumbnailS3Key);
                } catch (err) {
                    console.error(`Failed to delete S3 thumbnail: ${file.thumbnailS3Key}`, err);
                }
            }
        }

        // Delete all files and folders from database
        await File.deleteMany({ userId: user._id });

        // Delete user account
        await User.findByIdAndDelete(user._id);

        // Clear session cookies
        const cookieStore = await cookies();
        cookieStore.delete('auth_token');
        cookieStore.delete('token');

        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
