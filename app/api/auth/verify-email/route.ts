import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 400 });
    }

    // Find user with token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Generate new token with updated emailVerified status
    const authToken = generateToken(user);

    const response = NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });

    // Set the new auth cookie with emailVerified = true
    response.cookies.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
  }
}

