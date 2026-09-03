import type { ChallengeParticipant, ChallengeStatus } from './types';

const DAY_MS = 86_400_000;

export function percentComplete(progress: number, goalTarget: number): number {
  if (goalTarget <= 0) return 0;
  return Math.min(100, Math.round((progress / goalTarget) * 100));
}

/** Whole days left until (and including) end_date, from "today" — null once the window has closed. */
export function daysRemaining(endDate: string, today: Date = new Date()): number | null {
  const todayKey = today.toISOString().slice(0, 10);
  if (endDate < todayKey) return null;
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const start = new Date(`${todayKey}T00:00:00Z`).getTime();
  return Math.round((end - start) / DAY_MS);
}

/**
 * Pure status transition: a challenge only ever moves active -> completed
 * (goal reached) or active -> expired (window closed short of the goal).
 * Anything already completed/expired/cancelled stays put — this never
 * "un-completes" a challenge even if, e.g., the goal target were edited.
 */
export function resolveStatus(currentStatus: ChallengeStatus, progress: number, goalTarget: number, endDate: string, today: Date = new Date()): ChallengeStatus {
  if (currentStatus !== 'active') return currentStatus;
  if (progress >= goalTarget) return 'completed';
  const todayKey = today.toISOString().slice(0, 10);
  if (endDate < todayKey) return 'expired';
  return 'active';
}

/** Top 3 by contribution, positive only — the same "no negative rankings" rule the class leaderboard already applies. */
export function topContributors(participants: ChallengeParticipant[]): ChallengeParticipant[] {
  return [...participants]
    .filter((p) => p.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
}
