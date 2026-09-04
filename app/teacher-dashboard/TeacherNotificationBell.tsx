'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  groupByDay,
  relativeTime,
  TEACHER_NOTIFICATION_ICON,
  TEACHER_NOTIFICATION_DEFAULT_PRIORITY,
  teacherNotificationDestination,
  type TeacherDeepLink,
  type TeacherNotification,
} from '../lib/notifications/types';

export default function TeacherNotificationBell({
  onNavigate,
  onOpenPreferences,
}: {
  onNavigate: (dest: TeacherDeepLink) => void;
  onOpenPreferences: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<TeacherNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'high'>('all');
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    fetch('/api/teacher/notifications')
      .then((res) => (res.ok ? (res.json() as Promise<{ notifications: TeacherNotification[]; unreadCount: number; highPriorityCount?: number }>) : null))
      .then((data) => {
        if (!data) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setLoaded(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000); // Polling every 30 seconds
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if ((event as KeyboardEvent).key && (event as KeyboardEvent).key !== 'Escape') return;
      if (event.type === 'pointerdown' && (event.target as HTMLElement).closest('.teacher-notif-bell-wrap')) return;
      setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) load();
      return next;
    });
  }

  async function markAllRead() {
    setNotifications((current) => current?.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })) || current);
    setUnreadCount(0);
    await fetch('/api/teacher/notifications/mark-all-read', { method: 'POST' }).catch(() => {});
  }

  async function toggleReadItem(e: React.MouseEvent, n: TeacherNotification) {
    e.stopPropagation();
    const willBeRead = !n.readAt;
    setNotifications((current) =>
      current?.map((x) => (x.id === n.id ? { ...x, readAt: willBeRead ? new Date().toISOString() : null } : x)) || current
    );
    setUnreadCount((c) => (willBeRead ? Math.max(0, c - 1) : c + 1));
    await fetch('/api/teacher/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: n.id, read: willBeRead }),
    }).catch(() => {});
  }

  async function handleClick(n: TeacherNotification) {
    if (!n.readAt) {
      setNotifications((current) => current?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) || current);
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch('/api/teacher/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id, read: true }),
      }).catch(() => {});
    }
    setOpen(false);
    const dest = teacherNotificationDestination(n);
    if (dest) {
      onNavigate(dest);
    }
  }

  const items = notifications || [];
  const highPriorityCount = items.filter((n) => {
    const p = n.priority || (n.payload?.priority as string) || TEACHER_NOTIFICATION_DEFAULT_PRIORITY[n.type] || 'normal';
    return p === 'high' && !n.readAt;
  }).length;

  const filteredItems = items.filter((n) => {
    const p = n.priority || (n.payload?.priority as string) || TEACHER_NOTIFICATION_DEFAULT_PRIORITY[n.type] || 'normal';
    if (activeFilter === 'unread') return !n.readAt;
    if (activeFilter === 'high') return p === 'high';
    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = groupByDay(filteredItems as any);

  return (
    <div className="teacher-notif-bell-wrap" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="teacher-notif-bell-btn"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Teacher Notifications, ${unreadCount} unread` : 'Teacher Notifications'}
        title="Teacher Notifications"
      >
        <span aria-hidden="true">🔔</span>
        {loaded && unreadCount > 0 && (
          <span className="teacher-notif-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="teacher-notif-panel" role="dialog" aria-label="Teacher Notifications">
          <div className="teacher-notif-panel-head">
            <div>
              <strong>Notifications</strong>
              <small>{unreadCount > 0 ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}</small>
            </div>
            <div className="teacher-notif-head-actions">
              {unreadCount > 0 && (
                <button type="button" className="teacher-notif-mark-all" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
              <button
                type="button"
                className="teacher-notif-settings-btn"
                onClick={() => {
                  setOpen(false);
                  onOpenPreferences();
                }}
                title="Notification Preferences"
                aria-label="Notification Preferences"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="teacher-notif-tabs" role="tablist" aria-label="Filter notifications">
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'all'}
              className={`teacher-notif-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All {items.length > 0 && `(${items.length})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'unread'}
              className={`teacher-notif-tab ${activeFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveFilter('unread')}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'high'}
              className={`teacher-notif-tab ${activeFilter === 'high' ? 'active' : ''}`}
              onClick={() => setActiveFilter('high')}
            >
              High Priority {highPriorityCount > 0 && `(${highPriorityCount})`}
            </button>
          </div>

          <div className="teacher-notif-panel-body">
            {!notifications || groups.length === 0 ? (
              <div className="teacher-notif-empty">
                <span aria-hidden="true">📋</span>
                <strong>{activeFilter === 'all' ? 'No notifications yet' : 'No notifications in this filter'}</strong>
                <p>
                  {activeFilter === 'all'
                    ? 'You’ll see student submissions, grading reminders, upcoming deadlines, and classroom events here.'
                    : 'Switch back to "All" to view your historical alerts.'}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="teacher-notif-group">
                  <p className="teacher-notif-group-label">{group.label}</p>
                  {group.items.map((n: TeacherNotification) => {
                    const icon = TEACHER_NOTIFICATION_ICON[n.type] || '🔵';
                    const priority = n.priority || (n.payload?.priority as string) || TEACHER_NOTIFICATION_DEFAULT_PRIORITY[n.type] || 'normal';
                    const dest = teacherNotificationDestination(n);
                    const className = (n.payload?.className as string) || null;

                    return (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        className={`teacher-notif-item ${n.readAt ? 'read' : 'unread'} priority-${priority}`}
                        onClick={() => handleClick(n)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick(n);
                          }
                        }}
                      >
                        <span className="teacher-notif-item-icon" aria-hidden="true">
                          {icon}
                        </span>
                        <span className="teacher-notif-item-body">
                          <span className="teacher-notif-item-top">
                            <span className="teacher-notif-item-title">{n.title}</span>
                            {priority === 'high' && <span className="teacher-notif-priority-pill high">HIGH</span>}
                            {priority === 'low' && <span className="teacher-notif-priority-pill low">INFO</span>}
                          </span>
                          <span className="teacher-notif-item-text">{n.body}</span>
                          <span className="teacher-notif-item-meta">
                            <span className="teacher-notif-item-time">{relativeTime(n.createdAt)}</span>
                            {className && <span className="teacher-notif-class-tag">{className}</span>}
                          </span>
                          {dest?.actionLabel && (
                            <span className="teacher-notif-action-btn">
                              {dest.actionLabel} →
                            </span>
                          )}
                        </span>
                        <div className="teacher-notif-item-controls">
                          {!n.readAt && <span className="teacher-notif-item-dot" aria-label="Unread notification" />}
                          <button
                            type="button"
                            className="teacher-notif-toggle-btn"
                            title={n.readAt ? 'Mark as unread' : 'Mark as read'}
                            aria-label={n.readAt ? 'Mark as unread' : 'Mark as read'}
                            onClick={(e) => toggleReadItem(e, n)}
                          >
                            {n.readAt ? '○' : '✓'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
