import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for Route Handlers that reads the real parent/teacher
 * session from cookies, so API routes can call `.auth.getUser()` to verify
 * who is actually calling — the missing piece for server-side authorization.
 */
export async function createRouteClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render path; safe to ignore.
        }
      },
    },
  });
}

/** Returns the authenticated Supabase user for the current request, or null. */
export async function getAuthenticatedUser() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
