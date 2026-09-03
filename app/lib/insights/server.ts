import type { ConceptMasteryRow } from '../adaptive/server';
import { recommendNextActivity } from '../adaptive/server';
import { getConcept } from '../adaptive/concepts';
import { getStory } from '../../stories/catalog';
import type { CurriculumModule } from '../../curriculum-data';
import type { AssignmentType } from '../assignments/types';
import type { StudentCard } from '../classrooms/types';
import type {
  AttentionEntry,
  ClassInsight,
  ClassMetric,
  ImprovingEntry,
  MetricKey,
  StudentRecommendation,
  StudentTrend,
  SuggestedAssignment,
  TopicInsight,
} from './types';

// Below these sample sizes a percentage is more noise than signal, so the
// metric/topic/trend is simply left out rather than shown with false
// confidence — the "only show insights where enough real data exists" rule
// applied consistently everywhere in this module.
const MIN_GRADED_FOR_TYPE_METRIC = 3;
const MIN_STUDENTS_FOR_TOPIC_CLAIM = 2;
const MIN_SCORED_FOR_TREND_SPLIT = 4;
const MIN_RECENT_CONCEPTS_FOR_TREND_FALLBACK = 2;
const STRENGTH_THRESHOLD = 75;
const PRACTICE_THRESHOLD = 65;
const RECENT_DAYS = 7;
const TREND_LOOKBACK_DAYS = 14;

export type SubmissionRow = {
  assignmentId: string;
  childId: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'returned';
  score: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
};

export type AssignmentRow = {
  id: string;
  assignmentType: AssignmentType;
  dueDate: string | null;
  status: 'draft' | 'assigned';
};

const TYPE_METRIC: Partial<Record<AssignmentType, { key: MetricKey; emoji: string; label: string }>> = {
  quiz: { key: 'quiz', emoji: '🎯', label: 'Quiz Performance' },
  memory: { key: 'memory', emoji: '✍️', label: 'Scripture Memory' },
  reading: { key: 'reading', emoji: '📗', label: 'Bible Reading' },
};

function completedStatus(status: SubmissionRow['status']): boolean {
  return status === 'submitted' || status === 'graded' || status === 'returned';
}

/** Per-assignment-type average score and completion, gated to types with enough graded work to mean something. */
export function computeAssignmentTypeMetrics(assignments: AssignmentRow[], submissions: SubmissionRow[]): ClassMetric[] {
  const byAssignment = new Map(assignments.map((a) => [a.id, a]));
  const metrics: ClassMetric[] = [];

  for (const [type, meta] of Object.entries(TYPE_METRIC) as [AssignmentType, { key: MetricKey; emoji: string; label: string }][]) {
    const scored = submissions.filter((s) => {
      const a = byAssignment.get(s.assignmentId);
      return a?.assignmentType === type && (s.status === 'graded' || s.status === 'returned') && s.score !== null;
    });
    if (scored.length < MIN_GRADED_FOR_TYPE_METRIC) continue;
    const avg = Math.round(scored.reduce((sum, s) => sum + (s.score || 0), 0) / scored.length);
    metrics.push({ key: meta.key, emoji: meta.emoji, label: meta.label, value: avg, sampleSize: scored.length, sampleUnit: 'graded' });
  }

  // Story assignments are completion-only (no partial credit), so they read
  // as a completion rate rather than an average score — a different, still
  // honest, framing for the same underlying data.
  const storySubs = submissions.filter((s) => byAssignment.get(s.assignmentId)?.assignmentType === 'story');
  if (storySubs.length >= MIN_GRADED_FOR_TYPE_METRIC) {
    const done = storySubs.filter((s) => completedStatus(s.status)).length;
    metrics.push({ key: 'story_completion', emoji: '📖', label: 'Bible Story Completion', value: Math.round((done / storySubs.length) * 100), sampleSize: storySubs.length, sampleUnit: 'assigned' });
  }

  return metrics;
}

/** Overall assignment completion across every type — always shown if any assignment exists, since it's a simple real fraction, not a sampled average. */
export function computeAssignmentCompletion(submissions: SubmissionRow[]): ClassMetric | null {
  if (submissions.length === 0) return null;
  const done = submissions.filter((s) => completedStatus(s.status)).length;
  return { key: 'assignment_completion', emoji: '✅', label: 'Assignment Completion', value: Math.round((done / submissions.length) * 100), sampleSize: submissions.length, sampleUnit: 'assigned' };
}

