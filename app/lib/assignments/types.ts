// Shared types for the teacher Assignment Center and the student-facing
// assignment list — one model, two views, per "don't create a separate
// disconnected student assignment experience."

export type AssignmentType = 'story' | 'reading' | 'quiz' | 'memory' | 'game' | 'written' | 'custom';
export type AssignmentPublishStatus = 'draft' | 'assigned';
export type SubmissionStatus = 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'returned';

/** The bucket the Assignment Center groups by — derived, never stored. */
export type AssignmentBucket = 'draft' | 'due_soon' | 'overdue' | 'completed' | 'active';

/** Whether a type is scored automatically from real product data, or needs a human to grade it. */
export function isAutoScoredType(type: AssignmentType): boolean {
  return type === 'story' || type === 'reading' || type === 'quiz' || type === 'memory' || type === 'game';
}

export type AssignmentTargetRef = { id: string; name: string };

export type AssignmentListItem = {
  id: string;
  title: string;
  assignmentType: AssignmentType;
  referenceId: string | null;
  referenceLabel: string | null;
  classroom: AssignmentTargetRef | null;
  studentCount: number;
  createdAt: string;
  dueDate: string | null;
  status: AssignmentPublishStatus;
  bucket: AssignmentBucket;
  completedCount: number;
  gradedCount: number;
  avgScore: number | null;
  requiredScore: number | null;
  xpReward: number | null;
};

export type AssignmentSubmissionRow = {
  childId: string;
  studentName: string;
  status: SubmissionStatus;
  score: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  feedback: string | null;
  responseText: string | null;
  scoreOverridden: boolean;
};

export type AssignmentDetail = AssignmentListItem & {
  instructions: string | null;
  timeLimitMinutes: number | null;
  submissions: AssignmentSubmissionRow[];
};

// The student-facing view (child/teen dashboard).
export type StudentAssignment = {
  id: string;
  title: string;
  instructions: string | null;
  assignmentType: AssignmentType;
  /** The activity's own display name (e.g. the story title), when the type points at one. */
  referenceLabel: string | null;
  contentLink: string | null;
  /** The classroom this came through, if assigned via a class rather than individually. */
  classroomName: string | null;
  dueDate: string | null;
  timeLimitMinutes: number | null;
  requiredScore: number | null;
  xpReward: number | null;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  teacherName?: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  dueBucket: 'upcoming' | 'due_today' | 'due_soon' | 'overdue' | 'completed';
};

/** Friendly, non-punitive category label for each assignment type — matches the teacher's own creation-form labels. */
export const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  story: 'Interactive Story',
  reading: 'Bible Reading',
  quiz: 'Bible Quiz',
  memory: 'Scripture Memory',
  game: 'Game Challenge',
  written: 'Written Response',
  custom: 'Custom Assignment',
};

// ── PARENT-FACING ASSIGNMENT TYPES (FEATURE 12) ───────────────────

export type ParentAssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'completed' | 'overdue';

export type ParentAssignmentItem = {
  id: string;
  assignmentId: string;
  childId: string;
  childName: string;
  title: string;
  instructions: string | null;
  assignmentType: AssignmentType;
  referenceLabel: string | null;
  classroomName: string | null;
  teacherName: string | null;
  dueDate: string | null;
  status: ParentAssignmentStatus;
  rawStatus: SubmissionStatus;
  score: number | null;
  requiredScore: number | null;
  feedback: string | null;
  xpReward: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  assignedAt: string | null;
};

export type ParentWeeklyProgress = {
  completedCount: number;
  totalCount: number;
  completedFraction: string; // e.g. "4/5 completed"
  averageScore: number | null; // e.g. 87 (percent)
  sessionCount: number; // e.g. 5 (sessions)
  sessionLabel: string; // e.g. "5 sessions"
};

export type ParentTimelineEventType = 'assigned' | 'completed' | 'graded' | 'feedback' | 'announcement';

export type ParentTimelineEvent = {
  id: string;
  childId: string;
  childName: string;
  eventType: ParentTimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  score?: number | null;
  feedback?: string | null;
  assignmentId?: string;
};

export type ParentChildAssignmentsPayload = {
  childId: string;
  childName: string;
  weeklyProgress: ParentWeeklyProgress;
  assignments: ParentAssignmentItem[];
  timeline: ParentTimelineEvent[];
};

export function computeParentAssignmentStatus(rawStatus: SubmissionStatus, dueDate: string | null): ParentAssignmentStatus {
  if (rawStatus === 'graded' || rawStatus === 'returned') return 'graded';
  if (rawStatus === 'submitted') return 'submitted';
  if (rawStatus === 'in_progress') {
    if (dueDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const due = new Date(`${dueDate}T00:00:00`);
      if (due < today) return 'overdue';
    }
    return 'in_progress';
  }
  // status === 'assigned'
  if (dueDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(`${dueDate}T00:00:00`);
    if (due < today) return 'overdue';
  }
  return 'assigned';
}

