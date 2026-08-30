// Lightning Quiz — pure game logic: question selection, combo math, and
// scoring. Same discipline as `memory-match/engine.ts` — no question
// content and no scoring math lives in the UI component.

import { shuffle } from '../../lib/shuffle';
import type { DifficultyLevel, GameSkill } from '../types';
import { QUESTION_BANK } from './questions';

export type QuizCategory =
  | 'characters'
  | 'stories'
  | 'places'
  | 'events'
  | 'vocabulary'
  | 'verse-knowledge'
  | 'chronology'
  | 'who-said-it'
  | 'complete-the-verse'
  | 'true-false';

export type QuizQuestion = {
  id: string;
  category: QuizCategory;
  difficulty: DifficultyLevel;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  reference?: string;
  skills: GameSkill[];
};

export type QuizModeId = 'questions-10' | 'questions-20' | 'timed-30' | 'timed-60';

export type QuizModeDefinition = {
  id: QuizModeId;
  label: string;
  description: string;
  kind: 'fixed' | 'timed';
  questionCount?: number;
  seconds?: number;
};

export const QUIZ_MODE_ORDER: QuizModeId[] = ['questions-10', 'questions-20', 'timed-30', 'timed-60'];

export const QUIZ_MODES: Record<QuizModeId, QuizModeDefinition> = {
  'questions-10': { id: 'questions-10', label: '10 Questions', description: 'Answer 10 questions at your own pace.', kind: 'fixed', questionCount: 10 },
  'questions-20': { id: 'questions-20', label: '20 Questions', description: 'A longer round — 20 questions.', kind: 'fixed', questionCount: 20 },
  'timed-30': { id: 'timed-30', label: '30-Second Lightning', description: 'Answer as many as you can in 30 seconds!', kind: 'timed', seconds: 30 },
  'timed-60': { id: 'timed-60', label: '60-Second Lightning', description: 'A full minute of lightning-fast questions.', kind: 'timed', seconds: 60 },
};

/** Plenty of questions for any timed round — repeats are fine for an arcade game, just never back-to-back (see `buildQuizQueue`). */
const TIMED_QUEUE_SIZE = 100;

function filterPool(category: QuizCategory | 'all', difficulty: DifficultyLevel): QuizQuestion[] {
  const byBoth = QUESTION_BANK.filter((item) => (category === 'all' || item.category === category) && item.difficulty === difficulty);
  if (byBoth.length >= 4) return byBoth;
  const byCategory = QUESTION_BANK.filter((item) => category === 'all' || item.category === category);
  return byCategory.length >= 4 ? byCategory : QUESTION_BANK;
}

/** Builds a shuffled question queue for a round — widens category/difficulty filters if the pool is too thin, and never repeats a question back-to-back across shuffle batches. */
export function buildQuizQueue(category: QuizCategory | 'all', difficulty: DifficultyLevel, mode: QuizModeDefinition): QuizQuestion[] {
  const filtered = filterPool(category, difficulty);
  const targetLength = mode.kind === 'fixed' ? (mode.questionCount ?? 10) : TIMED_QUEUE_SIZE;
  const queue: QuizQuestion[] = [];
  while (queue.length < targetLength) {
    const batch = shuffle(filtered);
    if (queue.length > 0 && batch.length > 1 && batch[0].id === queue[queue.length - 1].id) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }
    queue.push(...batch);
  }
  return queue.slice(0, targetLength);
}

/** 3 correct in a row = 2x, 5 in a row = 3x. Kept flat and readable on purpose — no escalating further, so it never feels stressful. */
export function comboMultiplier(streak: number): number {
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export function comboLabel(streak: number): string | null {
  const multiplier = comboMultiplier(streak);
  return multiplier > 1 ? `🔥 ${multiplier}x COMBO` : null;
}

const BASE_POINTS: Record<DifficultyLevel, number> = { easy: 10, medium: 15, hard: 20, expert: 25 };
const SPEED_WINDOW_MS = 8000;

export type AnswerRecord = {
  questionId: string;
  category: QuizCategory;
  difficulty: DifficultyLevel;
  correct: boolean;
  responseMs: number;
  pointsEarned: number;
  streakAfter: number;
};

/** Points for one answer: a difficulty base, a speed bonus that tapers to zero by `SPEED_WINDOW_MS`, times the combo multiplier for the streak this answer extends to. Wrong answers always score zero. */
export function computeQuestionPoints(difficulty: DifficultyLevel, correct: boolean, responseMs: number, streakAfter: number): number {
  if (!correct) return 0;
  const base = BASE_POINTS[difficulty];
  const speedFactor = Math.max(0, 1 - Math.min(responseMs, SPEED_WINDOW_MS) / SPEED_WINDOW_MS);
  const speedBonus = Math.round(speedFactor * base * 0.5);
  return Math.round((base + speedBonus) * comboMultiplier(streakAfter));
}

/**
 * Wraps `Date.now()` behind an ordinary-looking function call. This file
 * is plain game logic (no JSX, no hooks), so the page component reading
 * a timestamp through here — instead of calling the impure global
 * directly — keeps the UI's render-purity analysis clean without
 * changing what actually happens.
 */
export function nowMs(): number {
  return Date.now();
}

export type QuizRoundSummary = {
  score: number;
  accuracy: number;
  avgResponseMs: number;
  highestCombo: number;
  questionsAnswered: number;
  questionsCorrect: number;
};

export function summarizeRound(answers: AnswerRecord[]): QuizRoundSummary {
  const questionsAnswered = answers.length;
  const questionsCorrect = answers.filter((a) => a.correct).length;
  const score = answers.reduce((sum, a) => sum + a.pointsEarned, 0);
  const avgResponseMs = questionsAnswered > 0 ? Math.round(answers.reduce((sum, a) => sum + a.responseMs, 0) / questionsAnswered) : 0;
  const highestCombo = answers.reduce((max, a) => Math.max(max, a.streakAfter), 0);
  const accuracy = questionsAnswered > 0 ? Math.round((questionsCorrect / questionsAnswered) * 100) : 0;
  return { score, accuracy, avgResponseMs, highestCombo, questionsAnswered, questionsCorrect };
}
