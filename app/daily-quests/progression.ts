// Daily Quests progression service — pure functions only, same
// discipline as `adventure/progression.ts`. Reuses Adventure World's
// and Character's existing counters instead of recomputing them, so
// there is one definition of "quests completed" / "regions
// discovered" in the app.

import { getRegionsDiscoveredCount } from '../character/progression';
import { getTotalQuestsCompleted, type WorldContext } from '../adventure/progression';
import { countSessionsOn } from '../arcade/storage';
import { formatDateKey, getTodayDateKey } from '../lib/date';
import type { DailyQuestSet, DaySnapshot, HistoryEntry, StreakInfo } from './types';

export { getTodayDateKey };

/**
 * Every date key strictly after `fromKeyExclusive` up to and including
 * `toKeyInclusive`. Used to explicitly backfill "missed" days when the
 * player skips opening the app entirely for a stretch — without this,
 * a streak computed by array adjacency alone would wrongly treat two
 * completed days either side of a multi-day gap as consecutive.
 */
export function getDateKeysBetween(fromKeyExclusive: string, toKeyInclusive: string): string[] {
  const keys: string[] = [];
  const from = new Date(`${fromKeyExclusive}T00:00:00`);
  const to = new Date(`${toKeyInclusive}T00:00:00`);
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= to) {
    keys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function totalLessonSteps(ctx: WorldContext): number {
  return Object.values(ctx.moduleProgress).reduce((sum, entry) => sum + entry.completedIndices.length, 0);
}

export function computeSnapshot(profileId: number, ctx: WorldContext, todayKey: string): DaySnapshot {
  return {
    questsCompleted: getTotalQuestsCompleted(ctx),
    lessonSteps: totalLessonSteps(ctx),
    regionsDiscovered: getRegionsDiscoveredCount(ctx),
    arcadeSessionsToday: countSessionsOn(profileId, todayKey),
  };
}

/** Which auto-detected completion modes have newly become true, comparing live progress to the day's starting snapshot. */
export function getNewlyAutoCompletedModes(profileId: number, ctx: WorldContext, snapshot: DaySnapshot, todayKey: string): Set<string> {
  const current = computeSnapshot(profileId, ctx, todayKey);
  const modes = new Set<string>();
  if (current.questsCompleted > snapshot.questsCompleted) modes.add('adventure-progress');
  if (current.lessonSteps > snapshot.lessonSteps) modes.add('lesson-progress');
  if (current.regionsDiscovered > snapshot.regionsDiscovered) modes.add('region-discovery');
  if (current.arcadeSessionsToday > (snapshot.arcadeSessionsToday ?? 0)) modes.add('arcade-session');
  return modes;
}

export function isSetFullyComplete(set: DailyQuestSet): boolean {
  return set.quests.length > 0 && set.quests.every((q) => q.completed);
}

export function getCompletedCount(set: DailyQuestSet): number {
  return set.quests.filter((q) => q.completed).length;
}

/** Streak/longest/days-completed are always derived from the history log — never stored as a separately-incremented counter, so they can't drift out of sync with it. */
export function computeStreak(history: HistoryEntry[]): StreakInfo {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let run = 0;
  let daysCompleted = 0;
  for (const day of sorted) {
    if (day.completed) {
      run += 1;
      daysCompleted += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].completed) current += 1;
    else break;
  }
  return { current, longest, daysCompleted };
}

/** Last 7 calendar days ending today, oldest first, for the week-strip display. */
export function getLastSevenDays(history: HistoryEntry[], todayKey: string): HistoryEntry[] {
  const byDate = new Map(history.map((h) => [h.date, h.completed]));
  const days: HistoryEntry[] = [];
  const today = new Date(`${todayKey}T00:00:00`);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    days.push({ date: key, completed: byDate.get(key) ?? false });
  }
  return days;
}
