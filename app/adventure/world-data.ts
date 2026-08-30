import type { AdventureQuest, Region, RegionId } from './types';

export type WorldKind = 'child' | 'teen';

// ── CHILD/PATHFINDER REGIONS ────────────────────────────────────
// Positions are percentages within the map scene, hand-placed to read
// as a winding path from the Garden through to the Early Church.
export const childRegions: Region[] = [
  {
    id: 'eden',
    name: 'Eden',
    tagline: 'Where the story begins',
    icon: '🌿',
    mapPosition: { x: 12, y: 74 },
    connectsTo: ['wilderness'],
    unlockRequirement: [{ type: 'always' }],
    tone: 'emerald',
  },
  {
    id: 'wilderness',
    name: 'The Wilderness',
    tagline: 'A hard road, and a faithful God',
    icon: '🏜️',
    mapPosition: { x: 30, y: 50 },
    connectsTo: ['eden', 'kingdom-of-israel'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'eden', minQuestsCompleted: 2 }],
    tone: 'gold',
  },
  {
    id: 'kingdom-of-israel',
    name: 'The Kingdom of Israel',
    tagline: 'Kings, courage, and God’s people',
    icon: '👑',
    mapPosition: { x: 50, y: 68 },
    connectsTo: ['wilderness', 'galilee'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'wilderness', minQuestsCompleted: 2 }],
    tone: 'amber',
  },
  {
    id: 'galilee',
    name: 'Galilee',
    tagline: 'Where Jesus taught and healed',
    icon: '⛵',
    mapPosition: { x: 68, y: 42 },
    connectsTo: ['kingdom-of-israel', 'jerusalem'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'kingdom-of-israel', minQuestsCompleted: 2 }],
    tone: 'teal',
  },
  {
    id: 'jerusalem',
    name: 'Jerusalem',
    tagline: 'The cross, and the empty tomb',
    icon: '🏛️',
    mapPosition: { x: 84, y: 64 },
    connectsTo: ['galilee', 'early-church'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'galilee', minQuestsCompleted: 2 }],
    tone: 'coral',
  },
  {
    id: 'early-church',
    name: 'The Early Church',
    tagline: 'The story keeps going — through you',
    icon: '🔥',
    mapPosition: { x: 92, y: 32 },
    connectsTo: ['jerusalem'],
    unlockRequirement: [
      { type: 'region-complete', regionId: 'jerusalem', minQuestsCompleted: 2 },
      { type: 'level', minLevel: 4 },
    ],
    tone: 'navy',
  },
];

// ── TEEN / LION'S DEN REGIONS ────────────────────────────────────
// Same map skeleton (ids, positions, connections) as the child world so
// every consumer that keys progress off region/quest ids keeps working —
// but every region is re-themed around the mature, topical Lion's Den
// curriculum instead of the early-reader Genesis-to-Acts storyline, and
// unlocks demand more mastery (3 of 4 quests, not 2 of 3) before moving on.
export const teenRegions: Region[] = [
  {
    id: 'eden',
    name: 'Tested Under Pressure',
    tagline: 'The courage Israel’s boldest teenagers needed',
    icon: '🔥',
    mapPosition: { x: 12, y: 74 },
    connectsTo: ['wilderness'],
    unlockRequirement: [{ type: 'always' }],
    tone: 'coral',
  },
  {
    id: 'wilderness',
    name: 'Everyday Temptations',
    tagline: 'Integrity when no one is watching',
    icon: '⚖️',
    mapPosition: { x: 30, y: 50 },
    connectsTo: ['eden', 'kingdom-of-israel'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'eden', minQuestsCompleted: 3 }],
    tone: 'gold',
  },
  {
    id: 'kingdom-of-israel',
    name: 'Guarding the Heart',
    tagline: 'Boundaries, family trust, and real conflict',
    icon: '💍',
    mapPosition: { x: 50, y: 68 },
    connectsTo: ['wilderness', 'galilee'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'wilderness', minQuestsCompleted: 3 }],
    tone: 'teal',
  },
  {
    id: 'galilee',
    name: 'Deeper Identity',
    tagline: 'Who you are beneath the labels',
    icon: '🦁',
    mapPosition: { x: 68, y: 42 },
    connectsTo: ['kingdom-of-israel', 'jerusalem'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'kingdom-of-israel', minQuestsCompleted: 3 }],
    tone: 'navy',
  },
  {
    id: 'jerusalem',
    name: 'The Cross & the Case for Faith',
    tagline: 'Faith you can defend, not just feel',
    icon: '📜',
    mapPosition: { x: 84, y: 64 },
    connectsTo: ['galilee', 'early-church'],
    unlockRequirement: [{ type: 'region-complete', regionId: 'galilee', minQuestsCompleted: 3 }],
    tone: 'amber',
  },
  {
    id: 'early-church',
    name: 'Sent Out to Lead',
    tagline: 'The story keeps going — through you',
    icon: '💡',
    mapPosition: { x: 92, y: 32 },
    connectsTo: ['jerusalem'],
    unlockRequirement: [
      { type: 'region-complete', regionId: 'jerusalem', minQuestsCompleted: 3 },
      { type: 'level', minLevel: 5 },
    ],
    tone: 'emerald',
  },
];

