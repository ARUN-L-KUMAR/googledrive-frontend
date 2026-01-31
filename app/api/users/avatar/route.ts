import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('avatar') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique key for S3
        const ext = file.name.split('.').pop() || 'jpg';
        const s3Key = `avatars/${user._id}/${crypto.randomUUID()}.${ext}`;

        // Upload to S3 (key, body, mimeType)
        const result = await uploadToS3(s3Key, buffer, file.type);

        // Update user profile picture
        user.profilePicture = result.url;
        await user.save();

        return NextResponse.json({
            message: 'Avatar uploaded successfully',
            profilePicture: result.url,
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}