/** Overall concept mastery average — the same formula the classroom detail page already calls avgPerformance, kept identical so the numbers never drift between pages. */
export function computeBibleKnowledgeMetric(cards: StudentCard[]): ClassMetric | null {
  const tracked = cards.filter((c) => c.masteryTracked);
  if (tracked.length === 0) return null;
  const avg = Math.round(tracked.reduce((sum, c) => sum + c.masteryPercent, 0) / tracked.length);
  return { key: 'bible_knowledge', emoji: '📖', label: 'Bible Knowledge', value: avg, sampleSize: tracked.length, sampleUnit: 'students' };
}

/** % of the class active at least 3 of the last 7 days — a real consistency bar, not just "logged in once." */
export function computeConsistencyMetric(cards: StudentCard[]): ClassMetric | null {
  if (cards.length === 0) return null;
  const consistent = cards.filter((c) => c.weeklyActiveDays >= 3).length;
  return { key: 'consistency', emoji: '🔥', label: 'Learning Consistency', value: Math.round((consistent / cards.length) * 100), sampleSize: cards.length, sampleUnit: 'students' };
}

export type TopicMasteryInput = { childId: string; conceptId: string; masteryScore: number; correctCount: number; incorrectCount: number; consecutiveCorrect: number; lastPracticedAt: string };

function topicFromRows(rows: TopicMasteryInput[], conceptId: string): TopicInsight {
  const avgMastery = Math.round(rows.reduce((sum, r) => sum + r.masteryScore, 0) / rows.length);
  return { conceptId, label: getConcept(conceptId)?.label || conceptId, avgMastery, studentCount: new Set(rows.map((r) => r.childId)).size };
}

/** Class-wide topic (curriculum concept) breakdown — strong/weak/most-practiced/recently-improved, each gated on enough distinct students to be a class-level claim rather than one child's result. */
export function computeTopicInsights(rows: TopicMasteryInput[]): { strong: TopicInsight[]; needsPractice: TopicInsight[]; mostPracticed: TopicInsight[]; recentlyImproved: TopicInsight[] } {
  const byConcept = new Map<string, TopicMasteryInput[]>();
  for (const row of rows) {
    const list = byConcept.get(row.conceptId) || [];
    list.push(row);
    byConcept.set(row.conceptId, list);
  }

  const topics = Array.from(byConcept.entries())
    .filter(([, rs]) => new Set(rs.map((r) => r.childId)).size >= MIN_STUDENTS_FOR_TOPIC_CLAIM)
    .map(([conceptId, rs]) => topicFromRows(rs, conceptId));

  const strong = [...topics].filter((t) => t.avgMastery >= STRENGTH_THRESHOLD).sort((a, b) => b.avgMastery - a.avgMastery).slice(0, 3);
  const needsPractice = [...topics].filter((t) => t.avgMastery < PRACTICE_THRESHOLD).sort((a, b) => a.avgMastery - b.avgMastery).slice(0, 3);

  const mostPracticed = Array.from(byConcept.entries())
    .map(([conceptId, rs]) => ({ conceptId, label: getConcept(conceptId)?.label || conceptId, avgMastery: Math.round(rs.reduce((s, r) => s + r.masteryScore, 0) / rs.length), studentCount: new Set(rs.map((r) => r.childId)).size, practiceEvents: rs.reduce((s, r) => s + r.correctCount + r.incorrectCount, 0) }))
    .filter((t) => t.practiceEvents > 0)
    .sort((a, b) => b.practiceEvents - a.practiceEvents)
    .slice(0, 5)
    .map(({ conceptId, label, avgMastery, studentCount }) => ({ conceptId, label, avgMastery, studentCount }));

  const now = Date.now();
  const recentlyImproved = Array.from(byConcept.entries())
    .map(([conceptId, rs]) => {
      const improving = rs.filter((r) => r.consecutiveCorrect >= 2 && now - new Date(r.lastPracticedAt).getTime() <= RECENT_DAYS * 86_400_000);
      return { conceptId, rows: improving };
    })
    .filter((t) => t.rows.length >= 1)
    .map((t) => topicFromRows(t.rows, t.conceptId))
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 3);

  return { strong, needsPractice, mostPracticed, recentlyImproved };
}

