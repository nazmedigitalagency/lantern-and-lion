// Client Storage & Synchronization for Leagues & Seasons
//
// Manages local state, offline fallback, seed participants for competition pods,
// and records completed season history.

import { awardCoins, awardGems, getWallet } from '../economy/wallet-service';
import { getCurrentSeason, getTierForXp, MAX_POD_SIZE, PROMOTION_PERCENTILE } from './config';
import type { LeaderboardParticipant, LeaguePod, SeasonCertificate, SeasonResult } from './types';

const SEASON_XP_KEY = 'lanternLionSeasonXp';
const SEASON_HISTORY_KEY = 'lanternLionSeasonHistory';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Reads season XP for this profile (scoped to seasonId) */
export function getSeasonXp(profileId: number | string, seasonId = getCurrentSeason().id): number {
  if (typeof window === 'undefined') return 0;
  const store = safeParse<Record<string, Record<string, number>>>(localStorage.getItem(SEASON_XP_KEY), {});
  const profileStore = store[String(profileId)] || {};
  if (profileStore[seasonId] !== undefined) {
    return profileStore[seasonId];
  }
  // If not seeded, default initial season XP to a healthy fraction of wallet XP
  const wallet = getWallet(profileId);
  const initial = Math.min(wallet.xp, Math.round(wallet.xp * 0.45));
  setSeasonXp(profileId, initial, seasonId);
  return initial;
}

/** Saves season XP for this profile */
export function setSeasonXp(profileId: number | string, xp: number, seasonId = getCurrentSeason().id): void {
  if (typeof window === 'undefined') return;
  const store = safeParse<Record<string, Record<string, number>>>(localStorage.getItem(SEASON_XP_KEY), {});
  const key = String(profileId);
  if (!store[key]) store[key] = {};
  store[key][seasonId] = Math.max(0, xp);
  localStorage.setItem(SEASON_XP_KEY, JSON.stringify(store));
}

/** Adds XP to the current season XP */
export function addSeasonXp(profileId: number | string, amount: number, seasonId = getCurrentSeason().id): number {
  const current = getSeasonXp(profileId, seasonId);
  const next = current + Math.max(0, Math.round(amount));
  setSeasonXp(profileId, next, seasonId);
  return next;
}

/** Seed realistic, child-safe companion participants in a pod */
const SEED_COMPANIONS = [
  { name: 'Noah B.', avatar: 'dove', skinTone: 'fair', hairStyle: 'short', xpOffset: 420 },
  { name: 'Amara A.', avatar: 'lion', skinTone: 'honey', hairStyle: 'curls', xpOffset: 340 },
  { name: 'Mia K.', avatar: 'lantern', skinTone: 'amber', hairStyle: 'waves', xpOffset: 280 },
  { name: 'David M.', avatar: 'star', skinTone: 'olive', hairStyle: 'fade', xpOffset: 210 },
  { name: 'Sarah B.', avatar: 'dove', skinTone: 'sand', hairStyle: 'braids', xpOffset: 160 },
  { name: 'Daniel O.', avatar: 'lion', skinTone: 'walnut', hairStyle: 'coils', xpOffset: 90 },
  { name: 'Esther T.', avatar: 'star', skinTone: 'fair', hairStyle: 'ponytail', xpOffset: 40 },
  { name: 'Samuel L.', avatar: 'lantern', skinTone: 'honey', hairStyle: 'short', xpOffset: -30 },
  { name: 'Hannah R.', avatar: 'dove', skinTone: 'cocoa', hairStyle: 'curls', xpOffset: -90 },
  { name: 'Caleb F.', avatar: 'lion', skinTone: 'amber', hairStyle: 'afro', xpOffset: -140 },
  { name: 'Ruth P.', avatar: 'star', skinTone: 'espresso', hairStyle: 'braids', xpOffset: -210 },
  { name: 'Elijah G.', avatar: 'lantern', skinTone: 'olive', hairStyle: 'short', xpOffset: -290 },
  { name: 'Chloe D.', avatar: 'dove', skinTone: 'sand', hairStyle: 'waves', xpOffset: -360 },
  { name: 'Joshua K.', avatar: 'lion', skinTone: 'honey', hairStyle: 'fade', xpOffset: -450 },
  { name: 'Grace N.', avatar: 'star', skinTone: 'walnut', hairStyle: 'coils', xpOffset: -520 },
];

