import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';
import { getSignedS3Url } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Generate signed URL for profile picture if exists
    let profilePictureUrl = null;
    if (user.profilePicture) {
      try {
        // Extract S3 key from the stored URL
        const url = new URL(user.profilePicture);
        const s3Key = url.pathname.slice(1); // Remove leading slash
        profilePictureUrl = await getSignedS3Url(s3Key);
      } catch (err) {
        console.error('Failed to generate signed URL for profile picture:', err);
        profilePictureUrl = user.profilePicture; // Fallback to original URL
      }
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: profilePictureUrl,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName } = await request.json();

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
