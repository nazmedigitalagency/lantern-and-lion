export type NotificationPriority = 'normal' | 'important';

/** Mirrors app/lib/activity/server.ts's NotificationType — kept as a plain string union here since this file is imported by client components. */
export type ChildNotificationType =
  | 'ASSIGNMENT'
  | 'ASSIGNMENT_DUE_SOON'
  | 'ASSIGNMENT_OVERDUE'
  | 'ASSIGNMENT_GRADED'
  | 'ASSIGNMENT_FEEDBACK'
  | 'ACHIEVEMENT'
  | 'STREAK'
  | 'MULTIPLAYER_INVITATION'
  | 'TEACHER_ANNOUNCEMENT';

export type ChildNotification = {
  id: string;
  type: ChildNotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
};

export const NOTIFICATION_PRIORITY: Record<ChildNotificationType, NotificationPriority> = {
  ASSIGNMENT: 'normal',
  ASSIGNMENT_DUE_SOON: 'important',
  ASSIGNMENT_OVERDUE: 'normal',
  ASSIGNMENT_GRADED: 'normal',
  ASSIGNMENT_FEEDBACK: 'important',
  ACHIEVEMENT: 'normal',
  STREAK: 'normal',
  MULTIPLAYER_INVITATION: 'normal',
  TEACHER_ANNOUNCEMENT: 'important',
};

export const NOTIFICATION_ICON: Record<ChildNotificationType, string> = {
  ASSIGNMENT: '🔵',
  ASSIGNMENT_DUE_SOON: '⏰',
  ASSIGNMENT_OVERDUE: '💜',
  ASSIGNMENT_GRADED: '✅',
  ASSIGNMENT_FEEDBACK: '💬',
  ACHIEVEMENT: '🟢',
  STREAK: '🔥',
  MULTIPLAYER_INVITATION: '🟣',
  TEACHER_ANNOUNCEMENT: '📣',
};

/** Where a tap on this notification should take the student — never just the homepage. */
export function notificationDestination(n: Pick<ChildNotification, 'type' | 'payload'>): { tab: string; focusId?: string } | null {
  const assignmentId = typeof n.payload.assignmentId === 'string' ? n.payload.assignmentId : undefined;
  switch (n.type) {
    case 'ASSIGNMENT':
    case 'ASSIGNMENT_DUE_SOON':
    case 'ASSIGNMENT_OVERDUE':
    case 'ASSIGNMENT_GRADED':
    case 'ASSIGNMENT_FEEDBACK':
      return { tab: 'assignments', focusId: assignmentId };
    case 'ACHIEVEMENT':
    case 'STREAK':
      return { tab: 'progress' };
    case 'MULTIPLAYER_INVITATION':
      return { tab: 'home' };
    case 'TEACHER_ANNOUNCEMENT':
      return { tab: 'home' };
    default:
      return null;
  }
}

