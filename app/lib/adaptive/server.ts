import type { SupabaseClient } from '@supabase/supabase-js';
import { getAllConcepts, getConcept, conceptsForTrack, type Concept } from './concepts';
import { MASTERY_LEARNING_RATE, REVIEW_INTERVAL_LADDER_DAYS, statusForMastery, difficultyForMastery, type MasteryStatus } from './config';
import type { CurriculumModule } from '../../curriculum-data';

export type ConceptMasteryRow = {
  child_id: string;
  concept_id: string;
  mastery_score: number;
  status: MasteryStatus;
  correct_count: number;
  incorrect_count: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  review_interval_days: number;
  last_practiced_at: string;
  next_review_at: string;
};

export type PracticeSignal = {
  /** 0-100 correctness signal for this round. Falls back to a neutral "completed it" value when the source activity has no graded accuracy. */
  score: number;
  hintsUsed?: number;
};

/**
 * The one place concept mastery is ever updated — called from the existing
 * analytics pipeline (`/api/analytics/track`) whenever a LESSON_COMPLETED or
 * GAME_COMPLETED event resolves to a concept. Deterministic: no AI in this
 * calculation, per the "structured engine, not an LLM guess" requirement.
 */
export async function recordConceptPractice(admin: SupabaseClient, childId: string, conceptId: string, signal: PracticeSignal): Promise<{ row: ConceptMasteryRow; justMastered: boolean }> {
  const adjustedScore = Math.max(0, Math.min(100, signal.score - (signal.hintsUsed || 0) * 5));
  const isGoodRound = adjustedScore >= 65;

  const { data: existing } = await admin.from('concept_mastery').select('*').eq('child_id', childId).eq('concept_id', conceptId).maybeSingle();

  const priorMastery = existing?.mastery_score ?? null;
  const nextMastery = priorMastery === null ? adjustedScore : Math.round((priorMastery * (1 - MASTERY_LEARNING_RATE) + adjustedScore * MASTERY_LEARNING_RATE) * 100) / 100;

  const consecutiveCorrect = isGoodRound ? (existing?.consecutive_correct || 0) + 1 : 0;
  const consecutiveIncorrect = isGoodRound ? 0 : (existing?.consecutive_incorrect || 0) + 1;
  const correctCount = (existing?.correct_count || 0) + (isGoodRound ? 1 : 0);
  const incorrectCount = (existing?.incorrect_count || 0) + (isGoodRound ? 0 : 1);
  const totalAttempts = correctCount + incorrectCount;

  const intervalDays = isGoodRound
    ? REVIEW_INTERVAL_LADDER_DAYS[Math.min(consecutiveCorrect - 1, REVIEW_INTERVAL_LADDER_DAYS.length - 1)]
    : REVIEW_INTERVAL_LADDER_DAYS[0];

  const status = statusForMastery(nextMastery, totalAttempts, consecutiveIncorrect, consecutiveCorrect);
  const wasMastered = existing?.status === 'mastered';
  const nowIso = new Date().toISOString();
  const nextReviewAt = new Date(Date.now() + intervalDays * 86_400_000).toISOString();

  const row = {
    child_id: childId,
    concept_id: conceptId,
    mastery_score: nextMastery,
    status,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    consecutive_correct: consecutiveCorrect,
    consecutive_incorrect: consecutiveIncorrect,
    review_interval_days: intervalDays,
    last_practiced_at: nowIso,
    next_review_at: nextReviewAt,
    updated_at: nowIso,
  };

  await admin.from('concept_mastery').upsert(row, { onConflict: 'child_id,concept_id' });

  return { row: row as ConceptMasteryRow, justMastered: status === 'mastered' && !wasMastered };
}

export async function getConceptMasteryForChild(admin: SupabaseClient, childId: string): Promise<ConceptMasteryRow[]> {
  const { data } = await admin.from('concept_mastery').select('*').eq('child_id', childId);
  return (data || []) as ConceptMasteryRow[];
}