// ── QUESTS ───────────────────────────────────────────────────────
// Each quest maps to a real curriculum module id, so quest content,
// completion state, and lesson data all come from the existing
// curriculum + progress system instead of a duplicate one.
function questChain(regionId: RegionId, entries: Array<Pick<AdventureQuest, 'moduleId' | 'difficulty' | 'icon' | 'reward'>>): AdventureQuest[] {
  return entries.map((entry, index) => ({
    id: `${regionId}-${index + 1}`,
    regionId,
    order: index + 1,
    unlockRequirement: index === 0 ? [{ type: 'always' }] : [{ type: 'quest-complete', questId: `${regionId}-${index}` }],
    ...entry,
  }));
}

export const childQuests: AdventureQuest[] = [
  ...questChain('eden', [
    { moduleId: 'early-creation', difficulty: 1, icon: '🌍', reward: { xp: 60 } },
    { moduleId: 'early-adam-eve-obey', difficulty: 2, icon: '🍎', reward: { xp: 80, collectible: { id: 'garden-leaf', name: 'Garden Leaf', emoji: '🍃' } } },
    { moduleId: 'path-cain-abel', difficulty: 3, icon: '⚖️', reward: { xp: 110 } },
  ]),
  ...questChain('wilderness', [
    { moduleId: 'early-baby-moses', difficulty: 1, icon: '🧺', reward: { xp: 70 } },
    { moduleId: 'path-exodus', difficulty: 3, icon: '🌊', reward: { xp: 120, collectible: { id: 'wilderness-manna', name: 'Manna Basket', emoji: '🍞' } } },
    { moduleId: 'early-ten-commandments', difficulty: 2, icon: '⛰️', reward: { xp: 90 } },
  ]),
  ...questChain('kingdom-of-israel', [
    { moduleId: 'early-samuel-listens', difficulty: 1, icon: '🕯️', reward: { xp: 70 } },
    { moduleId: 'path-david-saul', difficulty: 3, icon: '🗡️', reward: { xp: 120, collectible: { id: 'shepherd-sling', name: 'Shepherd’s Sling', emoji: '🪨' } } },
    { moduleId: 'path-elijah-baal', difficulty: 4, icon: '⚡', reward: { xp: 150 } },
  ]),
  ...questChain('galilee', [
    { moduleId: 'early-lost-sheep', difficulty: 2, icon: '🐑', reward: { xp: 100, collectible: { id: 'lantern-sheep', name: 'Little Lost Sheep', emoji: '🐑' } } },
    { moduleId: 'path-good-samaritan', difficulty: 3, icon: '❤️', reward: { xp: 120 } },
    { moduleId: 'path-sermon-mount', difficulty: 3, icon: '🏔️', reward: { xp: 130 } },
  ]),
  ...questChain('jerusalem', [
    { moduleId: 'path-widows-mite', difficulty: 2, icon: '🪙', reward: { xp: 100 } },
    { moduleId: 'path-peter-denial', difficulty: 4, icon: '🔥', reward: { xp: 140 } },
    { moduleId: 'teen-resurrection', difficulty: 4, icon: '🌅', reward: { xp: 160, collectible: { id: 'empty-tomb-light', name: 'Light of the Tomb', emoji: '✨' } } },
  ]),
  ...questChain('early-church', [
    { moduleId: 'teen-evangelism-witness', difficulty: 3, icon: '💡', reward: { xp: 130 } },
    { moduleId: 'family-prayer-life', difficulty: 2, icon: '🙏', reward: { xp: 110 } },
    { moduleId: 'teen-james-faith', difficulty: 4, icon: '🌿', reward: { xp: 150, collectible: { id: 'flame-of-faith', name: 'Flame of Faith', emoji: '🔥' } } },
  ]),
];

