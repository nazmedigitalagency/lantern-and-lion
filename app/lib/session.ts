import { createClient } from './supabase/client';

export type Persona = 'child' | 'teen' | 'parent' | 'teacher';

/**
 * Fully signs out of the given persona — not just the localStorage mirror
 * that the header/dashboard UI reads. Parent and teacher accounts are real
 * Supabase Auth sessions (cookie-based); clearing only the localStorage key
 * left the Supabase session itself active, so revisiting /parent-access or
 * /teacher-access silently re-established the localStorage mirror from it
 * and the user was never actually signed out. Child and teen accounts have
 * a signed server-side session cookie of their own that needs the same
 * explicit termination via /api/child-auth/logout.
 */
export async function signOutOfPersona(persona: Persona): Promise<void> {
  switch (persona) {
    case 'child':
      localStorage.removeItem('lanternLionChildSession');
      localStorage.removeItem('lanternLionActiveChildId');
      localStorage.removeItem('lanternLionActiveChild');
      try {
        await fetch('/api/child-auth/logout', { method: 'POST' });
      } catch { /* best-effort */ }
      break;
    case 'teen':
      localStorage.removeItem('lanternLionTeenSession');
      localStorage.removeItem('lanternLionActiveChildId');
      try {
        await fetch('/api/child-auth/logout', { method: 'POST' });
      } catch { /* best-effort */ }
      break;
    case 'parent':
      localStorage.removeItem('lanternLionDemoSession');
      try {
        await createClient().auth.signOut();
      } catch { /* best-effort */ }
      break;
    case 'teacher':
      localStorage.removeItem('lanternLionTeacherSession');
      try {
        await createClient().auth.signOut();
      } catch { /* best-effort */ }
      break;
  }
}
