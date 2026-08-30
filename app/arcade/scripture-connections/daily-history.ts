// Scripture Connections' own daily-completion log — feeds the SAME
// streak math the Daily Quests feature already uses
// (`daily-quests/progression`'s `computeStreak`/`getLastSevenDays`,
// pure functions over a plain `HistoryEntry[]`) instead of writing a
// second streak algorithm. This file only owns the small, game-specific
// question those functions don't answer: "did this profile finish
// today's Scripture Connections puzzle?"

import { computeStreak, getLastSevenDays } from '../../daily-quests/progression';
import type { HistoryEntry, StreakInfo } from '../../daily-quests/types';

const HISTORY_KEY = 'lanternLionScriptureConnectionsDaily';
const MAX_HISTORY_DAYS = 120;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readAllHistory(): Record<string, HistoryEntry[]> {
  if (typeof window === 'undefined') return {};
  return safeParse(localStorage.getItem(HISTORY_KEY), {});
}

export function getDailyHistory(profileId: number): HistoryEntry[] {
  return readAllHistory()[profileId] || [];
}

/** Marks today's daily puzzle as completed — idempotent, so replaying the same day's puzzle doesn't inflate anything. */
export function markDailyCompleted(profileId: number, dateKey: string): void {
  if (typeof window === 'undefined') return;
  const all = readAllHistory();
  const history = all[profileId] || [];
  const existing = history.find((h) => h.date === dateKey);
  if (existing?.completed) return;
  const next = existing
    ? history.map((h) => (h.date === dateKey ? { ...h, completed: true } : h))
    : [...history, { date: dateKey, completed: true }];
  all[profileId] = next.slice(-MAX_HISTORY_DAYS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

export function getDailyStreak(profileId: number): StreakInfo {
  return computeStreak(getDailyHistory(profileId));
}

export function getDailyWeekStrip(profileId: number, todayKey: string): HistoryEntry[] {
  return getLastSevenDays(getDailyHistory(profileId), todayKey);
}
