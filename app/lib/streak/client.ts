'use client';

import { milestoneForDays, type StreakMilestone } from './config';
import { awardCoins, awardGems } from '../economy/wallet-service';

const CLAIMED_KEY = 'lanternLionStreakMilestonesClaimed';

function readClaimed(profileId: number | string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const all = JSON.parse(localStorage.getItem(CLAIMED_KEY) || '{}');
    return Array.isArray(all[profileId]) ? all[profileId] : [];
  } catch {
    return [];
  }
}

function writeClaimed(profileId: number | string, days: number[]) {
  try {
    const all = JSON.parse(localStorage.getItem(CLAIMED_KEY) || '{}');
    all[profileId] = days;
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(all));
  } catch {
    // Non-blocking.
  }
}

/**
 * The server tracks the streak counter itself; the actual Coins/Gems for a
 * milestone go through the app's existing (client-side) wallet, exactly like
 * every other reward in this app (games, daily quests). Guards against
 * awarding the same milestone twice by remembering which days were already
 * claimed for this profile, so refreshing the dashboard never re-awards it.
 */
export function claimStreakMilestoneIfNew(profileId: number | string, currentStreak: number): StreakMilestone | null {
  const milestone = milestoneForDays(currentStreak);
  if (!milestone) return null;

  const claimed = readClaimed(profileId);
  if (claimed.includes(currentStreak)) return null;

  awardCoins(profileId, milestone.coins, 'streak', `${milestone.label} — ${milestone.days}-day streak`);
  if (milestone.gems > 0) awardGems(profileId, milestone.gems, 'streak', `${milestone.label} — ${milestone.days}-day streak`);

  writeClaimed(profileId, [...claimed, currentStreak]);
  return milestone;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
