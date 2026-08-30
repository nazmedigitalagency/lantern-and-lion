// Adventure World data model.
//
// This module intentionally contains only types + pure data/shape
// definitions. Nothing here reads localStorage or any storage layer —
// that keeps the model swappable for a real backend later without
// touching the shape consumers depend on.

export type RegionId =
  | 'eden'
  | 'wilderness'
  | 'kingdom-of-israel'
  | 'galilee'
  | 'jerusalem'
  | 'early-church';

/** All conditions in the array must be satisfied ("AND"). */
export type UnlockRequirement =
  | { type: 'always' }
  | { type: 'level'; minLevel: number }
  | { type: 'region-complete'; regionId: RegionId; minQuestsCompleted: number }
  | { type: 'quest-complete'; questId: string };

export type QuestStatus = 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';
export type RegionStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export type QuestReward = {
  xp: number;
  collectible?: {
    id: string;
    name: string;
    emoji: string;
  };
};

/**
 * A quest node maps 1:1 to an existing curriculum module (by `moduleId`),
 * so quest completion, lesson content, and progress tracking reuse the
 * existing lesson engine and localStorage progress store — there is no
 * second copy of lesson content or a competing progress record.
 */
export type AdventureQuest = {
  id: string;
  moduleId: string;
  regionId: RegionId;
  order: number;
  /** 1-5 star difficulty shown as ★★★☆☆ style rating. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  icon: string;
  reward: QuestReward;
  unlockRequirement: UnlockRequirement[];
};

export type MapPoint = { x: number; y: number };

export type Region = {
  id: RegionId;
  name: string;
  tagline: string;
  icon: string;
  /** Percentage-based position used for the desktop illustrated map. */
  mapPosition: MapPoint;
  /** Region ids this region has a visible path to on the map. */
  connectsTo: RegionId[];
  unlockRequirement: UnlockRequirement[];
  tone: 'emerald' | 'amber' | 'navy' | 'teal' | 'coral' | 'gold';
};

export type World = {
  id: string;
  name: string;
  regions: Region[];
  quests: AdventureQuest[];
};
