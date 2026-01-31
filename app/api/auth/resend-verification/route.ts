import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { verifyToken, generateEmailVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        // Get the auth token from cookies
        const authToken = request.cookies.get('auth_token')?.value;

        if (!authToken) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const payload = verifyToken(authToken);
        if (!payload) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        // Find the user
        const user = await User.findById(payload.userId);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
        }

        // Generate new verification token
        const emailVerificationToken = generateEmailVerificationToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, emailVerificationToken);

        return NextResponse.json({ message: 'Verification email sent' }, { status: 200 });
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json({ message: 'Failed to resend verification email' }, { status: 500 });
    }
}
