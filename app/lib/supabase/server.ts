import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client utilizing the SUPABASE_SERVICE_ROLE_KEY.
 * MUST ONLY be used within Next.js Route Handlers (app/api/**) or server components.
 * NEVER import this file into client components ('use client').
 */
export function createServerAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
