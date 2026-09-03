'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  groupByDay,
  relativeTime,
  TEACHER_NOTIFICATION_ICON,
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    fetch('/api/teacher/notifications')
      .then((res) => (res.ok ? (res.json() as Promise<{ notifications: TeacherNotification[]; unreadCount: number }>) : null))
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = notifications ? groupByDay(notifications as any) : [];

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

          <div className="teacher-notif-panel-body">
            {!notifications || groups.length === 0 ? (
              <div className="teacher-notif-empty">
                <span aria-hidden="true">📋</span>
                <strong>No notifications yet</strong>
                <p>You’ll see student submissions, grading reminders, upcoming deadlines, and classroom events here.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="teacher-notif-group">
                  <p className="teacher-notif-group-label">{group.label}</p>
                  {group.items.map((n: TeacherNotification) => {
                    const icon = TEACHER_NOTIFICATION_ICON[n.type] || '🔵';
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className={`teacher-notif-item ${n.readAt ? '' : 'unread'}`}
                        onClick={() => handleClick(n)}
                      >
                        <span className="teacher-notif-item-icon" aria-hidden="true">
                          {icon}
                        </span>
                        <span className="teacher-notif-item-body">
                          <span className="teacher-notif-item-title">{n.title}</span>
                          <span className="teacher-notif-item-text">{n.body}</span>
                          <span className="teacher-notif-item-time">{relativeTime(n.createdAt)}</span>
                        </span>
                        {!n.readAt && <span className="teacher-notif-item-dot" aria-hidden="true" />}
                      </button>
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
