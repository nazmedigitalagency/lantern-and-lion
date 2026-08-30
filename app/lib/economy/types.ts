// Economy data model — XP, Coins, Gems and the transaction ledger.
//
// This is the one place that defines what a currency transaction looks
// like. Adventure World, Character Progression, and every future
// system (Arcade, daily quests, boss battles, church/friend
// challenges) record rewards through this shape instead of each
// inventing their own "+XP" bookkeeping.

export type CurrencyType = 'xp' | 'coins' | 'gems';

/**
 * Where a reward came from. Keep this list growing as real features
 * ship — `quest` and `quest-mastery` are wired up today (Adventure
 * World); the rest are reserved so the Arcade, daily quests,
 * achievements, etc. can award through the same function later
 * without inventing a new source vocabulary.
 */
export type RewardSource =
  | 'quest'
  | 'quest-mastery'
  | 'region-complete'
  | 'story-completion'
  | 'reading'
  | 'minigame'
  | 'memory-verse'
  | 'daily-quest'
  | 'achievement'
  | 'challenge'
  | 'streak';

export type Transaction = {
  id: string;
  type: CurrencyType;
  /** Positive = earned, negative = spent. */
  amount: number;
  source: RewardSource;
  description: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
};

export type Wallet = {
  xp: number;
  coins: number;
  gems: number;
};

export type LevelUpResult = {
  previousLevel: number;
  newLevel: number;
};

export type AwardResult = {
  transaction: Transaction;
  wallet: Wallet;
  levelUp: LevelUpResult | null;
};
