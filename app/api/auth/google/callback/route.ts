import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';

interface GoogleTokenResponse {
    access_token: string;
    id_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

function getAppUrl(request: NextRequest): string {
    // First check if we stored the origin in a cookie
    const storedOrigin = request.cookies.get('oauth_origin')?.value;
    if (storedOrigin) {
        return storedOrigin;
    }

    // Fall back to headers
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = forwardedHost || request.headers.get('host') || 'localhost:3001';

    const protocol = host.includes('localhost') ? 'http' : forwardedProto;

    return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        const appUrl = getAppUrl(request);

        // Handle OAuth errors
        if (error) {
            console.error('[OAuth Callback] Error from Google:', error);
            return NextResponse.redirect(`${appUrl}/login?error=oauth_denied`);
        }

        if (!code) {
            console.error('[OAuth Callback] No authorization code received');
            return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
        }

        // Verify state (CSRF protection)
        const storedState = request.cookies.get('oauth_state')?.value;
        if (!storedState || storedState !== state) {
            console.error('[OAuth Callback] State mismatch - possible CSRF attack');
            return NextResponse.redirect(`${appUrl}/login?error=oauth_invalid_state`);
        }

        // Exchange code for tokens
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${appUrl}/api/auth/google/callback`;

        if (!clientId || !clientSecret) {
            console.error('[OAuth Callback] Missing OAuth credentials');
            return NextResponse.redirect(`${appUrl}/login?error=oauth_config`);
        }

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('[OAuth Callback] Token exchange failed:', errorData);
            return NextResponse.redirect(`${appUrl}/login?error=oauth_token_failed`);
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();
        console.log('[OAuth Callback] Tokens received');

        // Fetch user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!userInfoResponse.ok) {
            console.error('[OAuth Callback] Failed to fetch user info');
            return NextResponse.redirect(`${appUrl}/login?error=oauth_userinfo_failed`);
        }

        const googleUser: GoogleUserInfo = await userInfoResponse.json();
        console.log('[OAuth Callback] User info received:', googleUser.email);

        // Connect to database
        await connectToDatabase();

        // Check if user exists by googleId or email
        let user = await User.findOne({
            $or: [
                { googleId: googleUser.id },
                { email: googleUser.email }
            ]
        });

        if (user) {
            // User exists
            if (!user.googleId) {
                // Link Google account to existing user
                user.googleId = googleUser.id;
                if (!user.profilePicture && googleUser.picture) {
                    user.profilePicture = googleUser.picture;
                }
                // If they signed up with email/password but now using Google, mark email as verified
                if (!user.emailVerified && googleUser.verified_email) {
                    user.emailVerified = true;
                }
                await user.save();
                console.log('[OAuth Callback] Linked Google account to existing user');
            }
        } else {
            // Create new user
            user = new User({
                email: googleUser.email,
                firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
                lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
                googleId: googleUser.id,
                authProvider: 'google',
                emailVerified: googleUser.verified_email,
                profilePicture: googleUser.picture,
            });
            await user.save();
            console.log('[OAuth Callback] Created new user via Google OAuth');
        }

        // Generate JWT token
        const token = generateToken(user);

        // Create response and redirect to dashboard
        const response = NextResponse.redirect(`${appUrl}/dashboard`);

        // Set auth cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: !appUrl.includes('localhost'),
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        // Clear OAuth cookies
        response.cookies.delete('oauth_state');
        response.cookies.delete('oauth_origin');

        console.log('[OAuth Callback] Login successful, redirecting to dashboard');
        return response;
    } catch (error) {
        console.error('[OAuth Callback] Error:', error);
        const appUrl = getAppUrl(request);
        return NextResponse.redirect(`${appUrl}/login?error=oauth_error`);
    }
}
