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
