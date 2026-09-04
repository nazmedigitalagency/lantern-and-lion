import type { CalendarItemType } from '../../api/teacher/calendar/route';

export const TYPE_CONFIG: Record<
  CalendarItemType,
  { label: string; icon: string; badgeClass: string; pillClass: string }
> = {
  assignment: { label: 'Assignment', icon: '📖', badgeClass: 'cal-badge-assignment', pillClass: 'pill-assignment' },
  scripture_memory: { label: 'Scripture Memory', icon: '🧠', badgeClass: 'cal-badge-memory', pillClass: 'pill-memory' },
  challenge: { label: 'Class Challenge', icon: '🏆', badgeClass: 'cal-badge-challenge', pillClass: 'pill-challenge' },
  bible_adventure: { label: 'Bible Adventure', icon: '📚', badgeClass: 'cal-badge-adventure', pillClass: 'pill-adventure' },
  event: { label: 'Classroom Event', icon: '🎉', badgeClass: 'cal-badge-event', pillClass: 'pill-event' },
  announcement: { label: 'Announcement', icon: '📣', badgeClass: 'cal-badge-announcement', pillClass: 'pill-announcement' },
};
