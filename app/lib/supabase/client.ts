import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('Supabase environment variables are missing. Some live cloud features may be disabled.');
    }
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

