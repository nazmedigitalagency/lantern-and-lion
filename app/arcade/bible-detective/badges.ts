// Detective badge collectible — tracks which cases a profile has solved
// at least once, purely for the "🔎 DETECTIVE BADGE" collectible on the
// case-solved screen and the browse grid. Local-storage backed, same
// safeParse pattern as `arcade/storage.ts`. This is new state nothing
// else in the app tracks (which cases are solved), not a duplicate of
// the personal-best/session systems.

const BADGES_KEY = 'lanternLionDetectiveBadges';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readAllBadges(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  return safeParse(localStorage.getItem(BADGES_KEY), {});
}

export function getSolvedCaseIds(profileId: number): string[] {
  return readAllBadges()[profileId] || [];
}

export function hasBadge(profileId: number, caseId: string): boolean {
  return getSolvedCaseIds(profileId).includes(caseId);
}

/** Records a case as solved. Returns true if this is a brand-new badge (first time solving this case). */
export function markCaseSolved(profileId: number, caseId: string): boolean {
  if (typeof window === 'undefined') return false;
  const all = readAllBadges();
  const existing = all[profileId] || [];
  if (existing.includes(caseId)) return false;
  all[profileId] = [...existing, caseId];
  localStorage.setItem(BADGES_KEY, JSON.stringify(all));
  return true;
}
