import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for handling authentication and language detection
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth token from cookie
  const authToken = request.cookies.get('auth_token')?.value;

  // Read language from cookie
  const language = request.cookies.get('jowi-language')?.value || 'ru';

  // Define public routes (accessible without authentication)
  const publicRoutes = ['/login', '/register', '/forgot-password'];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current route is protected (requires authentication)
  const isProtectedRoute =
    pathname.startsWith('/intranet') || pathname.startsWith('/store');

  // Redirect logic
  if (!authToken && isProtectedRoute) {
    // User not authenticated, trying to access protected route → redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Save redirect URL
    return NextResponse.redirect(loginUrl);
  }

  if (authToken && isPublicRoute) {
    // User already authenticated, trying to access login/register → redirect to intranet
    const intranetUrl = new URL('/intranet/stores', request.url);
    return NextResponse.redirect(intranetUrl);
  }

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Add language to headers so it's available on the server
  requestHeaders.set('x-jowi-language', language);

  // Return response with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Run middleware on all routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
