import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECURITY_HEADERS: Record<string, string> = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

export function proxy(request: NextRequest) {
  // 1. Force HTTPS in production
  const proto = request.headers.get('x-forwarded-proto');
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    const host = request.headers.get('host') || request.nextUrl.host;
    const httpsUrl = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Pass-through with response security headers
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset file extensions (svg, png, jpg, jpeg, gif, webp, mp3, mp4)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mp4)$).*)',
  ],
};
