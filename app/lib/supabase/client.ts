import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqllmvygeeraeyltnbce.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbGxtdnlnZWVyYWV5bHRuYmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDIxNDYsImV4cCI6MjEwMzYxODE0Nn0.akW7ynXFWWf_94WpAj0yj1KB-Q3a2DTci7eK9IzsWRk'
  );
}
