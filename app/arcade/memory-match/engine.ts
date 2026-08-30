// Memory Match — pure game logic + content pools. Every matching mode
// (character↔image, character↔story, object↔story, verse ref↔verse,
// word↔definition, place↔event) shares the same deck/scoring/grid
// functions below; a new mode is just a new pool + a MATCH_MODES entry,
// same discipline as the Scramble/Verse Builder pools in `../catalog`.

import { shuffle, pickRandomUnique } from '../../lib/shuffle';
import { VERSE_POOLS } from '../catalog';
import type { DifficultyLevel } from '../types';

export type MatchModeId =
  | 'character-image'
  | 'character-story'
  | 'object-story'
  | 'verse-reference'
  | 'word-definition'
  | 'place-event';

export type CardFace = { kind: 'emoji' | 'text'; value: string; caption?: string };

/** One matching pair, before it's split into two shuffled cards. */
export type PairSeed = { id: string; a: CardFace; b: CardFace };

export type MemoryCard = {
  uid: number;
  pairId: string;
  face: CardFace;
  matched: boolean;
};

export type MatchModeDefinition = {
  id: MatchModeId;
  label: string;
  description: string;
  /** Pools may be smaller than a difficulty's pair count — callers clamp to what's available. */
  pairs: () => PairSeed[];
};

// ── MODE 1: Character ↔ Character image ─────────────────────────
// "Image" here is a thematic emoji icon rather than a photo — no art
// asset exists per-character today, and an emoji reads instantly at
// small card sizes for the youngest players. Implemented in full;
// this is the mode wired into the UI.
const CHARACTER_IMAGE_PAIRS: PairSeed[] = [
  { id: 'noah', a: { kind: 'text', value: 'Noah' }, b: { kind: 'emoji', value: '🌊', caption: 'Noah' } },
  { id: 'moses', a: { kind: 'text', value: 'Moses' }, b: { kind: 'emoji', value: '🐑', caption: 'Moses' } },
  { id: 'david', a: { kind: 'text', value: 'David' }, b: { kind: 'emoji', value: '🪨', caption: 'David' } },
  { id: 'goliath', a: { kind: 'text', value: 'Goliath' }, b: { kind: 'emoji', value: '🛡️', caption: 'Goliath' } },
  { id: 'daniel', a: { kind: 'text', value: 'Daniel' }, b: { kind: 'emoji', value: '🦁', caption: 'Daniel' } },
  { id: 'esther', a: { kind: 'text', value: 'Esther' }, b: { kind: 'emoji', value: '👑', caption: 'Esther' } },
  { id: 'ruth', a: { kind: 'text', value: 'Ruth' }, b: { kind: 'emoji', value: '🌾', caption: 'Ruth' } },
  { id: 'samuel', a: { kind: 'text', value: 'Samuel' }, b: { kind: 'emoji', value: '📯', caption: 'Samuel' } },
  { id: 'solomon', a: { kind: 'text', value: 'Solomon' }, b: { kind: 'emoji', value: '🏛️', caption: 'Solomon' } },
  { id: 'jonah', a: { kind: 'text', value: 'Jonah' }, b: { kind: 'emoji', value: '🐋', caption: 'Jonah' } },
  { id: 'joseph', a: { kind: 'text', value: 'Joseph' }, b: { kind: 'emoji', value: '🧥', caption: 'Joseph' } },
  { id: 'peter', a: { kind: 'text', value: 'Peter' }, b: { kind: 'emoji', value: '🎣', caption: 'Peter' } },
  { id: 'paul', a: { kind: 'text', value: 'Paul' }, b: { kind: 'emoji', value: '✉️', caption: 'Paul' } },
  { id: 'elijah', a: { kind: 'text', value: 'Elijah' }, b: { kind: 'emoji', value: '🔥', caption: 'Elijah' } },
  { id: 'abraham', a: { kind: 'text', value: 'Abraham' }, b: { kind: 'emoji', value: '⭐', caption: 'Abraham' } },
  { id: 'mary', a: { kind: 'text', value: 'Mary' }, b: { kind: 'emoji', value: '💐', caption: 'Mary' } },
  { id: 'john-baptist', a: { kind: 'text', value: 'John the Baptist' }, b: { kind: 'emoji', value: '🕊️', caption: 'John the Baptist' } },
];

