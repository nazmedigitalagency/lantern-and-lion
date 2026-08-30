// Bible Detective — pure game logic: the case data model, scoring, and
// mastery rules. Same discipline as every other Arcade game's
// `engine.ts` — no case content and no scoring math lives in the UI.

import type { AgeBand, DifficultyLevel, GameSkill } from '../types';

export type ClueType = 'scripture' | 'location' | 'character' | 'timeline' | 'object';

export const CLUE_ICON: Record<ClueType, string> = {
  scripture: '📜',
  location: '🗺️',
  character: '👤',
  timeline: '🕰️',
  object: '🔎',
};

export const CLUE_LABEL: Record<ClueType, string> = {
  scripture: 'Scripture clue',
  location: 'Location clue',
  character: 'Character clue',
  timeline: 'Timeline clue',
  object: 'Object clue',
};

export type ClueDefinition = {
  id: string;
  type: ClueType;
  title: string;
  content: string;
};

export type CaseQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Optional-to-request nudge — never the answer itself. */
  hint: string;
};

/** One investigation phase: the clues it reveals, and (usually) a mini question that must be answered correctly before the next stage's clues unlock. */
export type CaseStage = {
  id: string;
  clues: ClueDefinition[];
  question?: CaseQuestion;
};

export type FinalAnswer = {
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
};

export type CaseDefinition = {
  id: string;
  title: string;
  intro: string;
  reference: string;
  ageGroup: AgeBand;
  difficulty: DifficultyLevel;
  stages: CaseStage[];
  finalAnswer: FinalAnswer;
  /** Shown on the "Case Solved" screen — what happened, and why the evidence supports it. */
  explanation: string;
  skills: GameSkill[];
  xpReward: number;
  image?: string;
};

export function totalClueCount(caseDef: CaseDefinition): number {
  return caseDef.stages.reduce((sum, s) => sum + s.clues.length, 0);
}

/** Mini-question count plus the final answer — the denominator for accuracy. */
export function totalQuestionCount(caseDef: CaseDefinition): number {
  return caseDef.stages.filter((s) => s.question).length + 1;
}

/** Wraps `Date.now()` behind an ordinary function call — see the identical helper in `lightning-quiz/engine.ts` for why. */
export function nowMs(): number {
  return Date.now();
}

export type CaseScoreInput = {
  clueCount: number;
  questionCount: number;
  questionsCorrectFirstTry: number;
  wrongAttempts: number;
  hintsUsed: number;
  timeSeconds: number;
};

export type CaseScoreResult = { score: number; accuracy: number };

/** Rewards thorough, correct reasoning: points per clue and per question, gently reduced by hints/retries, with only a small speed bonus. */
export function computeCaseScore({ clueCount, questionCount, questionsCorrectFirstTry, wrongAttempts, hintsUsed, timeSeconds }: CaseScoreInput): CaseScoreResult {
  const base = clueCount * 12 + questionCount * 40;
  const wrongPenalty = Math.min(base * 0.5, wrongAttempts * 12);
  const hintPenalty = Math.min(base * 0.3, hintsUsed * 10);
  const parSeconds = (clueCount + questionCount) * 15;
  const speedBonus = Math.max(0, Math.min(base * 0.15, (parSeconds - timeSeconds) * 1.5));
  const score = Math.max(clueCount * 8, Math.round(base - wrongPenalty - hintPenalty + speedBonus));
  const accuracy = questionCount > 0 ? Math.round((questionsCorrectFirstTry / questionCount) * 100) : 100;
  return { score, accuracy };
}

/** A perfect run: every question solved first try, no hints spent. */
export function isCaseMastered(wrongAttempts: number, hintsUsed: number): boolean {
  return wrongAttempts === 0 && hintsUsed === 0;
}
