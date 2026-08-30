// Bible Adventure World data model.
//
// Defines the 8 canonical biblical regions, chapters, stories,
// arcade minigames, memory verses, collectibles, and Knowledge Bosses.

export type RegionId =
  | 'creation'
  | 'eden'
  | 'noah'
  | 'egypt'
  | 'wilderness'
  | 'jerusalem'
  | 'gospels'
  | 'early-church';

export type LocationState = 'locked' | 'unlocked' | 'in-progress' | 'completed' | 'mastered';

/** All conditions in the array must be satisfied ("AND"). */
export type UnlockRequirement =
  | { type: 'always' }
  | { type: 'level'; minLevel: number }
  | { type: 'region-complete'; regionId: RegionId; minQuestsCompleted: number }
  | { type: 'quest-complete'; questId: string };

export type QuestStatus = 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';
export type RegionStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export type WorldCollectible = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  foundInRegion: RegionId;
};

export type LocationSecret = {
  id: string;
  name: string;
  hint: string;
  emoji: string;
  rewardCoins: number;
  rewardGems: number;
  discovered: boolean;
};

export type MemoryVerseChallenge = {
  reference: string;
  text: string;
  translation: string;
  blanks: string[];
  theme: string;
};

export type BossQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptKey: string;
};

export type KnowledgeBossChallenge = {
  id: string;
  title: string;
  bossName: string;
  bossEmoji: string;
  description: string;
  requiredScore: number; // e.g. 4 out of 5
  questions: BossQuestion[];
  storyReconstruction: {
    prompt: string;
    events: string[];
    correctOrder: number[];
  };
  reward: {
    xp: number;
    coins: number;
    gems: number;
    badgeName: string;
    badgeEmoji: string;
    specialCollectible?: WorldCollectible;
  };
};

export type StoryChapter = {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  scriptureReference: string;
  bibleText: string;
  narrativeExplanation: string;
  takeawayMessage: string;
  audioDurationSeconds?: number;
};

export type AdventureQuest = {
  id: string;
  moduleId: string;
  regionId: RegionId;
  order: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  icon: string;
  linkedArcadeGame?: {
    href: string;
    title: string;
    gameType: string;
  };
  reward: {
    xp: number;
    coins: number;
    collectible?: WorldCollectible;
  };
  unlockRequirement: UnlockRequirement[];
};

export type MapPoint = { x: number; y: number };

export type Region = {
  id: RegionId;
  name: string;
  tagline: string;
  icon: string;
  mapPosition: MapPoint;
  connectsTo: RegionId[];
  unlockRequirement: UnlockRequirement[];
  tone: 'emerald' | 'amber' | 'navy' | 'teal' | 'coral' | 'gold' | 'purple' | 'ruby';
  scriptureRange: string;
  summary: string;
  environmentDescription: string;
  chapters: StoryChapter[];
  memoryVerse: MemoryVerseChallenge;
  boss: KnowledgeBossChallenge;
  secrets: LocationSecret[];
  collectibles: WorldCollectible[];
};

export type World = {
  id: string;
  name: string;
  regions: Region[];
  quests: AdventureQuest[];
};
