import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, generateEmailVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Registration request started');
    await connectToDatabase();
    console.log('[v0] Database connected');

    const { firstName, lastName, email, password } = await request.json();
    console.log('[v0] Received registration data:', { firstName, lastName, email });

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      console.log('[v0] Missing required fields');
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[v0] User already exists:', email);
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    // Generate verification token
    const emailVerificationToken = generateEmailVerificationToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      emailVerificationToken,
      emailVerificationExpires,
    });

    console.log('[v0] Saving user to database');
    await user.save();
    console.log('[v0] User saved successfully:', user._id);

    // Send verification email
    try {
      console.log('[v0] Sending verification email');
      await sendVerificationEmail(email, emailVerificationToken);
      console.log('[v0] Verification email sent');
    } catch (emailError) {
      console.error('[v0] Failed to send verification email:', emailError);
      // Continue anyway, user can request email resend
    }

    // Generate token
    const token = generateToken(user);
    console.log('[v0] Token generated');

    const response = NextResponse.json(
      {
        message: 'Registration successful. Please verify your email.',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    );

    // Set auth cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('[v0] Registration successful, cookie set');
    return response;
  } catch (error) {
    console.error('[v0] Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: `Registration failed: ${errorMessage}` }, { status: 500 });
  }
}