/**
 * A student's own graded-assignment score history is the clearest real trend
 * signal (concrete before/after numbers); when there isn't enough of it yet,
 * falls back to concept-mastery "correct/incorrect in a row" streaks from the
 * last two weeks — still real, still historical, just coarser. Below both
 * thresholds, honestly reports insufficient data rather than guessing.
 */
export function computeStudentTrend(name: string, scoredChronological: number[], masteryRows: ConceptMasteryRow[]): StudentTrend {
  if (scoredChronological.length >= MIN_SCORED_FOR_TREND_SPLIT) {
    const windowSize = Math.min(3, Math.floor(scoredChronological.length / 2));
    const recent = scoredChronological.slice(-windowSize);
    const prior = scoredChronological.slice(-windowSize * 2, -windowSize);
    const recentAvg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
    const priorAvg = Math.round(prior.reduce((a, b) => a + b, 0) / prior.length);
    const diff = recentAvg - priorAvg;
    if (diff >= 10) return { trend: 'improving', detail: `${name}'s assignment scores improved from ${priorAvg}% to ${recentAvg}% over the last ${recent.length + prior.length} graded assignments.` };
    if (diff <= -10) return { trend: 'declining', detail: `${name}'s assignment scores dropped from ${priorAvg}% to ${recentAvg}% over the last ${recent.length + prior.length} graded assignments.` };
    return { trend: 'stable', detail: `${name}'s assignment scores have stayed steady around ${recentAvg}% recently.` };
  }

  const now = Date.now();
  const recentRows = masteryRows.filter((r) => now - new Date(r.last_practiced_at).getTime() <= TREND_LOOKBACK_DAYS * 86_400_000);
  if (recentRows.length < MIN_RECENT_CONCEPTS_FOR_TREND_FALLBACK) return { trend: 'insufficient_data', detail: null };

  const improvingCount = recentRows.filter((r) => r.consecutive_correct >= 2).length;
  const decliningCount = recentRows.filter((r) => r.consecutive_incorrect >= 2).length;

  if (improvingCount > decliningCount && improvingCount >= 1) {
    return { trend: 'improving', detail: `${name} has been answering correctly multiple times in a row on ${improvingCount} recent topic${improvingCount === 1 ? '' : 's'}.` };
  }
  if (decliningCount > improvingCount && decliningCount >= 1) {
    return { trend: 'declining', detail: `${name} has missed a few in a row on ${decliningCount} recent topic${decliningCount === 1 ? '' : 's'} — worth a quick check-in.` };
  }
  return { trend: 'stable', detail: null };
}

/**
 * The "what should I do with this student?" engine. Rules-based, not AI —
 * built directly on the existing adaptive `recommendNextActivity` decision
 * (due review > needs reinforcement > next new concept > free explore), the
 * same logic that already drives what a child sees next on their own
 * dashboard, just phrased for a teacher and turned into an assignment target.
 */
export function computeStudentRecommendation(name: string, card: StudentCard, masteryRows: ConceptMasteryRow[], track: CurriculumModule['track'], strengths: { label: string }[]): StudentRecommendation | null {
  if (!card.masteryTracked && masteryRows.length === 0) return null;

  const next = recommendNextActivity(masteryRows, track);
  const strengthLabel = strengths[0]?.label;

  if (next.type === 'explore') {
    return {
      headline: strengthLabel ? `${name} is doing well across the board, especially ${strengthLabel}.` : `${name} is doing well across the board.`,
      recommendation: 'Everything currently in reach is in good shape — a good moment to introduce something new when you’re ready.',
      suggestedAssignment: null,
    };
  }

  if (!next.conceptId) return null;

  const story = findStoryForConcept(next.conceptId);
  const suggestedAssignment: SuggestedAssignment = story
    ? { title: story.title, instructions: null, assignmentType: 'story', referenceId: story.id, ageGroup: track === 'teen' ? 'teen' : 'child' }
    : { title: next.label, instructions: null, assignmentType: next.type === 'new' ? 'reading' : 'quiz', referenceId: next.conceptId, ageGroup: track === 'teen' ? 'teen' : 'child' };

  const headline = strengthLabel && strengthLabel !== next.label
    ? `${name} is performing strongly on ${strengthLabel} but could use more practice with ${next.label}.`
    : `${name} is ready for a bit more practice with ${next.label}.`;

  const recommendation = next.type === 'review'
    ? `Assign a ${next.label} review — it's due for review to keep it fresh.`
    : next.type === 'reinforce'
      ? `Assign a ${next.label} practice round — a little more repetition will help it stick.`
      : `Assign ${next.label} as a next step — ${name} hasn't covered it yet.`;

  return { headline, recommendation, suggestedAssignment };
}

