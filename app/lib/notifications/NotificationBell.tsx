'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  groupByDay,
  NOTIFICATION_ICON,
  NOTIFICATION_PRIORITY,
  notificationDestination,
  relativeTime,
  type ChildNotification,
} from './types';
import { AnnouncementDetailModal, type AnnouncementData } from './AnnouncementDetailModal';

const EMPTY_TITLE = "You're all caught up!";
const EMPTY_BODY = "You'll see new assignments, teacher updates, game invites, and achievements here.";

export function NotificationBell({
  tone,
  dashboardHref,
}: {
  tone: 'child' | 'teen';
  /** e.g. '/child-dashboard' or '/teen-dashboard' — deep links append `?tab=...`. */
  dashboardHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ChildNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementData | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    fetch('/api/child/notifications')
      .then((res) => (res.ok ? (res.json() as Promise<{ notifications: ChildNotification[]; unreadCount: number }>) : null))
      .then((data) => {
        if (!data) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setLoaded(true);
      })
      .catch(() => {});
  }, []);

  // Loads once the bell first mounts, and again whenever the dropdown is
  // opened, so a badge earned mid-session shows up without a full refresh —
  // opening does NOT itself mark anything read (only clicking an item does).
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if ((event as KeyboardEvent).key && (event as KeyboardEvent).key !== 'Escape') return;
      if (event.type === 'pointerdown' && (event.target as HTMLElement).closest('.notif-bell-wrap')) return;
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
    await fetch('/api/child/notifications/mark-all-read', { method: 'POST' }).catch(() => {});
  }

  async function handleClick(n: ChildNotification) {
    if (!n.readAt) {
      setNotifications((current) => current?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) || current);
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch('/api/child/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id, read: true }),
      }).catch(() => {});
    }
    setOpen(false);

    if (n.type === 'TEACHER_ANNOUNCEMENT') {
      setSelectedAnnouncement({
        title: (n.payload?.title as string) || n.title,
        message: (n.payload?.message as string) || n.body,
        classroomName: n.payload?.classroomName as string | undefined,
        teacherName: n.payload?.teacherName as string | undefined,
        eventDate: n.payload?.eventDate as string | undefined,
        createdAt: n.createdAt,
      });
      return;
    }

    const dest = notificationDestination(n);
    if (dest) {
      const params = new URLSearchParams({ tab: dest.tab });
      if (dest.focusId) params.set('assignmentId', dest.focusId);
      // A full navigation (not router.push): the dashboard only reads
      // ?tab=/?assignmentId= once, on mount, so a client-side nav to the
      // already-mounted page wouldn't re-run that logic.
      window.location.assign(`${dashboardHref}?${params.toString()}`);
    }
  }

  const groups = notifications ? groupByDay(notifications) : [];

  return (
    <>
      <div className={`notif-bell-wrap notif-bell-${tone}`} ref={wrapRef}>
        <button
          ref={triggerRef}
          type="button"
          className="notif-bell-btn"
          onClick={toggleOpen}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <span aria-hidden="true">🔔</span>
          {loaded && unreadCount > 0 && <span className="notif-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>

        {open && (
          <div className="notif-panel" role="dialog" aria-label="Notifications">
            <div className="notif-panel-head">
              <strong>Notifications</strong>
              {unreadCount > 0 && (
                <button type="button" className="notif-mark-all" onClick={markAllRead}>
                  Mark all as read
                </button>
              )}
            </div>

            <div className="notif-panel-body">
              {!notifications || groups.length === 0 ? (
                <div className="notif-empty">
                  <span aria-hidden="true">🎉</span>
                  <strong>{EMPTY_TITLE}</strong>
                  <p>{EMPTY_BODY}</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.label} className="notif-group">
                    <p className="notif-group-label">{group.label}</p>
                    {group.items.map((n) => {
                      const priority = NOTIFICATION_PRIORITY[n.type as keyof typeof NOTIFICATION_PRIORITY] || 'normal';
                      return (
                        <button
                          key={n.id}
                          type="button"
                          className={`notif-item priority-${priority} ${n.readAt ? '' : 'unread'}`}
                          onClick={() => handleClick(n)}
                        >
                          <span className="notif-item-icon" aria-hidden="true">
                            {NOTIFICATION_ICON[n.type as keyof typeof NOTIFICATION_ICON] || '🔵'}
                          </span>
                          <span className="notif-item-body">
                            <span className="notif-item-title">{n.title}</span>
                            <span className="notif-item-text">{n.body}</span>
                            <span className="notif-item-time">{relativeTime(n.createdAt)}</span>
                          </span>
                          {!n.readAt && <span className="notif-item-dot" aria-hidden="true" />}
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

      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          tone={tone}
        />
      )}
    </>
  );
}
