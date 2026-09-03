import { activityDateKey } from '../activity/server';
import type { AssignmentType } from '../assignments/types';
import type {
  ProgressTrend,
  TimelineDailySummary,
  TimelineEvent,
  TimelineRange,
  TrendDirection,
} from './types';

const DAY_MS = 86_400_000;
const MAX_CUSTOM_RANGE_DAYS = 366;
const TREND_BUCKET_DAYS = 14;
const MIN_SCORED_FOR_SCORE_TREND = 4;
const SCORE_TREND_DIFF_THRESHOLD = 10;

/** Resolves a time filter into an inclusive [startKey, endKey] pair of family-local YYYY-MM-DD date keys. */
export function resolveRangeBounds(range: TimelineRange, tz: string, customStart?: string | null, customEnd?: string | null): { startKey: string; endKey: string } {
  const todayKey = activityDateKey(tz);

  if (range === 'custom' && customStart && customEnd) {
    const start = customStart <= customEnd ? customStart : customEnd;
    const end = customStart <= customEnd ? customEnd : customStart;
    const clampedStart = new Date(`${end}T00:00:00Z`).getTime() - new Date(start).getTime() > MAX_CUSTOM_RANGE_DAYS * DAY_MS
      ? keyMinusDays(end, MAX_CUSTOM_RANGE_DAYS)
      : start;
    return { startKey: clampedStart, endKey: end > todayKey ? todayKey : end };
  }

  if (range === 'today') return { startKey: todayKey, endKey: todayKey };
  if (range === 'month') return { startKey: keyMinusDays(todayKey, 29), endKey: todayKey };
  return { startKey: keyMinusDays(todayKey, 6), endKey: todayKey };
}

export function keyMinusDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function inRange(dayKey: string, startKey: string, endKey: string): boolean {
  return dayKey >= startKey && dayKey <= endKey;
}

/** Splits assignments (by due date) into the same two 14-day buckets `computeProgressTrends` uses, so completion-rate trend math lives in one place. */
export function bucketAssignmentsByDueDate(tz: string, now: Date, rows: { dueDate: string | null; completed: boolean }[]): { recentTotal: number; recentCompleted: number; priorTotal: number; priorCompleted: number } {
  const todayKey = activityDateKey(tz, now);
  const recentStart = keyMinusDays(todayKey, TREND_BUCKET_DAYS - 1);
  const priorStart = keyMinusDays(todayKey, TREND_BUCKET_DAYS * 2 - 1);
  const priorEnd = keyMinusDays(todayKey, TREND_BUCKET_DAYS);

  let recentTotal = 0, recentCompleted = 0, priorTotal = 0, priorCompleted = 0;
  for (const r of rows) {
    if (!r.dueDate) continue;
    if (inRange(r.dueDate, recentStart, todayKey)) {
      recentTotal += 1;
      if (r.completed) recentCompleted += 1;
    } else if (inRange(r.dueDate, priorStart, priorEnd)) {
      priorTotal += 1;
      if (r.completed) priorCompleted += 1;
    }
  }
  return { recentTotal, recentCompleted, priorTotal, priorCompleted };
}

export type StoryCompletionInput = { storyId: string; title: string; completedAt: string };
export type ConceptPracticeInput = { conceptId: string; label: string; lastPracticedAt: string };
export type MilestoneEventInput = { eventType: 'ACHIEVEMENT_EARNED' | 'STREAK_EXTENDED'; occurredAt: string; metadata: { streakDay?: number } };
export type DailyRowInput = { activityDate: string; gamesCompleted: number; lessonsCompleted: number; questsCompleted: number; sessionCount: number; xpEarned: number };
export type SubmissionTimelineInput = {
  id: string;
  title: string;
  assignmentType: AssignmentType;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'returned';
  score: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
};

/**
 * Builds the "meaningful events" timeline directly from already-tracked
 * rows — story completions, assignment submissions/grades, concept
 * practice, milestones, and day-level XP — never a raw UI-click log.
 */
