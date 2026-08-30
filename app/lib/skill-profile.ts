// The rollup layer that makes the 8 Arcade games one system, not eight
// isolated ones: every game already funnels through the same pipeline
// (`arcade/storage.ts`'s `recordGameSession` → the wallet's XP →
// `xp-levels.ts`'s level/title, and each `GameDefinition` already
// declares which `GameSkill`s it exercises). This file is the piece
// that was missing — turning that shared session history into the
// single "what is this child actually learning" profile a parent or
// teacher (and eventually the child) can read at a glance:
//
//   Level 17 — Kingdom Adventurer
//   Bible Knowledge ★★★★  Reading ★★★  Memory ★★★★★ ...
//   Scripture Maze — 91%   Memory Match — 87%   ...
//
// Nothing here duplicates XP/scoring/analytics — it only reads what
// those systems already recorded.

import { GAME_DEFINITIONS, getGameDefinition } from '../arcade/catalog';
import { getSessionsForProfile } from '../arcade/storage';
import type { GameId, GameSkill } from '../arcade/types';
import { getWallet } from './economy/wallet-service';
import { getLevelInfo, type LevelInfo } from './xp-levels';

export const SKILL_LABEL: Record<GameSkill, string> = {
  'bible-knowledge': 'Bible Knowledge',
  reading: 'Reading',
  vocabulary: 'Vocabulary',
  memory: 'Memory',
  attention: 'Attention',
  'pattern-recognition': 'Pattern Recognition',
  sequencing: 'Sequencing',
  'problem-solving': 'Problem Solving',
  'critical-thinking': 'Critical Thinking',
};

export type SkillRating = {
  skill: GameSkill;
  label: string;
  /** 1-5 — only shown for skills the player has actually practiced at least once. */
  stars: 1 | 2 | 3 | 4 | 5;
  sessionsCount: number;
  avgAccuracy: number;
};

export type GamePerformance = {
  gameId: GameId;
  name: string;
  icon: string;
  sessionsCount: number;
  avgAccuracy: number;
  bestScore: number;
};

export type SkillProfile = {
  level: LevelInfo;
  totalSessions: number;
  /** Only skills practiced at least once, ranked strongest first. */
  skills: SkillRating[];
  /** Only games played at least once, in Arcade catalog order. */
  games: GamePerformance[];
};

/**
 * Star rating blends *how much* a skill has been practiced (volume,
 * capped so a few great sessions still show progress) with *how well*
 * (average accuracy across every session touching that skill) — a
 * child who's played one perfect round shouldn't outrank one who's
 * shown consistent strength over a dozen games, and vice versa.
 */
function starsFor(sessionsCount: number, avgAccuracy: number): 1 | 2 | 3 | 4 | 5 {
  const volumeScore = Math.min(sessionsCount / 15, 1);
  const qualityScore = avgAccuracy / 100;
  const combined = volumeScore * 0.4 + qualityScore * 0.6;
  return (Math.min(5, Math.max(1, 1 + Math.round(combined * 4))) as 1 | 2 | 3 | 4 | 5);
}

export function getSkillProfile(profileId: number): SkillProfile {
  const sessions = getSessionsForProfile(profileId);
  const level = getLevelInfo(getWallet(profileId).xp);

  const byGame = new Map<GameId, { accuracySum: number; count: number; bestScore: number }>();
  const bySkill = new Map<GameSkill, { accuracySum: number; count: number }>();

  for (const session of sessions) {
    const gameEntry = byGame.get(session.gameId) ?? { accuracySum: 0, count: 0, bestScore: 0 };
    gameEntry.accuracySum += session.accuracy;
    gameEntry.count += 1;
    gameEntry.bestScore = Math.max(gameEntry.bestScore, session.score);
    byGame.set(session.gameId, gameEntry);

    const def = getGameDefinition(session.gameId);
    for (const skill of def?.skills ?? []) {
      const skillEntry = bySkill.get(skill) ?? { accuracySum: 0, count: 0 };
      skillEntry.accuracySum += session.accuracy;
      skillEntry.count += 1;
      bySkill.set(skill, skillEntry);
    }
  }

  const games: GamePerformance[] = GAME_DEFINITIONS.filter((g) => byGame.has(g.id)).map((g) => {
    const entry = byGame.get(g.id)!;
    return { gameId: g.id, name: g.name, icon: g.icon, sessionsCount: entry.count, avgAccuracy: Math.round(entry.accuracySum / entry.count), bestScore: entry.bestScore };
  });

  const skills: SkillRating[] = Array.from(bySkill.entries())
    .map(([skill, entry]) => {
      const avgAccuracy = entry.accuracySum / entry.count;
      return { skill, label: SKILL_LABEL[skill], stars: starsFor(entry.count, avgAccuracy), sessionsCount: entry.count, avgAccuracy: Math.round(avgAccuracy) };
    })
    .sort((a, b) => b.stars - a.stars || b.sessionsCount - a.sessionsCount);

  return { level, totalSessions: sessions.length, skills, games };
}
