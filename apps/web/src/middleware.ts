import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Read language from cookie
  const language = request.cookies.get('jowi-language')?.value || 'ru';

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