// Every quest here uses a 'teen'-track curriculum module — no early/pathfinder
// content — and every difficulty is 3+ stars with heavier XP rewards, so the
// Lion's Den world reads as a harder, more mature step up from the child world
// rather than a reskin of the same lessons.
export const teenQuests: AdventureQuest[] = [
  ...questChain('eden', [
    { moduleId: 'teen-nehemiah', difficulty: 3, icon: '🧱', reward: { xp: 140 } },
    { moduleId: 'teen-fiery-furnace', difficulty: 4, icon: '🔥', reward: { xp: 160, collectible: { id: 'fourth-figure', name: 'The Fourth Figure', emoji: '🔥' } } },
    { moduleId: 'teen-david-youth', difficulty: 3, icon: '👑', reward: { xp: 150 } },
    { moduleId: 'teen-josiah', difficulty: 4, icon: '📖', reward: { xp: 170 } },
  ]),
  ...questChain('wilderness', [
    { moduleId: 'teen-cheating-exams', difficulty: 4, icon: '📝', reward: { xp: 160 } },
    { moduleId: 'teen-stealing-teens', difficulty: 3, icon: '🔒', reward: { xp: 150, collectible: { id: 'restitution-scroll', name: 'Restitution Scroll', emoji: '📜' } } },
    { moduleId: 'teen-bullying', difficulty: 4, icon: '🛡️', reward: { xp: 170 } },
    { moduleId: 'teen-digital-ethics', difficulty: 4, icon: '📱', reward: { xp: 170 } },
  ]),
  ...questChain('kingdom-of-israel', [
    { moduleId: 'teen-dating-boundaries', difficulty: 4, icon: '💍', reward: { xp: 170 } },
    { moduleId: 'teen-purity-culture', difficulty: 5, icon: '✨', reward: { xp: 190, collectible: { id: 'guarded-heart', name: 'A Guarded Heart', emoji: '✨' } } },
    { moduleId: 'teen-respecting-parents', difficulty: 3, icon: '🏡', reward: { xp: 150 } },
    { moduleId: 'teen-anger-conflict', difficulty: 3, icon: '🌊', reward: { xp: 150 } },
  ]),
  ...questChain('galilee', [
    { moduleId: 'teen-identity-culture', difficulty: 4, icon: '🦁', reward: { xp: 170 } },
    { moduleId: 'teen-what-god-expects', difficulty: 3, icon: '⚖️', reward: { xp: 150 } },
    { moduleId: 'teen-mary-yes', difficulty: 4, icon: '🕊️', reward: { xp: 170, collectible: { id: 'bold-yes', name: 'A Bold Yes', emoji: '🕊️' } } },
    { moduleId: 'teen-romans-eight', difficulty: 5, icon: '⚓', reward: { xp: 190 } },
  ]),
  ...questChain('jerusalem', [
    { moduleId: 'teen-apologetics', difficulty: 4, icon: '📜', reward: { xp: 170 } },
    { moduleId: 'teen-resurrection', difficulty: 5, icon: '🌅', reward: { xp: 200, collectible: { id: 'empty-tomb-light', name: 'Light of the Tomb', emoji: '✨' } } },
    { moduleId: 'teen-james-faith', difficulty: 4, icon: '🌿', reward: { xp: 170 } },
    { moduleId: 'teen-future-purpose', difficulty: 4, icon: '🧭', reward: { xp: 170 } },
  ]),
  ...questChain('early-church', [
    { moduleId: 'teen-money-work', difficulty: 3, icon: '🔨', reward: { xp: 160 } },
    { moduleId: 'teen-mental-health', difficulty: 3, icon: '🧠', reward: { xp: 160 } },
    { moduleId: 'teen-timothy-leadership', difficulty: 4, icon: '🕯️', reward: { xp: 180 } },
    { moduleId: 'teen-evangelism-witness', difficulty: 5, icon: '💡', reward: { xp: 210, collectible: { id: 'ready-answer', name: 'A Ready Answer', emoji: '💡' } } },
  ]),
];

export function getRegions(kind: WorldKind): Region[] {
  return kind === 'teen' ? teenRegions : childRegions;
}

export function getWorldQuests(kind: WorldKind): AdventureQuest[] {
  return kind === 'teen' ? teenQuests : childQuests;
}

export function getRegion(regionId: string, kind: WorldKind = 'child'): Region | undefined {
  return getRegions(kind).find((region) => region.id === regionId);
}

export function getQuestsForRegion(regionId: string, kind: WorldKind = 'child'): AdventureQuest[] {
  return getWorldQuests(kind)
    .filter((quest) => quest.regionId === regionId)
    .sort((a, b) => a.order - b.order);
}

export function getQuest(questId: string, kind: WorldKind = 'child'): AdventureQuest | undefined {
  return getWorldQuests(kind).find((quest) => quest.id === questId);
}
