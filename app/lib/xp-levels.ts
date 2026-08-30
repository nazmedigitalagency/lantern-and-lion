// Shared XP → Level configuration.
//
// This is the one place that defines what a "level" means across the
// whole app (Adventure World region/quest gating, the Character
// profile, and later the arcade/daily quests/achievements). Nothing
// else should hardcode level thresholds or titles — call
// `getLevelInfo(xp)` instead, so changing the ladder here changes it
// everywhere at once.

export type LevelMilestone = { level: number; xpRequired: number; title: string };

/** Edit this list to retune the whole game's pacing — nothing else needs to change. */
export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 1, xpRequired: 0, title: 'New Explorer' },
  { level: 5, xpRequired: 350, title: 'Scripture Scout' },
  { level: 10, xpRequired: 900, title: 'Kingdom Adventurer' },
  { level: 20, xpRequired: 2000, title: 'Faith Champion' },
  { level: 30, xpRequired: 3600, title: 'Kingdom Guardian' },
  { level: 50, xpRequired: 7000, title: 'Lion Guardian' },
];

export type LevelInfo = {
  level: number;
  title: string;
  xp: number;
  /** XP required to reach the current level. */
  currentLevelXp: number;
  /** XP required to reach the next level, or null if at the max defined level. */
  nextLevelXp: number | null;
  /** XP earned since hitting the current level. */
  xpIntoLevel: number;
  /** XP still needed to reach the next level, or null at max level. */
  xpToNextLevel: number | null;
  /** 0-100, how far through the current level the player is. */
  progressPercent: number;
};

const MAX_LEVEL = LEVEL_MILESTONES[LEVEL_MILESTONES.length - 1].level;

/** Full 1..MAX_LEVEL xpRequired table, linearly interpolated between named milestones. */
const LEVEL_XP_TABLE: number[] = (() => {
  const table = new Array<number>(MAX_LEVEL + 1).fill(0);
  for (let i = 0; i < LEVEL_MILESTONES.length - 1; i++) {
    const start = LEVEL_MILESTONES[i];
    const end = LEVEL_MILESTONES[i + 1];
    const span = end.level - start.level;
    for (let level = start.level; level <= end.level; level++) {
      const t = (level - start.level) / span;
      table[level] = Math.round(start.xpRequired + (end.xpRequired - start.xpRequired) * t);
    }
  }
  return table;
})();

export function getTitleForLevel(level: number): string {
  let title = LEVEL_MILESTONES[0].title;
  for (const milestone of LEVEL_MILESTONES) {
    if (level >= milestone.level) title = milestone.title;
  }
  return title;
}

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  for (let l = 1; l <= MAX_LEVEL; l++) {
    if (xp >= LEVEL_XP_TABLE[l]) level = l;
  }
  const currentLevelXp = LEVEL_XP_TABLE[level];
  const nextLevelXp = level < MAX_LEVEL ? LEVEL_XP_TABLE[level + 1] : null;
  const xpIntoLevel = xp - currentLevelXp;
  const xpToNextLevel = nextLevelXp === null ? null : nextLevelXp - xp;
  const progressPercent = nextLevelXp === null ? 100 : Math.min(100, Math.round((xpIntoLevel / (nextLevelXp - currentLevelXp)) * 100));

  return {
    level,
    title: getTitleForLevel(level),
    xp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent,
  };
}
