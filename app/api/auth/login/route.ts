import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Login request started');
    await connectToDatabase();

    const { email, password } = await request.json();
    console.log('[v0] Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('[v0] Missing email or password');
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    // Find user (need to select password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('[v0] User not found:', email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Check email verified
    if (!user.emailVerified) {
      console.log('[v0] Email not verified:', email);
      return NextResponse.json(
        { message: 'Please verify your email before logging in' },
        { status: 401 }
      );
    }

    // Compare passwords
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      console.log('[v0] Invalid password for user:', email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate token
    const token = generateToken(user);
    console.log('[v0] Token generated');

    // Create response with cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 200 }
    );

    // Set auth cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('[v0] Login successful, cookie set');
    return response;
  } catch (error) {
    console.error('[v0] Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: `Login failed: ${errorMessage}` }, { status: 500 });
  }
}
