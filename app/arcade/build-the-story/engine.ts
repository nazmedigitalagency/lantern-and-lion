// Build the Story — pure game logic: the reusable story data model,
// scrambling, hint generation, and scoring. Same discipline as
// `memory-match/engine.ts` and `lightning-quiz/engine.ts` — no story
// content and no scoring math lives in the UI component.

import { shuffle } from '../../lib/shuffle';
import type { AgeBand, DifficultyLevel, GameSkill } from '../types';

export type StoryEvent = {
  id: string;
  /** What the player sees on the card. */
  text: string;
  /** Optional authored hint shown when this event is misplaced; falls back to an auto-generated one. */
  hint?: string;
};

/**
 * One Bible story, in-order. Adding a story later is just adding an
 * entry here — nothing about the engine, scoring, or UI changes. The
 * shape is intentionally flat/serializable so hundreds of these could
 * later be loaded from a CMS or JSON file instead of this array.
 */
export type StoryDefinition = {
  id: string;
  title: string;
  description: string;
  reference: string;
  ageGroup: AgeBand;
  difficulty: DifficultyLevel;
  /** Correct chronological order — index 0 happened first. */
  events: StoryEvent[];
  skills: GameSkill[];
  xpReward: number;
  /** Shown on the completion screen — the "why this mattered" takeaway. */
  summary: string;
  /** Optional illustration path from `public/`. */
  image?: string;
};

/** Shuffles a story's events for play — guaranteed not to hand back the already-correct order (trivial for length <= 1). */
export function scrambleEvents(events: StoryEvent[]): StoryEvent[] {
  if (events.length <= 1) return [...events];
  let attempt = shuffle(events);
  let guard = 0;
  while (attempt.every((e, i) => e.id === events[i].id) && guard < 10) {
    attempt = shuffle(events);
    guard++;
  }
  if (attempt.every((e, i) => e.id === events[i].id)) {
    [attempt[0], attempt[1]] = [attempt[1], attempt[0]];
  }
  return attempt;
}

/** Index of the first slot that doesn't match the correct order, or -1 if the whole sequence is correct. */
export function findFirstMismatch(order: (StoryEvent | null)[], correct: StoryEvent[]): number {
  for (let i = 0; i < correct.length; i++) {
    if (order[i]?.id !== correct[i].id) return i;
  }
  return -1;
}

/** A gentle nudge toward the first wrong slot — never the full answer. Uses an authored hint if the event has one. */
export function getHint(story: StoryDefinition, order: (StoryEvent | null)[]): string {
  const idx = findFirstMismatch(order, story.events);
  if (idx === -1) return '';
  const correctEvent = story.events[idx];
  if (correctEvent.hint) return correctEvent.hint;
  if (idx === 0) return 'Think about what happens right at the start of the story.';
  return `Think about what happened just before "${correctEvent.text}".`;
}

/** Wraps `Date.now()` behind an ordinary function call — see the identical helper in `lightning-quiz/engine.ts` for why. */
export function nowMs(): number {
  return Date.now();
}

export type StoryScoreInput = {
  eventCount: number;
  attempts: number;
  timeSeconds: number;
};

export type StoryScoreResult = { score: number; accuracy: number };

/**
 * Rewards mastery over speed: a difficulty-scaled base, a modest penalty
 * per retry (capped so it never wipes the score out), and a small speed
 * bonus that matters far less than getting it right in fewer attempts.
 * `accuracy` is "how close to a first-try solve" — 1 attempt = 100%.
 */
export function computeStoryScore({ eventCount, attempts, timeSeconds }: StoryScoreInput): StoryScoreResult {
  const base = eventCount * 40;
  const attemptPenalty = Math.min(base * 0.7, (attempts - 1) * 15);
  const parSeconds = eventCount * 12;
  const speedBonus = Math.max(0, Math.min(base * 0.2, (parSeconds - timeSeconds) * 2));
  const score = Math.max(eventCount * 15, Math.round(base - attemptPenalty + speedBonus));
  const accuracy = Math.round(100 / attempts);
  return { score, accuracy };
}
