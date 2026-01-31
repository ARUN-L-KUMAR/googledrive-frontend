import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function getAppUrl(request: NextRequest): string {
    // Try to get the URL from various headers (works with Vercel, proxies, etc.)
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = forwardedHost || request.headers.get('host') || 'localhost:3001';

    // Determine protocol
    const protocol = host.includes('localhost') ? 'http' : forwardedProto;

    return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const appUrl = getAppUrl(request);
        const redirectUri = `${appUrl}/api/auth/google/callback`;

        if (!clientId) {
            console.error('[OAuth] Missing GOOGLE_CLIENT_ID');
            return NextResponse.json({ message: 'OAuth not configured' }, { status: 500 });
        }

        // Generate state for CSRF protection
        const state = crypto.randomBytes(32).toString('hex');

        // Build Google OAuth URL
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            state: state,
            prompt: 'consent',
        });

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        // Create response with state cookie
        const response = NextResponse.redirect(googleAuthUrl);

        // Set state cookie for verification in callback
        response.cookies.set('oauth_state', state, {
            httpOnly: true,
            secure: !appUrl.includes('localhost'),
            sameSite: 'lax',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
        });

        // Store the origin URL for callback
        response.cookies.set('oauth_origin', appUrl, {
            httpOnly: true,
            secure: !appUrl.includes('localhost'),
            sameSite: 'lax',
            maxAge: 60 * 10,
            path: '/',
        });

        console.log('[OAuth] Redirecting to Google OAuth, redirect_uri:', redirectUri);
        return response;
    } catch (error) {
        console.error('[OAuth] Error initiating Google OAuth:', error);
        return NextResponse.json({ message: 'Failed to initiate OAuth' }, { status: 500 });
    }
}