// ── MODE 2: Bible character ↔ Bible story ────────────────────────
const CHARACTER_STORY_PAIRS: PairSeed[] = [
  { id: 'noah-story', a: { kind: 'text', value: 'Noah' }, b: { kind: 'text', value: 'Built an ark before the flood' } },
  { id: 'david-story', a: { kind: 'text', value: 'David' }, b: { kind: 'text', value: 'Defeated Goliath with a sling' } },
  { id: 'daniel-story', a: { kind: 'text', value: 'Daniel' }, b: { kind: 'text', value: 'Kept safe in the lions’ den' } },
  { id: 'esther-story', a: { kind: 'text', value: 'Esther' }, b: { kind: 'text', value: 'Became queen and saved her people' } },
  { id: 'jonah-story', a: { kind: 'text', value: 'Jonah' }, b: { kind: 'text', value: 'Swallowed by a great fish' } },
  { id: 'moses-story', a: { kind: 'text', value: 'Moses' }, b: { kind: 'text', value: 'Parted the Red Sea' } },
];

// ── MODE 3: Bible object ↔ Bible story ───────────────────────────
const OBJECT_STORY_PAIRS: PairSeed[] = [
  { id: 'ark-object', a: { kind: 'text', value: 'The ark' }, b: { kind: 'text', value: 'Kept Noah’s family and the animals safe' } },
  { id: 'sling-object', a: { kind: 'text', value: 'A sling and stone' }, b: { kind: 'text', value: 'David’s weapon against Goliath' } },
  { id: 'coat-object', a: { kind: 'text', value: 'A coat of many colors' }, b: { kind: 'text', value: 'Given to Joseph by his father' } },
  { id: 'basket-object', a: { kind: 'text', value: 'A basket on the river', }, b: { kind: 'text', value: 'Hid baby Moses among the reeds' } },
  { id: 'lamp-object', a: { kind: 'text', value: 'Seven lamps', }, b: { kind: 'text', value: 'Burned oil in Israel’s tabernacle' } },
];

// ── MODE 4: Verse reference ↔ Verse ──────────────────────────────
// Reuses the shared VERSE_POOLS from ../catalog instead of a second
// verse dataset — one place owns Scripture text for the whole Arcade.
function versePairs(): PairSeed[] {
  const all = Object.values(VERSE_POOLS).flat();
  return all.map((v) => ({ id: `verse-${v.reference}`, a: { kind: 'text', value: v.reference }, b: { kind: 'text', value: v.text } }));
}

// ── MODE 5: Word ↔ definition ────────────────────────────────────
const WORD_DEFINITION_PAIRS: PairSeed[] = [
  { id: 'covenant', a: { kind: 'text', value: 'Covenant' }, b: { kind: 'text', value: 'A solemn promise or agreement with God' } },
  { id: 'redemption', a: { kind: 'text', value: 'Redemption' }, b: { kind: 'text', value: 'Being saved or bought back from sin' } },
  { id: 'disciple', a: { kind: 'text', value: 'Disciple' }, b: { kind: 'text', value: 'A follower and student of a teacher' } },
  { id: 'prophet', a: { kind: 'text', value: 'Prophet' }, b: { kind: 'text', value: 'Someone who speaks God’s message' } },
  { id: 'sanctuary', a: { kind: 'text', value: 'Sanctuary' }, b: { kind: 'text', value: 'A sacred, set-apart place of worship' } },
  { id: 'parable', a: { kind: 'text', value: 'Parable' }, b: { kind: 'text', value: 'A short story that teaches a lesson' } },
];

// ── MODE 6: Place ↔ event ────────────────────────────────────────
const PLACE_EVENT_PAIRS: PairSeed[] = [
  { id: 'jericho', a: { kind: 'text', value: 'Jericho' }, b: { kind: 'text', value: 'Its walls fell after seven days of marching' } },
  { id: 'red-sea', a: { kind: 'text', value: 'The Red Sea' }, b: { kind: 'text', value: 'Parted so Israel could cross on dry ground' } },
  { id: 'bethlehem', a: { kind: 'text', value: 'Bethlehem' }, b: { kind: 'text', value: 'Where Jesus was born' } },
  { id: 'sinai', a: { kind: 'text', value: 'Mount Sinai' }, b: { kind: 'text', value: 'Moses received the Ten Commandments' } },
  { id: 'jordan', a: { kind: 'text', value: 'The Jordan River' }, b: { kind: 'text', value: 'Where Jesus was baptized' } },
];

