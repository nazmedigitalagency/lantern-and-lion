/**
 * Shared date and message timestamp formatting utilities
 */

export function formatCardTimestamp(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'YESTERDAY';
    if (diffDays < 7) return `${diffDays} DAYS AGO`;
    if (diffDays < 14) return '1 WEEK AGO';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} WEEKS AGO`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
  } catch {
    return '';
  }
}

export function formatMessageTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}
