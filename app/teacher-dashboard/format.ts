import type { ActivityStatus } from '../lib/classrooms/types';

export const ACTIVITY_LABEL: Record<ActivityStatus, string> = {
  active: 'Active',
  recently_active: 'Recently active',
  inactive: 'Inactive',
};

export function formatLastActive(iso: string | null): string {
  if (!iso) return 'Never logged in';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Active today';
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Active ${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return `Last active ${new Date(iso).toLocaleDateString()}`;
}

export function dayLetter(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' });
}
