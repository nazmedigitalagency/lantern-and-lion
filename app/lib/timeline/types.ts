import type { SuggestedAssignment } from '../insights/types';

export type TimelineRange = 'today' | 'week' | 'month' | 'custom';

export type TimelineEventKind =
  | 'story'
  | 'assignment_submitted'
  | 'assignment_graded'
  | 'concept_practiced'
  | 'achievement'
  | 'streak_milestone'
  | 'daily_xp';

export interface TimelineEvent {
  id: string;
  /** ISO timestamp — always real, never invented. */
  occurredAt: string;
  /** YYYY-MM-DD key (family-local) this event should be grouped under. */
  dayKey: string;
  label: string;
  kind: TimelineEventKind;
  emoji: string;
  /** Whether occurredAt carries a meaningful time-of-day (true) or is a day-level rollup (false). */
  precise: boolean;
}

export interface TimelineDailySummary {
  learningSessions: number;
  activitiesCompleted: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  avgQuizScore: number | null;
  learningStreakDays: number;
}

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient_data';

export interface ProgressTrend {
  key: 'quiz_scores' | 'assignment_completion' | 'learning_activity' | 'scripture_memory' | 'consistency';
  label: string;
  trend: TrendDirection;
  detail: string | null;
}

export interface TimelineAction {
  id: string;
  reason: string;
  label: string;
  suggestedAssignment: SuggestedAssignment | null;
}

export interface StudentTimelineResponse {
  range: TimelineRange;
  startDate: string;
  endDate: string;
  summary: TimelineDailySummary;
  timeline: TimelineEvent[];
  trends: ProgressTrend[];
  actions: TimelineAction[];
}

export interface ClassActivityAssignmentRow {
  assignmentId: string;
  title: string;
  studentCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
}

export interface ClassActivityItem {
  id: string;
  occurredAt: string;
  label: string;
}

export interface ClassActivityResponse {
  range: TimelineRange;
  startDate: string;
  endDate: string;
  summary: {
    studentsActiveCount: number;
    studentCount: number;
    storiesCompletedCount: number;
    gamesPlayedCount: number;
    assignmentsCompletedCount: number;
  };
  assignments: ClassActivityAssignmentRow[];
  activity: ClassActivityItem[];
}