export function buildTimelineEvents(
  tz: string,
  input: {
    stories: StoryCompletionInput[];
    submissions: SubmissionTimelineInput[];
    conceptPractice: ConceptPracticeInput[];
    events: MilestoneEventInput[];
    dailyRows: DailyRowInput[];
  },
  startKey: string,
  endKey: string
): TimelineEvent[] {
  const items: TimelineEvent[] = [];

  for (const s of input.stories) {
    const dayKey = activityDateKey(tz, new Date(s.completedAt));
    if (!inRange(dayKey, startKey, endKey)) continue;
    items.push({ id: `story:${s.storyId}:${s.completedAt}`, occurredAt: s.completedAt, dayKey, label: `Completed “${s.title}”`, kind: 'story', emoji: '📖', precise: true });
  }

  for (const sub of input.submissions) {
    if (sub.submittedAt) {
      const dayKey = activityDateKey(tz, new Date(sub.submittedAt));
      if (inRange(dayKey, startKey, endKey)) {
        items.push({ id: `submit:${sub.id}`, occurredAt: sub.submittedAt, dayKey, label: `Submitted “${sub.title}”`, kind: 'assignment_submitted', emoji: '📤', precise: true });
      }
    }
    if (sub.gradedAt && (sub.status === 'graded' || sub.status === 'returned')) {
      const dayKey = activityDateKey(tz, new Date(sub.gradedAt));
      if (inRange(dayKey, startKey, endKey)) {
        const label = sub.score !== null ? `Scored ${sub.score}% on “${sub.title}”` : `Received a grade on “${sub.title}”`;
        items.push({ id: `grade:${sub.id}`, occurredAt: sub.gradedAt, dayKey, label, kind: 'assignment_graded', emoji: '✅', precise: true });
      }
    }
  }

  for (const c of input.conceptPractice) {
    const dayKey = activityDateKey(tz, new Date(c.lastPracticedAt));
    if (!inRange(dayKey, startKey, endKey)) continue;
    items.push({ id: `concept:${c.conceptId}:${c.lastPracticedAt}`, occurredAt: c.lastPracticedAt, dayKey, label: `Practiced “${c.label}”`, kind: 'concept_practiced', emoji: '🧠', precise: true });
  }

  for (const e of input.events) {
    const dayKey = activityDateKey(tz, new Date(e.occurredAt));
    if (!inRange(dayKey, startKey, endKey)) continue;
    const isStreak = e.eventType === 'STREAK_EXTENDED';
    items.push({
      id: `event:${e.eventType}:${e.occurredAt}`,
      occurredAt: e.occurredAt,
      dayKey,
      label: isStreak ? `Reached a ${e.metadata.streakDay ?? '?'}-day learning streak` : 'Earned an achievement',
      kind: isStreak ? 'streak_milestone' : 'achievement',
      emoji: isStreak ? '🔥' : '🏆',
      precise: true,
    });
  }

  for (const r of input.dailyRows) {
    if (!inRange(r.activityDate, startKey, endKey)) continue;
    if (r.xpEarned <= 0) continue;
    items.push({ id: `xp:${r.activityDate}`, occurredAt: `${r.activityDate}T12:00:00.000Z`, dayKey: r.activityDate, label: `Earned ${r.xpEarned} XP`, kind: 'daily_xp', emoji: '⭐', precise: false });
  }

  return items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function buildDailySummary(
  startKey: string,
  endKey: string,
  dailyRows: DailyRowInput[],
  storiesInRange: number,
  assignmentsInRange: { completed: boolean }[],
  quizScoresInRange: number[],
  currentStreak: number
): TimelineDailySummary {
  const rows = dailyRows.filter((r) => inRange(r.activityDate, startKey, endKey));
  const learningSessions = rows.reduce((sum, r) => sum + r.sessionCount, 0);
  const activitiesCompleted = rows.reduce((sum, r) => sum + r.gamesCompleted + r.lessonsCompleted + r.questsCompleted, 0) + storiesInRange;
  const assignmentsCompleted = assignmentsInRange.filter((a) => a.completed).length;
  const avgQuizScore = quizScoresInRange.length ? Math.round(quizScoresInRange.reduce((a, b) => a + b, 0) / quizScoresInRange.length) : null;

  return {
    learningSessions,
    activitiesCompleted,
    assignmentsCompleted,
    assignmentsTotal: assignmentsInRange.length,
    avgQuizScore,
    learningStreakDays: currentStreak,
  };
}

function numericScoreTrend(key: ProgressTrend['key'], label: string, chronological: { score: number; at: string }[]): ProgressTrend {
  const sorted = [...chronological].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  if (sorted.length < MIN_SCORED_FOR_SCORE_TREND) return { key, label, trend: 'insufficient_data', detail: null };

  const windowSize = Math.min(3, Math.floor(sorted.length / 2));
  const recent = sorted.slice(-windowSize).map((s) => s.score);
  const prior = sorted.slice(-windowSize * 2, -windowSize).map((s) => s.score);
  const recentAvg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  const priorAvg = Math.round(prior.reduce((a, b) => a + b, 0) / prior.length);
  const diff = recentAvg - priorAvg;

  if (diff >= SCORE_TREND_DIFF_THRESHOLD) return { key, label, trend: 'improving', detail: `${label} improved from ${priorAvg}% to ${recentAvg}% over the last ${recent.length + prior.length} graded assignments.` };
  if (diff <= -SCORE_TREND_DIFF_THRESHOLD) return { key, label, trend: 'declining', detail: `${label} dropped from ${priorAvg}% to ${recentAvg}% over the last ${recent.length + prior.length} graded assignments.` };
  return { key, label, trend: 'stable', detail: `${label} has stayed steady around ${recentAvg}% recently.` };
}

/** Splits the last 28 days into two 14-day buckets and compares raw counts — used for activity volume and consistency, where the signal is "more/less happening," not a graded score. */
function countBucketTrend(key: ProgressTrend['key'], label: string, recentCount: number, priorCount: number, unit: string): ProgressTrend {
  if (recentCount + priorCount < 3) return { key, label, trend: 'insufficient_data', detail: null };

  if (priorCount === 0 && recentCount > 0) return { key, label, trend: 'improving', detail: `${label}: went from no ${unit} to ${recentCount} in the last two weeks.` };
  if (recentCount === 0 && priorCount > 0) return { key, label, trend: 'declining', detail: `${label}: dropped from ${priorCount} ${unit} to none in the last two weeks.` };

  const ratio = priorCount === 0 ? 1 : recentCount / priorCount;
  const diff = recentCount - priorCount;
  if (ratio >= 1.3 && diff >= 2) return { key, label, trend: 'improving', detail: `${label} rose from ${priorCount} to ${recentCount} ${unit} over the last two weeks (vs. the two before).` };
  if (ratio <= 0.7 && diff <= -2) return { key, label, trend: 'declining', detail: `${label} fell from ${priorCount} to ${recentCount} ${unit} over the last two weeks (vs. the two before).` };
  return { key, label, trend: 'stable', detail: `${label} has stayed steady — around ${recentCount} ${unit} over the last two weeks.` };
}

/**
 * Progress trends always look at a fixed ~28-day lookback regardless of the
 * display filter — a trend needs enough history to mean anything, which
 * "today" or a narrow custom range can't provide on its own.
 */
export function computeProgressTrends(
  tz: string,
  now: Date,
  quizSubs: { score: number; at: string }[],
  memorySubs: { score: number; at: string }[],
  assignmentsByBucket: { recentTotal: number; recentCompleted: number; priorTotal: number; priorCompleted: number },
  dailyRows: DailyRowInput[],
  storyDates: string[]
): ProgressTrend[] {
  const todayKey = activityDateKey(tz, now);
  const recentStart = keyMinusDays(todayKey, TREND_BUCKET_DAYS - 1);
  const priorStart = keyMinusDays(todayKey, TREND_BUCKET_DAYS * 2 - 1);
  const priorEnd = keyMinusDays(todayKey, TREND_BUCKET_DAYS);

  const recentRows = dailyRows.filter((r) => inRange(r.activityDate, recentStart, todayKey));
  const priorRows = dailyRows.filter((r) => inRange(r.activityDate, priorStart, priorEnd));
  const recentStories = storyDates.filter((d) => inRange(activityDateKey(tz, new Date(d)), recentStart, todayKey)).length;
  const priorStories = storyDates.filter((d) => inRange(activityDateKey(tz, new Date(d)), priorStart, priorEnd)).length;
  const recentActivity = recentRows.reduce((s, r) => s + r.gamesCompleted + r.lessonsCompleted + r.questsCompleted, 0) + recentStories;
  const priorActivity = priorRows.reduce((s, r) => s + r.gamesCompleted + r.lessonsCompleted + r.questsCompleted, 0) + priorStories;

  const recentActiveDays = recentRows.filter((r) => r.gamesCompleted + r.lessonsCompleted + r.questsCompleted > 0 || r.xpEarned > 0).length + (recentStories > 0 ? 1 : 0);
  const priorActiveDays = priorRows.filter((r) => r.gamesCompleted + r.lessonsCompleted + r.questsCompleted > 0 || r.xpEarned > 0).length + (priorStories > 0 ? 1 : 0);

  const assignmentTrend: ProgressTrend = (() => {
    const { recentTotal, recentCompleted, priorTotal, priorCompleted } = assignmentsByBucket;
    if (recentTotal < 3 || priorTotal < 3) return { key: 'assignment_completion', label: 'Assignment completion', trend: 'insufficient_data', detail: null };
    const recentRate = Math.round((recentCompleted / recentTotal) * 100);
    const priorRate = Math.round((priorCompleted / priorTotal) * 100);
    const diff = recentRate - priorRate;
    if (diff >= 15) return { key: 'assignment_completion', label: 'Assignment completion', trend: 'improving', detail: `Assignment completion rose from ${priorRate}% to ${recentRate}% over the last two weeks.` };
    if (diff <= -15) return { key: 'assignment_completion', label: 'Assignment completion', trend: 'declining', detail: `Assignment completion dropped from ${priorRate}% to ${recentRate}% over the last two weeks.` };
    return { key: 'assignment_completion', label: 'Assignment completion', trend: 'stable', detail: `Assignment completion has stayed around ${recentRate}% recently.` };
  })();

  return [
    numericScoreTrend('quiz_scores', 'Quiz scores', quizSubs),
    assignmentTrend,
    countBucketTrend('learning_activity', 'Learning activity', recentActivity, priorActivity, 'activities'),
    numericScoreTrend('scripture_memory', 'Scripture memory', memorySubs),
    countBucketTrend('consistency', 'Learning consistency', recentActiveDays, priorActiveDays, 'active days'),
  ];
}

export function trendBadgeEmoji(trend: TrendDirection): string {
  if (trend === 'improving') return '📈';
  if (trend === 'declining') return '📉';
  if (trend === 'stable') return '➡️';
  return '❔';
}