/** Loads or generates the user's league pod */
export function getLeaguePod(
  profileId: number,
  profileName: string,
  age: number,
  avatar = 'lion',
  appearance?: { skinTone?: string; hairStyle?: string; clothing?: string }
): LeaguePod {
  const season = getCurrentSeason();
  const ageGroup: 'child' | 'teen' = age >= 13 ? 'teen' : 'child';
  const userSeasonXp = getSeasonXp(profileId, season.id);
  const userTier = getTierForXp(userSeasonXp);
  const podId = `pod-${season.id}-${userTier}-${ageGroup}`;

  const currentWallet = getWallet(profileId);

  // Generate participant list
  const baseScore = userSeasonXp || 250;
  const simulated: LeaderboardParticipant[] = SEED_COMPANIONS.slice(0, MAX_POD_SIZE - 1).map((comp, idx) => {
    const rawXp = Math.max(20, baseScore + comp.xpOffset);
    return {
      id: `bot-${idx + 1}`,
      displayName: comp.name,
      avatar: comp.avatar,
      skinTone: comp.skinTone,
      hairStyle: comp.hairStyle,
      seasonXp: rawXp,
      lifetimeXp: rawXp + 800,
      rank: 0,
      streakDays: Math.max(1, (idx % 8) + 1),
      isCurrentUser: false,
      ageGroup,
      tier: userTier,
      lastActiveIso: new Date(Date.now() - (idx * 3600000 + 1800000)).toISOString(),
    };
  });

  const currentUserParticipant: LeaderboardParticipant = {
    id: profileId,
    displayName: profileName || 'You',
    avatar,
    skinTone: appearance?.skinTone || 'honey',
    hairStyle: appearance?.hairStyle || 'curls',
    clothing: appearance?.clothing || 'starter-tunic',
    seasonXp: userSeasonXp,
    lifetimeXp: currentWallet.xp,
    rank: 0,
    streakDays: 3,
    isCurrentUser: true,
    ageGroup,
    tier: userTier,
    lastActiveIso: new Date().toISOString(),
  };

  const all = [...simulated, currentUserParticipant];

  // Sort descending with deterministic tie-breaker (score first, then id)
  all.sort((a, b) => {
    if (b.seasonXp !== a.seasonXp) return b.seasonXp - a.seasonXp;
    return String(a.id).localeCompare(String(b.id));
  });

  // Assign ranks
  all.forEach((p, i) => {
    p.rank = i + 1;
  });

  const promotionCutoffRank = Math.max(3, Math.round(all.length * PROMOTION_PERCENTILE));
  const relegationCutoffRank = Math.max(all.length - 3, all.length);

  return {
    id: podId,
    seasonId: season.id,
    tier: userTier,
    ageGroup,
    participants: all,
    promotionCutoffRank,
    relegationCutoffRank,
  };
}

/** Reads season history for this user */
export function getSeasonHistory(profileId: number): SeasonResult[] {
  if (typeof window === 'undefined') return [];
  const store = safeParse<Record<string, SeasonResult[]>>(localStorage.getItem(SEASON_HISTORY_KEY), {});
  return store[profileId] || [];
}

/** Claims season end reward for a past season */
export function claimSeasonReward(profileId: number, seasonId: string): { success: boolean; result?: SeasonResult } {
  if (typeof window === 'undefined') return { success: false };
  const store = safeParse<Record<string, SeasonResult[]>>(localStorage.getItem(SEASON_HISTORY_KEY), {});
  const list = store[profileId] || [];
  const item = list.find((r) => r.seasonId === seasonId);

  if (!item || item.rewardClaimed) return { success: false };

  item.rewardClaimed = true;
  if (item.rewards.coins > 0) awardCoins(profileId, item.rewards.coins, 'challenge', `Season reward: ${item.seasonName}`);
  if (item.rewards.gems > 0) awardGems(profileId, item.rewards.gems, 'challenge', `Season reward: ${item.seasonName}`);

  store[profileId] = list;
  localStorage.setItem(SEASON_HISTORY_KEY, JSON.stringify(store));

  return { success: true, result: item };
}

/** Generates a verifiable digital certificate */
export function generateCertificate(result: SeasonResult, recipientName: string): SeasonCertificate {
  const verificationCode = `LL-${result.seasonNumber}-${result.finalTier.toUpperCase().slice(0, 3)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  return {
    id: result.certificateId || `cert-${result.seasonId}`,
    recipientName,
    seasonName: result.seasonName,
    seasonNumber: result.seasonNumber,
    tier: result.finalTier,
    finalRank: result.finalRank,
    totalSeasonXp: result.totalSeasonXp,
    completedAt: result.completedDate,
    verificationCode,
  };
}
