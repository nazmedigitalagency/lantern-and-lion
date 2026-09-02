import type { StudentAssignment } from './types';

export type AssignmentTab = 'to_do' | 'in_progress' | 'submitted' | 'completed';

export const TAB_LABEL: Record<AssignmentTab, string> = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  completed: 'Completed',
};

export function tabForAssignment(a: StudentAssignment): AssignmentTab {
  if (a.status === 'graded' || a.status === 'returned') return 'completed';
  if (a.status === 'submitted') return 'submitted';
  if (a.status === 'in_progress') return 'in_progress';
  return 'to_do';
}

/**
 * Requested priority order: due soon > in progress > overdue > not started >
 * completed. Lower rank sorts first.
 */
export function priorityRank(a: StudentAssignment): number {
  if (a.dueBucket === 'due_today' || a.dueBucket === 'due_soon') return 0;
  if (a.status === 'in_progress') return 1;
  if (a.dueBucket === 'overdue') return 2;
  if (a.status === 'assigned') return 3;
  return 4;
}

export function sortByPriority(list: StudentAssignment[]): StudentAssignment[] {
  return [...list].sort((a, b) => priorityRank(a) - priorityRank(b));
}

/** Assignments still needing the student's attention — everything the compact widget/badge counts. */
export function pendingAssignments(list: StudentAssignment[]): StudentAssignment[] {
  return list.filter((a) => tabForAssignment(a) !== 'completed');
}

/** Friendly, never-punitive phrasing for the due-date badge. */
export function dueBadgeLabel(a: StudentAssignment): string {
  if (a.dueBucket === 'completed') return 'Done';
  if (a.dueBucket === 'overdue') return "Let's finish this one";
  if (a.dueBucket === 'due_today') return 'Due today';
  if (a.dueBucket === 'due_soon' && a.dueDate) {
    return `Due ${new Date(`${a.dueDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' })}`;
  }
  if (a.dueDate) return `Due ${new Date(`${a.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  return 'No due date';
}

/** Friendly status line shown under the title. */
export function statusLabel(a: StudentAssignment): string {
  switch (a.status) {
    case 'assigned': return a.dueBucket === 'overdue' ? 'Still waiting for you' : 'Not started';
    case 'in_progress': return 'In progress';
    case 'submitted': return 'Submitted — waiting for review';
    case 'graded':
    case 'returned': return a.score !== null ? `Graded — ${a.score}%` : 'Completed';
    default: return '';
  }
}
