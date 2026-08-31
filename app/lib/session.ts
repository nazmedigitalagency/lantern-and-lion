import { createClient } from './supabase/client';

export type Persona = 'child' | 'teen' | 'parent' | 'teacher';

const SESSION_KEYS = [
  'lanternLionChildSession',
  'lanternLionTeenSession',
  'lanternLionDemoSession',
  'lanternLionTeacherSession',
  'lanternLionActiveChildId',
  'lanternLionActiveChild',
] as const;

/**
 * Fully signs out of this device — not just the persona that clicked
 * "sign out". A shared family device can have more than one session
 * coexisting in localStorage at once (a parent sets up the family, then a
 * child signs in on the same browser without the parent's session ever
 * being cleared). Previously, signing out of one persona only cleared that
 * persona's own key, so the *next* most-privileged lingering session (e.g.
 * the parent's) became the one shown on the landing page — meaning a child
 * signing out could land the device on a page offering to open the parent
 * dashboard, with the parent's real Supabase session still valid underneath
 * and no password prompt in the way. So this clears every persona's session
 * unconditionally, regardless of which one was passed in, and terminates
 * both the real Supabase Auth session (parent/teacher) and the signed
 * server-side child/teen session cookie, so nothing is left to silently
 * re-authenticate from on a later visit.
 */
export async function signOutOfPersona(_persona: Persona): Promise<void> {
  void _persona; // kept for call-site clarity; every sign-out now clears the whole device.
  for (const key of SESSION_KEYS) localStorage.removeItem(key);

  await Promise.allSettled([
    fetch('/api/child-auth/logout', { method: 'POST' }),
    createClient().auth.signOut(),
  ]);
}
