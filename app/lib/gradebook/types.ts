import type { AssignmentType, SubmissionStatus } from '../assignments/types';
import type { TrendDirection } from '../timeline/types';

export type GradebookAssignmentColumn = {
  id: string;
  title: string;
  assignmentType: AssignmentType;
  dueDate: string | null;
};

export type GradebookCell = {
  status: SubmissionStatus;
  score: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  feedback: string | null;
  responseText: string | null;
  scoreOverridden: boolean;
  overdue: boolean;
};

export type GradebookStudentRow = {
  studentId: string;
  name: string;
  cells: Record<string, GradebookCell>;
  average: number | null;
  completed: number;
  pending: number;
  overdue: number;
  trend: TrendDirection;
  trendDetail: string | null;
};

export type ClassGradebookResponse = {
  classroom: { id: string; name: string };
  assignments: GradebookAssignmentColumn[];
  students: GradebookStudentRow[];
  classSummary: {
    avgScore: number | null;
    completionRate: number | null;
    awaitingGrading: number;
    overdueCount: number;
    mostImproved: { studentId: string; name: string; detail: string } | null;
  };
};

/** One row in the cross-assignment "needs grading" queue — flat, filterable client-side. */
export type GradebookQueueItem = {
  assignmentId: string;
  assignmentTitle: string;
  assignmentType: AssignmentType;
  isAutoScored: boolean;
  childId: string;
  studentName: string;
  classroomName: string | null;
  status: SubmissionStatus;
  score: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  dueDate: string | null;
  overdue: boolean;
  responseText: string | null;
  feedback: string | null;
  scoreOverridden: boolean;
};
