import type { SupabaseClient } from '@supabase/supabase-js';
import { activityDateKey } from '../activity/server';
import { GRACE_REPLENISH_MILESTONES, INITIAL_GRACE_DAYS, MAX_GRACE_DAYS, milestoneForDays, nextMilestone, type StreakMilestone } from './config';

function daysBetweenDateKeys(earlier: string, later: string): number {
  // Both are plain YYYY-MM-DD date keys (already computed in the family's
  // timezone), so comparing them as UTC-midnight instants is safe and avoids
  // DST edge cases — neither side carries a time-of-day component.
  const a = Date.parse(`${earlier}T00:00:00Z`);
  const b = Date.parse(`${later}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Pure calendar-date arithmetic on a YYYY-MM-DD key — never reinterpreted through a timezone. */
function addDaysToDateKey(dateKey: string, days: number): string {
  const instant = Date.parse(`${dateKey}T00:00:00Z`) + days * 86_400_000;
  return new Date(instant).toISOString().slice(0, 10);
}

export type StreakRow = {
  child_id: string;
  current_streak: number;
  longest_streak: number;
  last_qualified_date: string | null;
  grace_days: number;
};

async function getOrCreateStreakRow(admin: SupabaseClient, childId: string): Promise<StreakRow> {
  const { data } = await admin.from('streak_state').select('*').eq('child_id', childId).maybeSingle();
  if (data) return data as StreakRow;

  const fresh: StreakRow = { child_id: childId, current_streak: 0, longest_streak: 0, last_qualified_date: null, grace_days: INITIAL_GRACE_DAYS };
  await admin.from('streak_state').insert(fresh);
  return fresh;
}

export type QualifyResult = {
  streak: StreakRow;
  isNewQualification: boolean;
  graceUsed: boolean;
  streakReset: boolean;
  previousStreak: number;
  newMilestone: StreakMilestone | null;
};

/**
 * The one place a streak day is ever recorded. Called once per
 * streak-eligible activity event; safe to call repeatedly the same day
 * (idempotent — a second call the same local day is a no-op).
 */
export async function qualifyStreakDay(admin: SupabaseClient, childId: string, timezone: string): Promise<QualifyResult> {
  const todayKey = activityDateKey(timezone);
  const row = await getOrCreateStreakRow(admin, childId);

  if (row.last_qualified_date === todayKey) {
    // Already qualified today — multiple activities in one day still count as one streak day.
    return { streak: row, isNewQualification: false, graceUsed: false, streakReset: false, previousStreak: row.current_streak, newMilestone: null };
  }

  const previousStreak = row.current_streak;
  let nextStreak: number;
  let graceUsed = false;
  let streakReset = false;
  let graceDays = row.grace_days;

  if (!row.last_qualified_date) {
    nextStreak = 1;
  } else {
    const gap = daysBetweenDateKeys(row.last_qualified_date, todayKey);
    if (gap === 1) {
      nextStreak = row.current_streak + 1;
    } else if (gap === 2 && row.grace_days > 0) {
      // Exactly one missed day, and a Grace Day is available — protect the streak.
      graceUsed = true;
      graceDays -= 1;
      nextStreak = row.current_streak + 1;
      const missedDate = addDaysToDateKey(row.last_qualified_date, 1);
      await admin.from('streak_grace_log').upsert({ child_id: childId, missed_date: missedDate }, { onConflict: 'child_id,missed_date', ignoreDuplicates: true });
    } else {
      // Missed more than one day, or no Grace Day left to cover it.
      streakReset = previousStreak > 0;
      nextStreak = 1;
    }
  }

  const longestStreak = Math.max(row.longest_streak, nextStreak);

  let milestone = milestoneForDays(nextStreak) || null;
  if (milestone) {
    const { error: claimError } = await admin.from('streak_milestone_claims').insert({ child_id: childId, milestone: nextStreak });
    if (claimError) milestone = null; // Already claimed (unique constraint) — never award twice.
    else if (GRACE_REPLENISH_MILESTONES.has(nextStreak)) {
      graceDays = Math.min(MAX_GRACE_DAYS, graceDays + 1);
    }
  }

  const updated: StreakRow = { child_id: childId, current_streak: nextStreak, longest_streak: longestStreak, last_qualified_date: todayKey, grace_days: graceDays };
  await admin.from('streak_state').update({
    current_streak: updated.current_streak,
    longest_streak: updated.longest_streak,
    last_qualified_date: updated.last_qualified_date,
    grace_days: updated.grace_days,
    updated_at: new Date().toISOString(),
  }).eq('child_id', childId);

  return { streak: updated, isNewQualification: true, graceUsed, streakReset, previousStreak, newMilestone: milestone };
}

export type StreakStatus = {
  currentStreak: number;
  longestStreak: number;
  graceDays: number;
  todayQualified: boolean;
  nextMilestone: StreakMilestone | null;
  streakEndedRecently: boolean;
};

/**
 * Read-only view for dashboards. Never writes — a streak that has silently
 * lapsed (no qualifying activity has come in since) is reported as ended
 * here without touching the database; the actual reset is persisted lazily,
 * the next time the child completes something (see `qualifyStreakDay`).
 */
export async function getStreakStatus(admin: SupabaseClient, childId: string, timezone: string): Promise<StreakStatus> {
  const row = await getOrCreateStreakRow(admin, childId);
  const todayKey = activityDateKey(timezone);

  if (!row.last_qualified_date) {
    return { currentStreak: 0, longestStreak: row.longest_streak, graceDays: row.grace_days, todayQualified: false, nextMilestone: nextMilestone(0), streakEndedRecently: false };
  }

  const gap = daysBetweenDateKeys(row.last_qualified_date, todayKey);
  const stillAlive = gap <= 1 || (gap === 2 && row.grace_days > 0);
  const effectiveStreak = stillAlive ? row.current_streak : 0;

  return {
    currentStreak: effectiveStreak,
    longestStreak: row.longest_streak,
    graceDays: row.grace_days,
    todayQualified: gap === 0,
    nextMilestone: nextMilestone(effectiveStreak),
    streakEndedRecently: !stillAlive && row.current_streak > 0,
  };
}

export type StreakCalendarDay = { date: string; state: 'complete' | 'grace' | 'pending' | 'none' };

/** Day-by-day history for the streak calendar view — completed / grace-protected / missed. */
export async function getStreakCalendar(admin: SupabaseClient, childId: string, timezone: string, days: number): Promise<StreakCalendarDay[]> {
  const todayKey = activityDateKey(timezone);
  const dateKeys: string[] = Array.from({ length: days }, (_, i) => addDaysToDateKey(todayKey, i - (days - 1)));

  const { data: summaries } = await admin
    .from('daily_activity_summary')
    .select('activity_date, games_completed, lessons_completed, quests_completed')
    .eq('child_id', childId)
    .gte('activity_date', dateKeys[0])
    .lte('activity_date', dateKeys[dateKeys.length - 1]);

  const { data: graceDates } = await admin
    .from('streak_grace_log')
    .select('missed_date')
    .eq('child_id', childId)
    .gte('missed_date', dateKeys[0])
    .lte('missed_date', dateKeys[dateKeys.length - 1]);

  const graceSet = new Set((graceDates || []).map((g) => g.missed_date as string));

  return dateKeys.map((date) => {
    if (graceSet.has(date)) return { date, state: 'grace' as const };
    const summary = summaries?.find((s) => s.activity_date === date);
    const completed = summary && (summary.games_completed > 0 || summary.lessons_completed > 0 || summary.quests_completed > 0);
    if (completed) return { date, state: 'complete' as const };
    if (date === todayKey) return { date, state: 'pending' as const };
    return { date, state: 'none' as const };
  });
}
