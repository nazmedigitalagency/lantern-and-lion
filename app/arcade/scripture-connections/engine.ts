// Scripture Connections — pure game logic: the puzzle data model,
// board generation, daily/practice selection, and scoring. Same
// discipline as every other Arcade game's `engine.ts` — no puzzle
// content and no scoring math lives in the UI.

import { shuffle } from '../../lib/shuffle';
import type { AgeBand, DifficultyLevel, GameSkill } from '../types';

export type ConnectionsGroup = {
  id: string;
  /** The hidden relationship the player must discover — shown once the group is solved or revealed. */
  category: string;
  /** Always 4 — the classic Connections shape. */
  items: string[];
  /** Shown after the group is solved/revealed — the learning moment. */
  explanation: string;
};

export type PuzzleDefinition = {
  id: string;
  title: string;
  ageGroup: AgeBand;
  difficulty: DifficultyLevel;
  groups: ConnectionsGroup[];
  maxMistakes: number;
  xpReward: number;
  skills: GameSkill[];
};

export type Tile = {
  id: string;
  text: string;
  groupId: string;
};

export function buildBoard(puzzle: PuzzleDefinition): Tile[] {
  const tiles = puzzle.groups.flatMap((group) =>
    group.items.map((item) => ({ id: `${group.id}::${item}`, text: item, groupId: group.id })),
  );
  return shuffle(tiles);
}

/** Wraps `Date.now()` behind an ordinary function call — see the identical helper in `lightning-quiz/engine.ts` for why. */
export function nowMs(): number {
  return Date.now();
}

function seededIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return length > 0 ? hash % length : 0;
}

/** Today's puzzle — stable all day, rotates day to day, same technique as the Arcade's own Daily Challenge rotation (`arcade/progression.ts`). */
export function getDailyPuzzle(pool: PuzzleDefinition[], dateKey: string): PuzzleDefinition {
  return pool[seededIndex(`scripture-connections-daily-${dateKey}`, pool.length)];
}

/** A random puzzle for Practice Mode, optionally narrowed to a difficulty (falls back to the full pool if none match). */
export function pickPracticePuzzle(pool: PuzzleDefinition[], difficulty: DifficultyLevel): PuzzleDefinition {
  const matching = pool.filter((p) => p.difficulty === difficulty);
  const source = matching.length > 0 ? matching : pool;
  return source[Math.floor(Math.random() * source.length)];
}

/** True if exactly 3 of the 4 selected tiles share a group — the gentle "so close" nudge, never naming which one is wrong. */
export function isOneAway(selectedGroupIds: string[]): boolean {
  const counts = new Map<string, number>();
  selectedGroupIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return Math.max(...counts.values()) === 3;
}

export type ConnectionsScoreInput = {
  groupsTotal: number;
  mistakes: number;
  hintsUsed: number;
  timeSeconds: number;
};

export type ConnectionsScoreResult = { score: number; accuracy: number };

/** Rewards clean categorization: points per group, gentle mistake/hint penalties (capped), and a modest speed bonus. */
export function computeConnectionsScore({ groupsTotal, mistakes, hintsUsed, timeSeconds }: ConnectionsScoreInput): ConnectionsScoreResult {
  const base = groupsTotal * 60;
  const mistakePenalty = Math.min(base * 0.5, mistakes * 15);
  const hintPenalty = Math.min(base * 0.3, hintsUsed * 10);
  const parSeconds = groupsTotal * 20;
  const speedBonus = Math.max(0, Math.min(base * 0.2, (parSeconds - timeSeconds) * 1.5));
  const score = Math.max(groupsTotal * 20, Math.round(base - mistakePenalty - hintPenalty + speedBonus));
  const totalSubmissions = groupsTotal + mistakes;
  const accuracy = totalSubmissions > 0 ? Math.round((groupsTotal / totalSubmissions) * 100) : 100;
  return { score, accuracy };
}