function findStoryForConcept(conceptId: string): { id: string; title: string } | null {
  // Only david-and-goliath and noah-and-the-ark exist today; this resolves for those and nothing else, honestly.
  for (const candidate of ['david-and-goliath', 'noah-and-the-ark']) {
    const story = getStory(candidate);
    if (story && story.conceptId === conceptId) return { id: story.id, title: story.title };
  }
  return null;
}

/** Class-level strength/practice cards — a curated, capped subset of the metrics above, each turned into a plain sentence with an optional [Create Assignment] action. */
export function buildClassInsightCards(metrics: ClassMetric[], weakestTopic: TopicInsight | null): { strengths: ClassInsight[]; areasToPractice: ClassInsight[] } {
  const strengthMetrics = [...metrics].filter((m) => m.value >= STRENGTH_THRESHOLD).sort((a, b) => b.value - a.value).slice(0, 3);
  const strengths: ClassInsight[] = strengthMetrics.map((m) => ({
    id: `strength-${m.key}`,
    tone: 'strength',
    emoji: m.emoji,
    headline: m.label,
    detail: `${m.value}% average${m.sampleUnit ? ` across ${m.sampleSize} ${m.sampleUnit}` : ''}.`,
  }));

  const weakMetrics = [...metrics].filter((m) => m.value < PRACTICE_THRESHOLD).sort((a, b) => a.value - b.value).slice(0, 2);
  const areasToPractice: ClassInsight[] = weakMetrics.map((m) => ({
    id: `practice-${m.key}`,
    tone: 'practice',
    emoji: m.emoji,
    headline: `${m.label} is currently the weakest area across the class.`,
    detail: `${m.value}% average across ${m.sampleSize} ${m.sampleUnit}.`,
    action: {
      label: 'Create Assignment',
      suggestedAssignment: {
        title: `${m.label} Practice`,
        instructions: null,
        assignmentType: m.key === 'memory' ? 'memory' : m.key === 'reading' ? 'reading' : m.key === 'story_completion' ? 'story' : 'quiz',
        referenceId: null,
        ageGroup: 'both',
      },
    },
  }));

  if (weakestTopic && areasToPractice.length < 2) {
    areasToPractice.push({
      id: `practice-topic-${weakestTopic.conceptId}`,
      tone: 'practice',
      emoji: '📌',
      headline: `${weakestTopic.label} is currently a common weak spot across the class.`,
      detail: `${weakestTopic.avgMastery}% average mastery across ${weakestTopic.studentCount} students.`,
      action: {
        label: 'Create Assignment',
        suggestedAssignment: { title: `${weakestTopic.label} Review`, instructions: null, assignmentType: 'quiz', referenceId: weakestTopic.conceptId, ageGroup: 'both' },
      },
    });
  }

  return { strengths, areasToPractice };
}

/** Aggregates each student's own needs-attention reasons plus two Insights-only signals (overdue assignments, declining trend) — additive only, never touching the shared My Students computation. */
export function buildAttentionEntry(card: StudentCard, overdueCount: number, trend: StudentTrend): AttentionEntry | null {
  const reasons = [...card.needsAttentionReasons];
  if (overdueCount >= 2) reasons.push(`Has ${overdueCount} overdue assignments.`);
  else if (overdueCount === 1) reasons.push('Has 1 overdue assignment.');
  if (trend.trend === 'declining' && trend.detail) reasons.push(trend.detail);
  if (reasons.length === 0) return null;
  return { studentId: card.id, name: card.name, reasons };
}

export function buildImprovingEntry(card: StudentCard, trend: StudentTrend): ImprovingEntry | null {
  if (trend.trend !== 'improving' || !trend.detail) return null;
  return { studentId: card.id, name: card.name, detail: trend.detail };
}
