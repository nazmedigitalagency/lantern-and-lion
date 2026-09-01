'use client';

import { useEffect, useState } from 'react';
import { createClient } from './supabase/client';

export type Persona = 'child' | 'teen' | 'parent' | 'teacher';

export type ActiveUser = {
  persona: Persona;
  name: string;
  roleLabel: string;
  dashboardUrl: string;
  avatarTone: string;
  avatarChar: string;
};

const SESSION_KEYS = [
  'lanternLionChildSession',
  'lanternLionTeenSession',
  'lanternLionDemoSession',
  'lanternLionTeacherSession',
  'lanternLionActiveChildId',
  'lanternLionActiveChild',
] as const;

/**
 * Returns the currently active persona session from localStorage, prioritizing
 * child -> teen -> parent -> teacher.
 */
export function getActiveUserFromStorage(): ActiveUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const childSession = JSON.parse(localStorage.getItem('lanternLionChildSession') || 'null');
    const teenSession = JSON.parse(localStorage.getItem('lanternLionTeenSession') || 'null');
    const parentSession = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null');
    const teacherSession = JSON.parse(localStorage.getItem('lanternLionTeacherSession') || 'null');

    if (childSession?.name) {
      return {
        persona: 'child',
        name: childSession.name,
        roleLabel: 'Child Space',
        dashboardUrl: '/child-dashboard',
        avatarTone: 'gold',
        avatarChar: childSession.name[0]?.toUpperCase() || 'C',
      };
    }
    if (teenSession?.name) {
      return {
        persona: 'teen',
        name: teenSession.name,
        roleLabel: 'Lion’s Den',
        dashboardUrl: '/teen-dashboard',
        avatarTone: 'navy',
        avatarChar: teenSession.name[0]?.toUpperCase() || 'T',
      };
    }
    if (parentSession?.name) {
      return {
        persona: 'parent',
        name: parentSession.name,
        roleLabel: 'Parent Space',
        dashboardUrl: '/parent-dashboard',
        avatarTone: 'coral',
        avatarChar: parentSession.name[0]?.toUpperCase() || 'P',
      };
    }
    if (teacherSession?.name) {
      return {
        persona: 'teacher',
        name: teacherSession.name,
        roleLabel: 'Teacher Space',
        dashboardUrl: '/teacher-dashboard',
        avatarTone: 'teal',
        avatarChar: teacherSession.name[0]?.toUpperCase() || 'T',
      };
    }
  } catch {
    // Return null on storage error
  }
  return null;
}

/**
 * Hook to read and reactively sync the active persona user state after client hydration.
 */
export function useActiveUser() {
  const [activeUser, setActiveUser] = useState<ActiveUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveUser(getActiveUserFromStorage());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const signOut = async () => {
    if (activeUser) {
      await signOutOfPersona(activeUser.persona);
    } else {
      await signOutOfPersona('parent');
    }
    setActiveUser(null);
  };

  return { activeUser, hydrated, signOut, setActiveUser };
}

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