export type MasterySummary = {
  counts: Record<MasteryStatus, number>;
  strengths: { conceptId: string; label: string; masteryScore: number }[];
  needsPractice: { conceptId: string; label: string; masteryScore: number }[];
  dueReviews: { conceptId: string; label: string }[];
};

/** Read-only rollup for parent/teacher/child views — never recomputes mastery, just summarizes stored state. */
export function summarizeMastery(rows: ConceptMasteryRow[], track: CurriculumModule['track']): MasterySummary {
  const totalInTrack = conceptsForTrack(track).length;
  const counts: Record<MasteryStatus, number> = { not_introduced: totalInTrack, introduced: 0, learning: 0, needs_reinforcement: 0, developing: 0, proficient: 0, mastered: 0 };

  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1;
    counts.not_introduced = Math.max(0, counts.not_introduced - 1);
  }

  const withLabel = (row: ConceptMasteryRow) => ({ conceptId: row.concept_id, label: getConcept(row.concept_id)?.label || row.concept_id, masteryScore: row.mastery_score });

  const strengths = [...rows].filter((r) => r.status === 'mastered' || r.status === 'proficient').sort((a, b) => b.mastery_score - a.mastery_score).slice(0, 3).map(withLabel);
  const needsPractice = [...rows].filter((r) => r.status === 'needs_reinforcement' || r.status === 'learning').sort((a, b) => a.mastery_score - b.mastery_score).slice(0, 3).map(withLabel);

  const now = Date.now();
  const dueReviews = [...rows]
    .filter((r) => r.status !== 'not_introduced' && new Date(r.next_review_at).getTime() <= now)
    .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime())
    .slice(0, 5)
    .map((r) => ({ conceptId: r.concept_id, label: getConcept(r.concept_id)?.label || r.concept_id }));

  return { counts, strengths, needsPractice, dueReviews };
}

export type NextActivityRecommendation = {
  type: 'review' | 'reinforce' | 'new' | 'explore';
  conceptId: string | null;
  label: string;
  reason: string;
  suggestedDifficulty: ReturnType<typeof difficultyForMastery> | null;
};

/**
 * The central decision engine (`getNextLearningActivity` equivalent): due
 * reviews first, then anything flagged for reinforcement, then the next
 * not-yet-introduced module for the child's track, and only then a general
 * "explore" fallback. Pure, deterministic, and reads only what's already
 * stored — no AI in the decision itself.
 */
export function recommendNextActivity(rows: ConceptMasteryRow[], track: CurriculumModule['track']): NextActivityRecommendation {
  const now = Date.now();
  const byId = new Map(rows.map((r) => [r.concept_id, r]));

  const due = [...rows].filter((r) => r.status !== 'not_introduced' && new Date(r.next_review_at).getTime() <= now).sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime())[0];
  if (due) {
    const concept = getConcept(due.concept_id);
    return { type: 'review', conceptId: due.concept_id, label: concept?.label || due.concept_id, reason: 'Ready for review to keep it fresh.', suggestedDifficulty: difficultyForMastery(due.mastery_score) };
  }

  const weak = [...rows].filter((r) => r.status === 'needs_reinforcement').sort((a, b) => a.mastery_score - b.mastery_score)[0];
  if (weak) {
    const concept = getConcept(weak.concept_id);
    return { type: 'reinforce', conceptId: weak.concept_id, label: concept?.label || weak.concept_id, reason: 'A little more practice here will help it stick.', suggestedDifficulty: difficultyForMastery(weak.mastery_score) };
  }

  const notIntroduced = conceptsForTrack(track).find((c: Concept) => !byId.has(c.id));
  if (notIntroduced) {
    return { type: 'new', conceptId: notIntroduced.id, label: notIntroduced.label, reason: 'A new story to discover.', suggestedDifficulty: 'easy' };
  }

  return { type: 'explore', conceptId: null, label: 'Free play', reason: 'Everything in reach is in good shape — pick anything that looks fun!', suggestedDifficulty: null };
}

export function allConceptLabels(): Map<string, string> {
  return new Map(getAllConcepts().map((c) => [c.id, c.label]));
}
