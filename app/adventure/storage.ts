// Local persistence adapter for the Adventure World.
//
// This is the ONLY file that touches localStorage for this feature.
// It reuses the exact keys/shape the existing child dashboard already
// writes (`lanternLionModuleProgress`, `lanternLionDemoFamily`,
// `lanternLionChildSession` / `lanternLionTeenSession`) so a quest
// completed here shows up in the existing dashboards and vice versa —
// there is no second, competing progress record.
//
// When a real backend exists, this file is the only thing that needs
// to change: everything else consumes `WorldContext` / `PlayerProfile`
// shapes, not localStorage directly.

import type { ModuleProgressEntry, ModuleProgressMap, WorldContext } from './progression';

export type PlayerProfile = { id: number; name: string; age: number; kind: 'child' | 'teen' };

const FALLBACK_PROFILE: PlayerProfile = { id: 1, name: 'Amara', age: 9, kind: 'child' };

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Adventure/Character/Arcade have no login of their own — they're only ever
// reached from an already-signed-in child/teen dashboard. Without this check,
// signing out and then hitting one of these pages directly (or a stale
// `lanternLionActiveChildId` cursor with no live session) would render
// whichever child's data was last active on this device, with no auth at all.
export function hasActiveSession(): boolean {
  const teenSession = safeParse<{ teenId?: number } | null>(localStorage.getItem('lanternLionTeenSession'), null);
  const childSession = safeParse<{ childId?: number } | null>(localStorage.getItem('lanternLionChildSession'), null);
  return teenSession?.teenId != null || childSession?.childId != null;
}

export function readActiveProfile(): PlayerProfile {
  type FamilyChild = { id: number; name: string; age: number };
  const family = safeParse<{ children?: FamilyChild[] } | null>(localStorage.getItem('lanternLionDemoFamily'), null);
  const teenSession = safeParse<{ teenId?: number } | null>(localStorage.getItem('lanternLionTeenSession'), null);
  const childSession = safeParse<{ childId?: number } | null>(localStorage.getItem('lanternLionChildSession'), null);
  const activeIdFromStorage = Number(localStorage.getItem('lanternLionActiveChildId'));

  const children = family?.children?.length ? family.children : [FALLBACK_PROFILE];

  // The active LOGIN SESSION (`lanternLionTeenSession` / `lanternLionChildSession`)
  // is the only trustworthy source of "who is signed in right now" — it is
  // set exclusively by child-access/teen-access at sign-in and cleared at
  // sign-out. `lanternLionActiveChildId` is a UI convenience a dashboard's
  // own profile-switcher uses to remember which sibling *it* last displayed;
  // it can be overwritten by unrelated flows (e.g. family-setup resets it to
  // the first child) while a session is still live. Trusting it over the
  // session let a signed-in teen/child get silently resolved to a different
  // child's profile — an account-isolation bug. Only fall back to it when
  // there is no active session at all.
  const sessionTargetId = teenSession?.teenId ?? childSession?.childId ?? null;
  const sessionKind: 'teen' | 'child' | null = teenSession?.teenId != null ? 'teen' : childSession?.childId != null ? 'child' : null;
  const targetId = sessionTargetId ?? (activeIdFromStorage > 0 ? activeIdFromStorage : null) ?? children[0].id;
  const match = children.find((child) => child.id === targetId)
    ?? (sessionTargetId !== null ? null : children[0]);

  if (!match) {
    // The signed-in session points at a child that no longer exists in the
    // family record — never fall back to an arbitrary sibling's profile.
    return { id: sessionTargetId as number, name: FALLBACK_PROFILE.name, age: sessionKind === 'teen' ? 13 : FALLBACK_PROFILE.age, kind: sessionKind ?? FALLBACK_PROFILE.kind };
  }

  return { id: match.id, name: match.name, age: match.age, kind: match.age >= 13 ? 'teen' : 'child' };
}

export function readModuleProgress(profileId: number): ModuleProgressMap {
  const progressByChild = safeParse<Record<string, ModuleProgressMap>>(localStorage.getItem('lanternLionModuleProgress'), {});
  return progressByChild[profileId] || {};
}

const MASTERY_KEY = 'lanternLionAdventureMastery';

export function readMasteredQuestIds(profileId: number): string[] {
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(MASTERY_KEY), {});
  return byChild[profileId] || [];
}

export function markQuestMastered(profileId: number, questId: string): string[] {
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(MASTERY_KEY), {});
  const current = byChild[profileId] || [];
  if (!current.includes(questId)) {
    byChild[profileId] = [...current, questId];
    localStorage.setItem(MASTERY_KEY, JSON.stringify(byChild));
    return byChild[profileId];
  }
  return current;
}

export function loadWorldContext(profileId: number, kind: PlayerProfile['kind'] = 'child'): WorldContext {
  return {
    moduleProgress: readModuleProgress(profileId),
    masteredQuestIds: readMasteredQuestIds(profileId),
    kind,
  };
}

export type { ModuleProgressEntry };
