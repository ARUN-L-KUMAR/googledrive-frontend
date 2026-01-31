import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/api/files', '/api/users'];
const publicRoutes = ['/', '/home', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verify-email-required'];

// Simple JWT decode without verification (verification happens in API routes)
function decodeToken(token: string): { userId: string; email: string; emailVerified: boolean } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isApiRoute = pathname.startsWith('/api/');

  // If accessing protected API route without token, return 401 (don't redirect)
  if (isApiRoute && isProtectedRoute && !authToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // If accessing protected page route without token, redirect to login
  if (!isApiRoute && isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing protected route, check if email is verified
  if (isProtectedRoute && authToken) {
    const decoded = decodeToken(authToken);
    if (decoded && !decoded.emailVerified) {
      return NextResponse.redirect(new URL('/verify-email-required', request.url));
    }
  }

  // If accessing public auth routes with token
  if ((pathname === '/login' || pathname === '/register') && authToken) {
    const decoded = decodeToken(authToken);
    if (decoded?.emailVerified) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (decoded && !decoded.emailVerified) {
      return NextResponse.redirect(new URL('/verify-email-required', request.url));
    }
  }

  // If accessing verify-email-required page but already verified, redirect to dashboard
  if (pathname === '/verify-email-required' && authToken) {
    const decoded = decodeToken(authToken);
    if (decoded?.emailVerified) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
