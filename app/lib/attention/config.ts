// Feature 14: Students Who Need Attention — every threshold this feature
// uses lives here, in one place, so nothing is a magic number scattered
// across classrooms/server.ts and insights/server.ts.
//
// This is an educational-activity signal system, not a diagnostic one: each
// threshold exists to avoid false alarms (one missed day, one bad quiz)
// while still surfacing real, sustained, actionable patterns early.

export type AttentionPriority = 'high' | 'medium' | 'low';

export const ATTENTION_THRESHOLDS = {
  /** Below this, inactivity isn't flagged at all — a day or two off is normal. */
  INACTIVE_DAYS_TO_FLAG: 5,
  /** At or above this many days inactive, it's a High-priority signal on its own. */
  INACTIVE_DAYS_HIGH: 14,

  /** One overdue assignment is worth a mention; this is the floor to flag at all. */
  OVERDUE_TO_FLAG: 1,
  /** At or above this many overdue assignments, it's High priority on its own. */
  OVERDUE_HIGH: 3,

  /** Minimum percentage-point drop (recent vs. prior average) to call it a real decline, not noise from one quiz. */
  QUIZ_DECLINE_MIN_POINTS: 10,
  /** A drop at or beyond this many points is High priority on its own. */
  QUIZ_DECLINE_HIGH_POINTS: 25,

  /** Minimum number of distinct concepts marked "needs_reinforcement" before it's worth surfacing. */
  STRUGGLING_CONCEPTS_MIN: 2,

  /** Cap on how many students the "Needs Attention" list surfaces at once, ordered by priority. */
  MAX_ATTENTION_ENTRIES: 12,
  /** Cap for the compact dashboard-overview preview card. */
  MAX_ATTENTION_PREVIEW: 4,
} as const;

const PRIORITY_RANK: Record<AttentionPriority, number> = { high: 3, medium: 2, low: 1 };

export function priorityAtLeast(a: AttentionPriority, b: AttentionPriority): boolean {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b];
}

export function comparePriorityDesc(a: AttentionPriority, b: AttentionPriority): number {
  return PRIORITY_RANK[b] - PRIORITY_RANK[a];
}

/**
 * Worst-case severity across every real signal that fired for this student.
 * Pure and dependency-free by design (every number it uses lives above in
 * this same file) so it ranks urgency for a teacher's attention — it never
 * labels or diagnoses the child.
 */
export function computeAttentionPriority(input: {
  overdueCount: number;
  inactiveDays: number | null;
  trendDeclining: boolean;
  trendDiff: number | null;
  strugglingCount: number;
  needsHelp: boolean;
}): AttentionPriority {
  const { overdueCount, inactiveDays, trendDeclining, trendDiff, strugglingCount, needsHelp } = input;

  const isHigh =
    overdueCount >= ATTENTION_THRESHOLDS.OVERDUE_HIGH ||
    (inactiveDays !== null && inactiveDays >= ATTENTION_THRESHOLDS.INACTIVE_DAYS_HIGH) ||
    (trendDeclining && trendDiff !== null && trendDiff <= -ATTENTION_THRESHOLDS.QUIZ_DECLINE_HIGH_POINTS);
  if (isHigh) return 'high';

  const isMedium =
    overdueCount >= ATTENTION_THRESHOLDS.OVERDUE_TO_FLAG ||
    (inactiveDays !== null && inactiveDays >= ATTENTION_THRESHOLDS.INACTIVE_DAYS_TO_FLAG) ||
    trendDeclining ||
    needsHelp ||
    strugglingCount >= ATTENTION_THRESHOLDS.STRUGGLING_CONCEPTS_MIN;
  if (isMedium) return 'medium';

  return 'low';
}
