import type { ActivityEventType } from '../activity/server';

/**
 * Centralized definition of what counts toward a streak day — completing
 * something, not opening the app. Logging in, viewing a profile, visiting
 * the shop, or changing an avatar never appear here on purpose.
 */
export const STREAK_ELIGIBLE_EVENTS: ReadonlySet<ActivityEventType> = new Set([
  'GAME_COMPLETED',
  'LESSON_COMPLETED',
  'QUEST_COMPLETED',
]);

export function isStreakEligibleEvent(eventType: string): boolean {
  return STREAK_ELIGIBLE_EVENTS.has(eventType as ActivityEventType);
}

export const INITIAL_GRACE_DAYS = 2;
export const MAX_GRACE_DAYS = 2;
/** Long-term engagement replenishes one Grace Day, capped at MAX_GRACE_DAYS. */
export const GRACE_REPLENISH_MILESTONES = new Set([30, 60, 100]);

export type StreakMilestone = { days: number; coins: number; gems: number; label: string };

/** Single source of truth for streak milestone rewards — extend here, not in components. */
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, coins: 20, gems: 0, label: 'First Flame' },
  { days: 7, coins: 50, gems: 0, label: 'Week Warrior' },
  { days: 14, coins: 100, gems: 2, label: 'Fortnight Faithful' },
  { days: 30, coins: 250, gems: 5, label: 'Faithful Learner' },
  { days: 60, coins: 400, gems: 8, label: 'Steadfast Scholar' },
  { days: 100, coins: 750, gems: 15, label: 'Learning Legend' },
];

export function nextMilestone(currentStreak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.days > currentStreak) || null;
}

export function milestoneForDays(days: number): StreakMilestone | undefined {
  return STREAK_MILESTONES.find((m) => m.days === days);
}
