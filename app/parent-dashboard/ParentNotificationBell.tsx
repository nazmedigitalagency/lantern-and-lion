'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PARENT_NOTIFICATION_ICON,
  parentNotificationDestination,
  relativeTime,
  type ParentNotification,
} from '../lib/notifications/types';

const INITIAL_PARENT_NOTIFICATIONS: ParentNotification[] = [
  {
    id: 'pn-1',
    type: 'PARENT_HELP_REQUEST',
    title: 'Guidance Requested',
    body: 'Tobi requested parent help with "A kind choice at lunch" decision lab.',
    priority: 'high',
    payload: { childId: 2, childName: 'Tobi' },
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
    readAt: null,
  },
  {
    id: 'pn-2',
    type: 'PARENT_CHILD_ACHIEVEMENT',
    title: 'Quiz Finished · 92%',
    body: 'Amara finished the weekly Bible quiz on Parables of Jesus with a great score of 92%!',
    priority: 'normal',
    payload: { childId: 1, childName: 'Amara', score: 92 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    readAt: null,
  },
  {
    id: 'pn-3',
    type: 'PARENT_MEMORY_VERSE_COMPLETED',
    title: 'Memory Verse Mastered',
    body: 'Amara completed the Ephesians 2:8-10 memory verse practice challenge.',
    priority: 'normal',
    payload: { childId: 1, childName: 'Amara' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'pn-4',
    type: 'PARENT_ASSIGNMENT_GIVEN',
    title: 'New Class Assignment',
    body: 'Teacher Sarah assigned "David and Goliath: Courage Under Fire" due this Friday.',
    priority: 'normal',
    payload: { childId: 1, childName: 'Amara' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // yesterday
    readAt: null,
  },
  {
    id: 'pn-5',
    type: 'PARENT_TEACHER_ANNOUNCEMENT',
    title: 'Class Announcement',
    body: 'Wednesday Explorers: Remember to bring your favourite snack for the verse celebration!',
    priority: 'normal',
    payload: { classroomName: 'Wednesday Explorers' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
];

export default function ParentNotificationBell({
  onNavigate,
}: {
  onNavigate: (dest: { page: 'overview' | 'children' | 'assignments' | 'teachers' | 'messages' | 'settings'; childId?: number | string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'help'>('all');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lanternLionParentNotifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(INITIAL_PARENT_NOTIFICATIONS);
        localStorage.setItem('lanternLionParentNotifications', JSON.stringify(INITIAL_PARENT_NOTIFICATIONS));
      }
    } catch {
      setNotifications(INITIAL_PARENT_NOTIFICATIONS);
    }
  }, []);

  function saveNotifications(next: ParentNotification[]) {
    setNotifications(next);
    try {
      localStorage.setItem('lanternLionParentNotifications', JSON.stringify(next));
    } catch {}
  }

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const highPriorityCount = notifications.filter((n) => !n.readAt && n.priority === 'high').length;

  function markAllRead() {
    const updated = notifications.map((n) => ({
      ...n,
      readAt: n.readAt || new Date().toISOString(),
    }));
    saveNotifications(updated);
  }

  function toggleItemRead(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, readAt: n.readAt ? null : new Date().toISOString() } : n
    );
    saveNotifications(updated);
  }

  function handleItemClick(n: ParentNotification) {
    if (!n.readAt) {
      const updated = notifications.map((item) =>
        item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item
      );
      saveNotifications(updated);
    }
    setOpen(false);
    const dest = parentNotificationDestination(n);
    if (dest) {
      onNavigate(dest);
    }
  }

  const filteredItems = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.readAt;
    if (activeFilter === 'help') return n.priority === 'high' || n.type === 'PARENT_HELP_REQUEST';
    return true;
  });

  return (
    <div className="parent-notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`parent-notif-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={`parent-notif-badge ${highPriorityCount > 0 ? 'high-priority' : ''}`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="parent-notif-dropdown" role="dialog" aria-label="Notifications menu">
          <div className="parent-notif-head">
            <div className="parent-notif-head-title">
              <strong>Notifications</strong>
              {unreadCount > 0 && <span className="parent-notif-count-chip">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="parent-notif-mark-all">
                Mark all read
              </button>
            )}
          </div>

          <div className="parent-notif-tabs">
            <button
              type="button"
              className={activeFilter === 'all' ? 'active' : ''}
              onClick={() => setActiveFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={activeFilter === 'unread' ? 'active' : ''}
              onClick={() => setActiveFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              className={activeFilter === 'help' ? 'active' : ''}
              onClick={() => setActiveFilter('help')}
            >
              Needs Help
            </button>
          </div>

          <div className="parent-notif-list">
            {filteredItems.length === 0 ? (
              <div className="parent-notif-empty">
                <span>🎉</span>
                <p>All caught up! No notifications in this tab.</p>
              </div>
            ) : (
              filteredItems.map((n) => {
                const icon = PARENT_NOTIFICATION_ICON[n.type] || '🔔';
                const dest = parentNotificationDestination(n);
                const isUnread = !n.readAt;
                const childName = (n.payload?.childName as string | undefined);

                return (
                  <article
                    key={n.id}
                    className={`parent-notif-item ${isUnread ? 'unread' : ''} ${n.priority === 'high' ? 'priority-high' : ''}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="parent-notif-icon-col">
                      <span className="parent-notif-type-icon">{icon}</span>
                    </div>
                    <div className="parent-notif-content-col">
                      <div className="parent-notif-item-top">
                        <strong>{n.title}</strong>
                        <span className="parent-notif-time">{relativeTime(n.createdAt)}</span>
                      </div>
                      <p>{n.body}</p>
                      <div className="parent-notif-item-foot">
                        {childName && <span className="parent-notif-child-tag">Child: {childName}</span>}
                        {dest?.actionLabel && (
                          <span className="parent-notif-action-link">{dest.actionLabel} →</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="parent-notif-read-toggle"
                      onClick={(e) => toggleItemRead(e, n.id)}
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                      aria-label={isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <span className={`read-dot ${isUnread ? 'unread' : 'read'}`} />
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