export const MATCH_MODES: Record<MatchModeId, MatchModeDefinition> = {
  'character-image': { id: 'character-image', label: 'Character Match', description: 'Match each Bible character to their icon.', pairs: () => CHARACTER_IMAGE_PAIRS },
  'character-story': { id: 'character-story', label: 'Character & Story', description: 'Match each character to their story.', pairs: () => CHARACTER_STORY_PAIRS },
  'object-story': { id: 'object-story', label: 'Object & Story', description: 'Match a Bible object to its story.', pairs: () => OBJECT_STORY_PAIRS },
  'verse-reference': { id: 'verse-reference', label: 'Verse & Reference', description: 'Match a verse to its reference.', pairs: () => versePairs() },
  'word-definition': { id: 'word-definition', label: 'Word & Definition', description: 'Match a word to its meaning.', pairs: () => WORD_DEFINITION_PAIRS },
  'place-event': { id: 'place-event', label: 'Place & Event', description: 'Match a place to what happened there.', pairs: () => PLACE_EVENT_PAIRS },
};

/** The mode implemented in the UI today — the rest exist in the registry above, ready to be wired in later. */
export const DEFAULT_MATCH_MODE: MatchModeId = 'character-image';

export const PAIR_COUNT_BY_DIFFICULTY: Record<DifficultyLevel, number> = { easy: 3, medium: 6, hard: 9, expert: 12 };

/** Whether a difficulty runs against a soft time challenge (shown, never fails the game). */
export function hasTimeChallenge(difficulty: DifficultyLevel): boolean {
  return difficulty === 'expert';
}

/** Ideal grid column count for a given number of cards, kept squarish and touch-friendly. */
export function gridColumnsFor(cardCount: number): number {
  if (cardCount <= 6) return 3;
  if (cardCount <= 12) return 4;
  return 6;
}

let uidSeq = 0;

/** Builds a shuffled, face-down deck for a mode/difficulty. Pools smaller than the requested pair count are used in full rather than erroring. */
export function generateDeck(mode: MatchModeId, difficulty: DifficultyLevel): MemoryCard[] {
  const pool = MATCH_MODES[mode].pairs();
  const requested = PAIR_COUNT_BY_DIFFICULTY[difficulty];
  const chosen = pickRandomUnique(pool, Math.min(requested, pool.length));
  const cards: MemoryCard[] = chosen.flatMap((pair) => [
    { uid: uidSeq++, pairId: pair.id, face: pair.a, matched: false },
    { uid: uidSeq++, pairId: pair.id, face: pair.b, matched: false },
  ]);
  return shuffle(cards);
}

export type MemoryScoreInput = {
  pairCount: number;
  mistakes: number;
  timeSeconds: number;
  difficulty: DifficultyLevel;
};

export type MemoryScoreResult = { score: number; accuracy: number };

/**
 * Scoring for a completed game: points per pair, a mistake penalty that
 * never drags the round below a small floor, and a speed bonus against a
 * per-difficulty "par" time so faster clears score higher without
 * punishing slower, careful play.
 */
export function computeMemoryMatchScore({ pairCount, mistakes, timeSeconds, difficulty }: MemoryScoreInput): MemoryScoreResult {
  const basePerPair = 100;
  const base = pairCount * basePerPair;
  const mistakePenalty = Math.min(base * 0.6, mistakes * 12);
  const parSeconds = pairCount * (difficulty === 'expert' ? 5 : 7);
  const speedBonus = Math.max(0, Math.min(base * 0.3, (parSeconds - timeSeconds) * 3));
  const score = Math.max(pairCount * 20, Math.round(base - mistakePenalty + speedBonus));
  const attempts = pairCount + mistakes;
  const accuracy = attempts > 0 ? Math.round((pairCount / attempts) * 100) : 100;
  return { score, accuracy };
}
