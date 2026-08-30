// Centralized Configuration for Leagues & Seasons
//
// Single source of truth for league thresholds, season durations,
// promotion rules, anti-grind caps, and season rewards.

import type { LeagueTier, LeagueTierId, SeasonConfig, SeasonReward } from './types';

export const LEAGUE_TIERS: Record<LeagueTierId, LeagueTier> = {
  bronze: {
    id: 'bronze',
    name: 'Bronze League',
    emoji: '🥉',
    minXp: 0,
    maxXp: 1000,
    badgeTone: '#d97706',
    description: 'Where every Bible explorer begins their seasonal journey.',
  },
  silver: {
    id: 'silver',
    name: 'Silver League',
    emoji: '🥈',
    minXp: 1000,
    maxXp: 3000,
    badgeTone: '#64748b',
    description: 'Dedicated learners steady in Scripture study and quests.',
  },
  gold: {
    id: 'gold',
    name: 'Gold League',
    emoji: '🥇',
    minXp: 3000,
    maxXp: 7500,
    badgeTone: '#f59e0b',
    description: 'Steadfast champions exploring deep biblical stories and cases.',
  },
  lion: {
    id: 'lion',
    name: 'Lion League',
    emoji: '🦁',
    minXp: 7500,
    maxXp: null,
    badgeTone: '#7c3aed',
    description: 'The highest tier of faith, wisdom, and active learning.',
  },
};

export const LEAGUE_TIER_ORDER: LeagueTierId[] = ['bronze', 'silver', 'gold', 'lion'];

/** Default season duration in days (configurable) */
export const DEFAULT_SEASON_DURATION_DAYS = 21;

/** Max participants in a single manageable competition pod */
export const MAX_POD_SIZE = 25;

/** Promotion percentages within each pod */
export const PROMOTION_PERCENTILE = 0.20; // Top 20% advance
export const RELEGATION_PERCENTILE = 0.20; // Bottom 20% gentle warning/hold

/** Anti-grind parameters */
export const MAX_DAILY_XP_PER_SINGLE_MINIGAME = 300;
export const QUEST_COMPLETION_BONUS_XP = 25;

/** Rewards configuration by final rank and tier */
export function getSeasonReward(tier: LeagueTierId, rank: number): SeasonReward {
  switch (tier) {
    case 'lion':
      if (rank === 1) {
        return {
          coins: 600,
          gems: 15,
          badgeId: 'lion_champion',
          title: 'Lion League Champion',
          cosmeticItemId: 'golden-cloak',
        };
      }
      if (rank <= 3) {
        return {
          coins: 450,
          gems: 10,
          badgeId: 'lion_podium',
          title: 'Lion Vanguard',
          cosmeticItemId: 'scouts-hood',
        };
      }
      return {
        coins: 300,
        gems: 6,
        badgeId: 'lion_finisher',
        title: 'Lion Conqueror',
      };

    case 'gold':
      if (rank === 1) {
        return {
          coins: 400,
          gems: 10,
          badgeId: 'gold_champion',
          title: 'Gold Crown Champion',
          cosmeticItemId: 'kingdom-crown',
        };
      }
      if (rank <= 3) {
        return {
          coins: 300,
          gems: 6,
          badgeId: 'gold_podium',
          title: 'Gold Path Leader',
        };
      }
      return {
        coins: 200,
        gems: 4,
        badgeId: 'gold_finisher',
        title: 'Scripture Scholar',
      };

    case 'silver':
      if (rank === 1) {
        return {
          coins: 250,
          gems: 5,
          badgeId: 'silver_champion',
          title: 'Silver Trailblazer',
        };
      }
      if (rank <= 3) {
        return {
          coins: 180,
          gems: 3,
          badgeId: 'silver_podium',
          title: 'Silver Explorer',
        };
      }
      return {
        coins: 120,
        gems: 2,
        badgeId: 'silver_finisher',
        title: 'Steadfast Explorer',
      };

    case 'bronze':
    default:
      if (rank === 1) {
        return {
          coins: 150,
          gems: 3,
          badgeId: 'bronze_champion',
          title: 'Bronze Star Champion',
        };
      }
      if (rank <= 3) {
        return {
          coins: 100,
          gems: 2,
          badgeId: 'bronze_podium',
          title: 'Bronze Pioneer',
        };
      }
      return {
        coins: 60,
        gems: 1,
        badgeId: 'season_participant',
        title: 'Season Explorer',
      };
  }
}

/** Generates the current active season dynamically based on start date anchor */
export function getCurrentSeason(customDurationDays = DEFAULT_SEASON_DURATION_DAYS): SeasonConfig {
  // Season 1 anchor date: August 31, 2026
  const anchorTime = Date.parse('2026-08-31T00:00:00Z');
  const now = Date.now();
  const seasonDurationMs = customDurationDays * 86_400_000;

  const seasonsPassed = Math.max(0, Math.floor((now - anchorTime) / seasonDurationMs));
  const seasonNumber = seasonsPassed + 1;

  const currentSeasonStartMs = anchorTime + seasonsPassed * seasonDurationMs;
  const currentSeasonEndMs = currentSeasonStartMs + seasonDurationMs;

  const seasonNames = [
    'Rise of the Lions',
    'Walk in the Light',
    'Shield of Faith',
    'Kingdom Explorers',
    'Dawn of Courage',
    'Living Water Trails',
  ];
  const name = `Season ${seasonNumber}: ${seasonNames[(seasonNumber - 1) % seasonNames.length]}`;

  return {
    id: `season-${seasonNumber}`,
    name,
    seasonNumber,
    startDate: new Date(currentSeasonStartMs).toISOString(),
    endDate: new Date(currentSeasonEndMs).toISOString(),
    durationDays: customDurationDays,
    status: 'active',
    description: 'Compete with fellow explorers in your league pod through daily Bible adventures!',
  };
}

/** Determines tier from seasonal XP */
export function getTierForXp(seasonXp: number): LeagueTierId {
  if (seasonXp >= 7500) return 'lion';
  if (seasonXp >= 3000) return 'gold';
  if (seasonXp >= 1000) return 'silver';
  return 'bronze';
}

/** Next tier progress helper */
export function getTierProgress(seasonXp: number): {
  currentTier: LeagueTier;
  nextTier: LeagueTier | null;
  progressPercent: number;
  xpToNext: number;
} {
  const tierId = getTierForXp(seasonXp);
  const currentTier = LEAGUE_TIERS[tierId];
  const currentIndex = LEAGUE_TIER_ORDER.indexOf(tierId);
  const nextTierId = LEAGUE_TIER_ORDER[currentIndex + 1] as LeagueTierId | undefined;
  const nextTier = nextTierId ? LEAGUE_TIERS[nextTierId] : null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      xpToNext: 0,
    };
  }

  const span = nextTier.minXp - currentTier.minXp;
  const delta = Math.max(0, seasonXp - currentTier.minXp);
  const progressPercent = Math.min(100, Math.round((delta / span) * 100));
  const xpToNext = Math.max(0, nextTier.minXp - seasonXp);

  return {
    currentTier,
    nextTier,
    progressPercent,
    xpToNext,
  };
}

export function getDaysRemaining(endDateIso: string, referenceTimeMs = Date.now()): number {
  const endMs = Date.parse(endDateIso);
  return Math.max(1, Math.ceil((endMs - referenceTimeMs) / 86_400_000));
}

