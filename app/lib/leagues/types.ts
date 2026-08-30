// League and Seasonal Progression Data Models
//
// Supports competitive tiers, recurring seasons, manageable pods,
// promotion mechanics, rewards, and long-term season histories.

export type LeagueTierId = 'bronze' | 'silver' | 'gold' | 'lion';

export type LeagueTier = {
  id: LeagueTierId;
  name: string;
  emoji: string;
  minXp: number;
  maxXp: number | null;
  badgeTone: string;
  description: string;
};

export type SeasonReward = {
  coins: number;
  gems: number;
  badgeId: string;
  title: string;
  cosmeticItemId?: string;
};

export type SeasonConfig = {
  id: string;
  name: string;
  seasonNumber: number;
  startDate: string; // ISO String
  endDate: string; // ISO String
  durationDays: number;
  status: 'active' | 'completed' | 'upcoming';
  description: string;
};

export type LeaderboardParticipant = {
  id: number | string;
  displayName: string;
  avatar: string;
  skinTone?: string;
  hairStyle?: string;
  clothing?: string;
  seasonXp: number;
  lifetimeXp: number;
  rank: number;
  streakDays: number;
  isCurrentUser: boolean;
  ageGroup: 'child' | 'teen';
  tier: LeagueTierId;
  lastActiveIso: string;
};

export type LeaguePod = {
  id: string;
  seasonId: string;
  tier: LeagueTierId;
  ageGroup: 'child' | 'teen';
  participants: LeaderboardParticipant[];
  promotionCutoffRank: number; // e.g. Top 5 promoted
  relegationCutoffRank: number; // e.g. Bottom 5 relegated / stay
};

export type SeasonResult = {
  seasonId: string;
  seasonName: string;
  seasonNumber: number;
  completedDate: string;
  finalTier: LeagueTierId;
  finalRank: number;
  totalSeasonXp: number;
  activitiesCompleted: number;
  promotedTo?: LeagueTierId;
  rewardClaimed: boolean;
  rewards: SeasonReward;
  certificateId: string;
};

export type SeasonCertificate = {
  id: string;
  recipientName: string;
  seasonName: string;
  seasonNumber: number;
  tier: LeagueTierId;
  finalRank: number;
  totalSeasonXp: number;
  completedAt: string;
  verificationCode: string;
};
