// Configurable reward amounts for Adventure World. Nothing in the UI
// should hardcode a reward number — call into this table, or (for
// Adventure World quests specifically) the per-quest
// `reward.xp`/`reward.collectible` already defined in
// `adventure/world-data.ts`, which stays the source of truth for
// quest-specific amounts.
//
// Daily Quests and the Arcade each ended up with their own, more
// specific reward config once they were built (`daily-quests/catalog.ts`
// template xp/coins; `arcade/catalog.ts` baseXp + `computeGameReward`) —
// that's the right place for a feature's own reward tuning, so this
// file only keeps what Adventure World's reconciliation actually reads.

/** Flat coin amount for finishing any Adventure World quest. */
export const COINS_PER_QUEST_COMPLETE = 15;

/** Gems for replaying a completed quest to mastery — a deliberate, earned action. */
export const GEMS_PER_QUEST_MASTERY = 1;

/** Bonus for fully completing a region — a rarer, bigger moment. */
export const REGION_COMPLETE_BONUS = { xp: 50, coins: 40, gems: 3 };
