import { NextResponse } from 'next/server';
import { createRouteClient } from '../../lib/supabase/route-client';

function sanitizeNextUrl(nextParam: string | null, defaultPath = '/teacher-dashboard'): string {
  if (!nextParam) return defaultPath;
  // Prevent open redirect by ensuring it is a relative path starting with a single '/'
  if (nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\')) {
    return nextParam;
  }
  return defaultPath;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeNextUrl(searchParams.get('next'));

  if (code) {
    try {
      const supabase = await createRouteClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        const targetUrl = isLocalEnv || !forwardedHost
          ? `${origin}${next}`
          : `https://${forwardedHost}${next}`;
        return NextResponse.redirect(targetUrl);
      }
    } catch {
      // Fall through to error redirect
    }
  }

  const fallback = next.includes('parent') ? '/parent-access' : '/teacher-access';
  return NextResponse.redirect(`${origin}${fallback}?error=auth_callback_failed`);
}
