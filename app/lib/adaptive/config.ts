import type { DifficultyLevel } from '../../arcade/types';

export type MasteryStatus = 'not_introduced' | 'introduced' | 'learning' | 'needs_reinforcement' | 'developing' | 'proficient' | 'mastered';

export const MASTERY_STATUS_LABEL: Record<MasteryStatus, string> = {
  not_introduced: 'Not started yet',
  introduced: 'Just introduced',
  learning: 'Learning',
  needs_reinforcement: 'Needs more practice',
  developing: 'Developing',
  proficient: 'Doing well',
  mastered: 'Mastered',
};

/** Recent performance outweighs old performance — a higher weight means faster forgetting of stale data. */
export const MASTERY_LEARNING_RATE = 0.3;

/** Simplified spaced-repetition ladder, indexed by consecutive correct rounds. Configurable in one place. */
export const REVIEW_INTERVAL_LADDER_DAYS = [1, 3, 7, 14, 30, 60];

/**
 * Deterministic status classification — never left to an LLM. Recent
 * struggle (repeated incorrect rounds) always outranks a lingering high
 * score, and a concept needs a little repetition before it can be called
 * mastered so a single lucky guess doesn't max it out.
 */
export function statusForMastery(masteryScore: number, totalAttempts: number, consecutiveIncorrect: number, consecutiveCorrect: number): MasteryStatus {
  if (totalAttempts === 0) return 'not_introduced';
  if (consecutiveIncorrect >= 2) return 'needs_reinforcement';
  if (totalAttempts === 1) return 'introduced';
  if (masteryScore >= 90 && consecutiveCorrect >= 2) return 'mastered';
  if (masteryScore >= 70) return 'proficient';
  if (masteryScore >= 40) return 'developing';
  return 'learning';
}

/** Difficulty suggestion for the next activity touching this concept — reuses the app's existing DifficultyLevel vocabulary. */
export function difficultyForMastery(masteryScore: number): DifficultyLevel {
  if (masteryScore >= 85) return 'expert';
  if (masteryScore >= 65) return 'hard';
  if (masteryScore >= 35) return 'medium';
  return 'easy';
}
