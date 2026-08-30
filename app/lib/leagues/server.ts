// Server-Side League & Season Settlement Engine
//
// Computes ranks, enforces anti-grind daily caps, determines promotions,
// and ensures rewards are calculated strictly on the backend.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getCurrentSeason,
  getSeasonReward,
  getTierForXp,
  MAX_DAILY_XP_PER_SINGLE_MINIGAME,
} from './config';
import type { LeaderboardParticipant, LeaguePod, LeagueTierId, SeasonConfig, SeasonResult } from './types';

/**
 * Validates whether XP earned by an activity can contribute to League Season XP.
 * Prevents repetitive grinding of the same minigame on the same day.
 */
export function validateEligibleLeagueXp(
  eventType: string,
  rawAmount: number,
  todaySameEventXpTotal = 0
): number {
  if (rawAmount <= 0) return 0;

  // Repetitive minigame cap
  if (eventType === 'GAME_COMPLETED' || eventType === 'minigame') {
    const remainingCap = Math.max(0, MAX_DAILY_XP_PER_SINGLE_MINIGAME - todaySameEventXpTotal);
    return Math.min(rawAmount, remainingCap);
  }

  // Lessons, Quests, Scripture memorization are full-value educational activities
  return rawAmount;
}

/**
 * Server calculation for settling a finished season and computing promotion.
 */
export function settleSeasonForParticipant(
  participant: LeaderboardParticipant,
  season: SeasonConfig,
  pod: LeaguePod
): SeasonResult {
  const isPromoted = participant.rank <= pod.promotionCutoffRank && participant.tier !== 'lion';
  const nextTierMap: Record<LeagueTierId, LeagueTierId> = {
    bronze: 'silver',
    silver: 'gold',
    gold: 'lion',
    lion: 'lion',
  };

  const promotedTo = isPromoted ? nextTierMap[participant.tier] : undefined;
  const rewards = getSeasonReward(participant.tier, participant.rank);

  return {
    seasonId: season.id,
    seasonName: season.name,
    seasonNumber: season.seasonNumber,
    completedDate: new Date().toISOString(),
    finalTier: participant.tier,
    finalRank: participant.rank,
    totalSeasonXp: participant.seasonXp,
    activitiesCompleted: Math.max(1, Math.round(participant.seasonXp / 45)),
    promotedTo,
    rewardClaimed: false,
    rewards,
    certificateId: `cert-${season.id}-${participant.id}`,
  };
}

/**
 * Fetches server-verified leaderboard pod for an active user.
 */
export async function getVerifiedLeaguePod(
  admin: SupabaseClient,
  childId: string,
  seasonId = getCurrentSeason().id
): Promise<LeaguePod | null> {
  try {
    const { data: participantData } = await admin
      .from('season_participants')
      .select('*, children(name, avatar, age)')
      .eq('season_id', seasonId)
      .eq('child_id', childId)
      .maybeSingle();

    if (!participantData) return null;

    const { data: podList } = await admin
      .from('season_participants')
      .select('*, children(name, avatar, age)')
      .eq('season_id', seasonId)
      .eq('pod_id', participantData.pod_id)
      .order('season_xp', { ascending: false });

    if (!podList || podList.length === 0) return null;

    const participants: LeaderboardParticipant[] = podList.map((p, idx) => ({
      id: p.child_id,
      displayName: p.children?.name || 'Explorer',
      avatar: p.children?.avatar || 'lion',
      seasonXp: p.season_xp || 0,
      lifetimeXp: p.lifetime_xp || p.season_xp || 0,
      rank: idx + 1,
      streakDays: p.streak_days || 1,
      isCurrentUser: p.child_id === childId,
      ageGroup: (p.children?.age || 8) >= 13 ? 'teen' : 'child',
      tier: p.league_tier || getTierForXp(p.season_xp || 0),
      lastActiveIso: p.updated_at || new Date().toISOString(),
    }));

    return {
      id: participantData.pod_id,
      seasonId,
      tier: participantData.league_tier,
      ageGroup: (participantData.children?.age || 8) >= 13 ? 'teen' : 'child',
      participants,
      promotionCutoffRank: Math.max(3, Math.round(participants.length * 0.2)),
      relegationCutoffRank: Math.max(participants.length - 3, participants.length),
    };
  } catch {
    return null;
  }
}
