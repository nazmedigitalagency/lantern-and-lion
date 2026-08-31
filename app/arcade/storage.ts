// Local persistence for the Arcade — personal bests, session history,
// and reward awarding. Awards go through the existing wallet
// (`lib/economy/wallet-service`) with source `'minigame'`, exactly
// like every other feature — this file computes nothing about XP
// itself beyond calling `computeGameReward`.

import { awardCoins, awardXP } from '../lib/economy/wallet-service';
import { getTodayDateKey } from '../lib/date';
import { computeGameReward, isBetterThanBest } from './progression';
import type { GameId, GameOutcome, GameResult, GameSessionRecord, PersonalBest } from './types';

const BEST_KEY = 'lanternLionArcadeBest';
const SESSIONS_KEY = 'lanternLionArcadeSessions';
const MAX_STORED_SESSIONS = 40;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type BestsByGame = Partial<Record<GameId, PersonalBest>>;

function readAllBests(): Record<string, BestsByGame> {
  return safeParse(localStorage.getItem(BEST_KEY), {});
}

export function getPersonalBest(profileId: number | string, gameId: GameId): PersonalBest | null {
  return readAllBests()[profileId]?.[gameId] ?? null;
}

function readAllSessions(): Record<string, GameSessionRecord[]> {
  return safeParse(localStorage.getItem(SESSIONS_KEY), {});
}

/** How many arcade sessions this profile played on a given date (optionally for one game) — Daily Quests' arcade-play detection uses this. */
export function countSessionsOn(profileId: number | string, dateKey: string, gameId?: GameId): number {
  const list = readAllSessions()[profileId] || [];
  return list.filter((s) => s.date === dateKey && (!gameId || s.gameId === gameId)).length;
}

/** Every session this profile has ever played, across all games — the raw material `lib/skill-profile.ts` aggregates into per-skill/per-game learning stats. */
export function getSessionsForProfile(profileId: number | string): GameSessionRecord[] {
  return readAllSessions()[profileId] || [];
}

/**
 * Ends a game session: scores it, awards XP/coins through the wallet,
 * updates the personal best if beaten, and logs the session. This is
 * the one function every game calls when it finishes.
 */
export function recordGameSession(profileId: number | string, result: GameResult): GameOutcome {
  const previousBest = getPersonalBest(profileId, result.gameId);
  const isNewBest = isBetterThanBest(result, previousBest);
  const { xp, coins } = computeGameReward(result, isNewBest);

  awardXP(profileId, xp, 'minigame', `${labelFor(result.gameId)} session`);
  if (coins > 0) awardCoins(profileId, coins, 'minigame', `${labelFor(result.gameId)} session`);

  if (isNewBest) {
    const bests = readAllBests();
    const profileBests = bests[profileId] || {};
    profileBests[result.gameId] = {
      score: result.score,
      accuracy: result.accuracy,
      timeSeconds: result.timeSeconds,
      difficulty: result.difficulty,
      achievedAt: new Date().toISOString(),
      mistakes: result.mistakes,
      highestCombo: result.highestCombo,
      avgResponseMs: result.avgResponseMs,
      attempts: result.attempts,
      hintsUsed: result.hintsUsed,
    };
    bests[profileId] = profileBests;
    localStorage.setItem(BEST_KEY, JSON.stringify(bests));
  }

  const session: GameSessionRecord = {
    gameId: result.gameId,
    date: getTodayDateKey(),
    score: result.score,
    accuracy: result.accuracy,
    timeSeconds: result.timeSeconds,
    difficulty: result.difficulty,
    xpEarned: xp,
    coinsEarned: coins,
    mistakes: result.mistakes,
    highestCombo: result.highestCombo,
    avgResponseMs: result.avgResponseMs,
    attempts: result.attempts,
    hintsUsed: result.hintsUsed,
  };
  const allSessions = readAllSessions();
  const profileSessions = allSessions[profileId] || [];
  allSessions[profileId] = [session, ...profileSessions].slice(0, MAX_STORED_SESSIONS);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));

  return { session, isNewBest, previousBest };
}

function labelFor(id: GameId): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
