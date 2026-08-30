// Arcade scoring/reward engine — pure functions only, same discipline
// as the other features. Every game funnels its finished GameResult
// through `computeGameReward` so there is exactly one XP/coin formula
// for mini-games, not one per game.

import { getGameDefinition, getImplementedGames } from './catalog';
import type { DifficultyLevel, GameId, GameResult, PersonalBest } from './types';

const DIFFICULTY_MULTIPLIER: Record<DifficultyLevel, number> = { easy: 1, medium: 1.3, hard: 1.6, expert: 2 };

export function computeGameReward(result: GameResult, isNewBest: boolean): { xp: number; coins: number } {
  const def = getGameDefinition(result.gameId);
  const baseXp = def?.baseXp ?? 60;
  const accuracyFactor = Math.max(0.4, Math.min(1, result.accuracy / 100));
  let xp = Math.round(baseXp * DIFFICULTY_MULTIPLIER[result.difficulty] * accuracyFactor);
  if (!result.completed) xp = Math.round(xp * 0.3);
  let coins = Math.round(xp * 0.15);
  if (isNewBest && result.completed) coins += 10;
  return { xp: Math.max(0, xp), coins: Math.max(0, coins) };
}

/** A new session beats the stored best if it either completed when the old one didn't, or scored higher. */
export function isBetterThanBest(result: GameResult, previousBest: PersonalBest | null): boolean {
  if (!result.completed) return false;
  if (!previousBest) return true;
  return result.score > previousBest.score;
}

function seededIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return length > 0 ? hash % length : 0;
}

/** Today's featured Daily Challenge game — stable all day, rotates day to day, only ever picks a game that actually has a route. */
export function getFeaturedGameId(dateKey: string): GameId {
  const pool = getImplementedGames();
  return pool[seededIndex(`arcade-featured-${dateKey}`, pool.length)].id;
}