/** Groups a already-sorted (newest-first) list into Today / Yesterday / Earlier buckets for display. */
export function groupByDay(notifications: ChildNotification[]): { label: string; items: ChildNotification[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86_400_000);

  const groups: { label: string; items: ChildNotification[] }[] = [];
  const todayItems: ChildNotification[] = [];
  const yesterdayItems: ChildNotification[] = [];
  const earlierItems: ChildNotification[] = [];

  for (const n of notifications) {
    const createdAt = new Date(n.createdAt);
    if (createdAt >= today) todayItems.push(n);
    else if (createdAt >= yesterday) yesterdayItems.push(n);
    else earlierItems.push(n);
  }

  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (earlierItems.length) groups.push({ label: 'Earlier', items: earlierItems });
  return groups;
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// ── TEACHER NOTIFICATIONS ─────────────────────────────────────────

export type TeacherNotificationType =
  | 'TEACHER_ASSIGNMENT_SUBMITTED'
  | 'TEACHER_AWAITING_GRADING'
  | 'TEACHER_CHALLENGE_PROGRESS'
  | 'TEACHER_CHALLENGE_COMPLETED'
  | 'TEACHER_STUDENT_ATTENTION'
  | 'TEACHER_DEADLINE_APPROACHING'
  | 'TEACHER_EVENT_APPROACHING'
  | 'TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT'
  | 'TEACHER_STUDENT_MISSING_WORK'
  | 'TEACHER_STUDENT_PERFORMANCE_ALERT'
  | 'TEACHER_CLASS_XP_MILESTONE'
  | 'TEACHER_CLASS_ACTIVITIES_MILESTONE'
  | 'TEACHER_CLASS_ACHIEVEMENT'
  | 'TEACHER_LEARNING_INSIGHT'
  | 'TEACHER_CONNECTION_APPROVED'
  | 'TEACHER_CONNECTION_DECLINED'
  | 'TEACHER_CONNECTION_REVOKED'
  | 'TEACHER_STUDENT_REMOVED';

export type TeacherNotification = {
  id: string;
  type: TeacherNotificationType | string;
  title: string;
  body: string;
  priority?: 'high' | 'normal' | 'low';
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
};

export const TEACHER_NOTIFICATION_ICON: Record<string, string> = {
  TEACHER_ASSIGNMENT_SUBMITTED: '📝',
  TEACHER_AWAITING_GRADING: '📋',
  TEACHER_GRADING_REMINDER: '📋',
  TEACHER_CHALLENGE_PROGRESS: '🎯',
  TEACHER_CHALLENGE_COMPLETED: '🏆',
  TEACHER_STUDENT_ATTENTION: '⚠️',
  TEACHER_DEADLINE_APPROACHING: '⏰',
  TEACHER_EVENT_APPROACHING: '📅',
  TEACHER_CLASSROOM_EVENT: '📅',
  TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT: '⏰',
  TEACHER_STUDENT_MISSING_WORK: '⚠️',
  TEACHER_STUDENT_PERFORMANCE_ALERT: '📉',
  TEACHER_CLASS_XP_MILESTONE: '🌟',
  TEACHER_CLASS_ACTIVITIES_MILESTONE: '📖',
  TEACHER_CLASS_ACHIEVEMENT: '🏆',
  TEACHER_LEARNING_INSIGHT: '💡',
  TEACHER_CONNECTION_APPROVED: '🤝',
  TEACHER_CONNECTION_DECLINED: '❌',
  TEACHER_CONNECTION_REVOKED: '🔒',
  TEACHER_STUDENT_REMOVED: '👤',
  ASSIGNMENT: '📝',
  ACHIEVEMENT: '🏆',
};

export const TEACHER_NOTIFICATION_DEFAULT_PRIORITY: Record<string, 'high' | 'normal' | 'low'> = {
  TEACHER_CONNECTION_APPROVED: 'high',
  TEACHER_CONNECTION_DECLINED: 'high',
  TEACHER_CONNECTION_REVOKED: 'high',
  TEACHER_STUDENT_REMOVED: 'high',
  TEACHER_DEADLINE_APPROACHING: 'high',
  TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT: 'high',
  TEACHER_STUDENT_MISSING_WORK: 'high',
  TEACHER_STUDENT_PERFORMANCE_ALERT: 'high',
  TEACHER_STUDENT_ATTENTION: 'high',
  TEACHER_ASSIGNMENT_SUBMITTED: 'normal',
  TEACHER_AWAITING_GRADING: 'normal',
  TEACHER_GRADING_REMINDER: 'normal',
  TEACHER_CHALLENGE_PROGRESS: 'normal',
  TEACHER_CHALLENGE_COMPLETED: 'normal',
  TEACHER_CLASS_XP_MILESTONE: 'normal',
  TEACHER_CLASS_ACTIVITIES_MILESTONE: 'normal',
  TEACHER_CLASS_ACHIEVEMENT: 'normal',
  TEACHER_LEARNING_INSIGHT: 'low',
  TEACHER_EVENT_APPROACHING: 'low',
  TEACHER_CLASSROOM_EVENT: 'low',
};

export type TeacherDeepLink = {
  page: 'gradebook' | 'challenges' | 'students' | 'assignments' | 'calendar' | 'classes' | 'insights';
  submissionId?: string;
  childId?: string;
  assignmentId?: string;
  challengeId?: string;
  classroomId?: string;
  filter?: string;
  actionLabel?: string;
};

export function teacherNotificationDestination(n: Pick<TeacherNotification, 'type' | 'payload'>): TeacherDeepLink | null {
  const payload = n.payload || {};
  const submissionId = typeof payload.submissionId === 'string' ? payload.submissionId : undefined;
  const childId = typeof payload.childId === 'string' ? payload.childId : undefined;
  const assignmentId = typeof payload.assignmentId === 'string' ? payload.assignmentId : undefined;
  const challengeId = typeof payload.challengeId === 'string' ? payload.challengeId : undefined;
  const classroomId = typeof payload.classroomId === 'string' ? payload.classroomId : undefined;

  switch (n.type) {
    case 'TEACHER_ASSIGNMENT_SUBMITTED':
      return { page: 'gradebook', submissionId, childId, assignmentId, filter: 'submitted', actionLabel: 'Review Submission' };
    case 'TEACHER_AWAITING_GRADING':
      return { page: 'gradebook', assignmentId, filter: 'submitted', actionLabel: 'Grade Submissions' };
    case 'TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT':
    case 'TEACHER_DEADLINE_APPROACHING':
      return { page: 'assignments', assignmentId, actionLabel: 'View Assignment' };
    case 'TEACHER_STUDENT_MISSING_WORK':
    case 'TEACHER_STUDENT_PERFORMANCE_ALERT':
    case 'TEACHER_STUDENT_ATTENTION':
      return { page: 'students', childId, actionLabel: 'View Student' };
    case 'TEACHER_CONNECTION_APPROVED':
      return { page: 'students', childId, filter: 'approved', actionLabel: 'View Connected Student' };
    case 'TEACHER_CONNECTION_DECLINED':
      return { page: 'students', filter: 'declined', actionLabel: 'View Connection Requests' };
    case 'TEACHER_CONNECTION_REVOKED':
    case 'TEACHER_STUDENT_REMOVED':
      return { page: 'students', filter: 'revoked', actionLabel: 'View Student Roster' };
    case 'TEACHER_CHALLENGE_PROGRESS':
    case 'TEACHER_CHALLENGE_COMPLETED':
    case 'TEACHER_CLASS_ACHIEVEMENT':
      return { page: 'challenges', challengeId, classroomId, actionLabel: 'View Challenge' };
    case 'TEACHER_CLASS_XP_MILESTONE':
    case 'TEACHER_CLASS_ACTIVITIES_MILESTONE':
      return { page: 'classes', classroomId, actionLabel: 'View Classroom' };
    case 'TEACHER_LEARNING_INSIGHT':
      return { page: 'insights', classroomId, actionLabel: 'View Insights' };
    case 'TEACHER_EVENT_APPROACHING':
      return { page: 'calendar', actionLabel: 'View Calendar' };
    default:
      if (payload.tab === 'gradebook') return { page: 'gradebook', submissionId, childId, assignmentId, actionLabel: 'Open Gradebook' };
      if (payload.tab === 'challenges') return { page: 'challenges', challengeId, classroomId, actionLabel: 'Open Challenges' };
      if (payload.tab === 'students') return { page: 'students', childId, actionLabel: 'Open Students' };
      if (payload.tab === 'assignments') return { page: 'assignments', assignmentId, actionLabel: 'Open Assignments' };
      if (payload.tab === 'classes') return { page: 'classes', classroomId, actionLabel: 'Open Classes' };
      if (payload.tab === 'insights') return { page: 'insights', classroomId, actionLabel: 'Open Insights' };
      if (payload.tab === 'calendar') return { page: 'calendar', actionLabel: 'Open Calendar' };
      return null;
  }
}

export type TeacherNotificationPreferences = {
  assignment_submissions: boolean;
  grading_reminders: boolean;
  challenge_updates: boolean;
  student_inactivity_alerts: boolean;
  upcoming_deadlines: boolean;
  upcoming_events: boolean;
  class_achievements: boolean;
  learning_insights: boolean;
  connection_alerts: boolean;
  missing_work_alerts: boolean;
  student_performance_alerts: boolean;
};

export const DEFAULT_TEACHER_PREFERENCES: TeacherNotificationPreferences = {
  assignment_submissions: true,
  grading_reminders: true,
  challenge_updates: true,
  student_inactivity_alerts: true,
  upcoming_deadlines: true,
  upcoming_events: true,
  class_achievements: true,
  learning_insights: true,
  connection_alerts: true,
  missing_work_alerts: true,
  student_performance_alerts: true,
};

