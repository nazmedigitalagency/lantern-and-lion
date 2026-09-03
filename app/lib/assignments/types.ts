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
