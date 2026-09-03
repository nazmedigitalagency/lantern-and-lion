'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ClassroomCard, ClassroomsListResponse } from '../lib/classrooms/types';
import type { CalendarItem, CalendarItemType } from '../api/teacher/calendar/route';
import { formatDateKey, getTodayDateKey } from '../lib/date';
import CreateEventModal from './CreateEventModal';
import CreateAnnouncementModal from './CreateAnnouncementModal';

const TYPE_CONFIG: Record<CalendarItemType, { label: string; icon: string; badgeClass: string }> = {
  assignment: { label: 'Assignment', icon: '📝', badgeClass: 'cal-badge-assignment' },
  challenge: { label: 'Challenge', icon: '🏆', badgeClass: 'cal-badge-challenge' },
  event: { label: 'Event', icon: '📅', badgeClass: 'cal-badge-event' },
  announcement: { label: 'Announcement', icon: '📣', badgeClass: 'cal-badge-announcement' },
};

export default function CalendarPanel({
  onNavigateToAssignments,
  onNavigateToChallenges,
}: {
  onNavigateToAssignments?: (assignmentId?: string) => void;
  onNavigateToChallenges?: (challengeId?: string) => void;
}) {
  const [classrooms, setClassrooms] = useState<ClassroomCard[]>([]);
  const [classroomId, setClassroomId] = useState('');
  const [items, setItems] = useState<CalendarItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  // Month navigation state
  const [viewDate, setViewDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | CalendarItemType>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getTodayDateKey());

  // Modals
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  // Load classrooms
  useEffect(() => {
    fetch('/api/classrooms/list')
      .then((res) => (res.ok ? (res.json() as Promise<ClassroomsListResponse>) : null))
      .then((data) => {
        if (data) setClassrooms(data.classrooms);
      })
      .catch(() => {});
  }, []);

  // Load calendar items
  useEffect(() => {
    let active = true;
    const qs = classroomId ? `?classroomId=${classroomId}` : '';
    fetch(`/api/teacher/calendar${qs}`)
      .then((res) => (res.ok ? res.json() as Promise<{ items: CalendarItem[] }> : Promise.reject()))
      .then((data) => {
        if (active) {
          setItems(data.items);
          setLoading(false);
          setError('');
        }
      })
      .catch(() => {
        if (active) {
          setError('Could not load calendar data — check your connection.');
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [classroomId, reloadToken]);

  function reload() {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }

  // Delete event action
  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to remove this classroom event?')) return;
    try {
      const res = await fetch(`/api/teacher/events/${eventId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast('Event removed.');
        reload();
      }
    } catch {
      alert('Could not delete event.');
    }
  }

  // Month math
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    const today = new Date();
    setViewDate(today);
    setSelectedDateKey(getTodayDateKey());
  }

  // Grid computation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateKey: string; dayNum: number; currentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({ dateKey: formatDateKey(d), dayNum, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ dateKey: formatDateKey(d), dayNum: i, currentMonth: true });
    }

    // Next month padding (up to 42 cells total for 6 full rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ dateKey: formatDateKey(d), dayNum: i, currentMonth: false });
    }

    return days;
  }, [year, month]);

  // Group items by dateKey
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items || []) {
      if (typeFilter !== 'all' && it.type !== typeFilter) continue;
      const existing = map.get(it.date) || [];
      existing.push(it);
      map.set(it.date, existing);
    }
    return map;
  }, [items, typeFilter]);

  // Selected date's items
  const selectedItems = useMemo(() => {
    return (items || []).filter((it) => it.date === selectedDateKey);
  }, [items, selectedDateKey]);

  // Upcoming items for Agenda view (today onwards)
  const todayKey = getTodayDateKey();
  const upcomingItems = useMemo(() => {
    return (items || [])
      .filter((it) => it.date >= todayKey)
      .filter((it) => typeFilter === 'all' || it.type === typeFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items, todayKey, typeFilter]);

  return (
    <div className="teacher-calendar-container">
      {toast && (
        <div className="teacher-toast" role="status">
          <span>✨</span>
          <p>{toast}</p>
          <button type="button" onClick={() => setToast('')}>Dismiss</button>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="teacher-calendar-toolbar">
        <div className="cal-toolbar-left">
          {classrooms.length > 1 && (
            <label className="gradebook-classroom-select">
              Classroom
              <select value={classroomId} onChange={(e) => { setLoading(true); setClassroomId(e.target.value); }}>
                <option value="">All classes</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="student-activity-filters">
            <button
              type="button"
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month View
            </button>
            <button
              type="button"
              className={viewMode === 'agenda' ? 'active' : ''}
              onClick={() => setViewMode('agenda')}
            >
              Upcoming Agenda
            </button>
          </div>
        </div>

        <div className="cal-toolbar-right">
          <button
            type="button"
            className="button button-primary cal-add-event-btn"
            disabled={classrooms.length === 0}
            onClick={() => setEventModalOpen(true)}
          >
            + Schedule Event
          </button>
          <button
            type="button"
            className="button button-secondary cal-add-announcement-btn"
            disabled={classrooms.length === 0}
            onClick={() => setAnnouncementModalOpen(true)}
          >
            📣 Announcement
          </button>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="cal-type-filters">
        <button
          type="button"
          className={`cal-type-pill ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          All Items
        </button>
        <button
          type="button"
          className={`cal-type-pill pill-assignment ${typeFilter === 'assignment' ? 'active' : ''}`}
          onClick={() => setTypeFilter('assignment')}
        >
          📝 Assignments
        </button>
        <button
          type="button"
          className={`cal-type-pill pill-event ${typeFilter === 'event' ? 'active' : ''}`}
          onClick={() => setTypeFilter('event')}
        >
          📅 Events
        </button>
        <button
          type="button"
          className={`cal-type-pill pill-challenge ${typeFilter === 'challenge' ? 'active' : ''}`}
          onClick={() => setTypeFilter('challenge')}
        >
          🏆 Challenges
        </button>
        <button
          type="button"
          className={`cal-type-pill pill-announcement ${typeFilter === 'announcement' ? 'active' : ''}`}
          onClick={() => setTypeFilter('announcement')}
        >
          📣 Announcements
        </button>
      </div>

      {loading && <p className="student-detail-empty">Loading calendar schedule…</p>}
      {error && <p className="student-detail-empty">{error}</p>}

      {!loading && !error && viewMode === 'month' && (
        <div className="cal-month-layout">
          {/* Calendar Grid */}
          <div className="cal-grid-card">
            <div className="cal-month-header">
              <div className="cal-month-nav">
                <button type="button" className="cal-nav-arrow" onClick={prevMonth} aria-label="Previous month">‹</button>
                <h2>{monthLabel}</h2>
                <button type="button" className="cal-nav-arrow" onClick={nextMonth} aria-label="Next month">›</button>
              </div>
              <button type="button" className="cal-today-btn" onClick={goToToday}>Today</button>
            </div>

            <div className="cal-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="cal-col-header">{d}</div>
              ))}

              {calendarDays.map((cd) => {
                const isToday = cd.dateKey === todayKey;
                const isSelected = cd.dateKey === selectedDateKey;
                const dayItems = itemsByDate.get(cd.dateKey) || [];

                return (
                  <button
                    key={cd.dateKey}
                    type="button"
                    className={`cal-cell ${cd.currentMonth ? '' : 'other-month'} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedDateKey(cd.dateKey)}
                  >
                    <span className="cal-cell-day">{cd.dayNum}</span>
                    <div className="cal-cell-badges">
                      {dayItems.slice(0, 3).map((it) => (
                        <span
                          key={it.id}
                          className={`cal-mini-badge ${TYPE_CONFIG[it.type].badgeClass}`}
                          title={`${it.title} (${it.classroomName})`}
                        >
                          <i aria-hidden="true">{TYPE_CONFIG[it.type].icon}</i>
                          <span>{it.title}</span>
                        </span>
                      ))}
                      {dayItems.length > 3 && (
                        <span className="cal-more-badge">+{dayItems.length - 3} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Agenda Sidebar */}
          <div className="cal-day-detail-panel">
            <div className="cal-day-detail-head">
              <div>
                <span className="teacher-kicker">Schedule for</span>
                <h3>
                  {new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
              </div>
              {selectedDateKey === todayKey && <span className="cal-today-tag">Today</span>}
            </div>

            {selectedItems.length === 0 ? (
              <div className="cal-day-empty">
                <span aria-hidden="true">🕊️</span>
                <p>No deadlines or events scheduled for this date.</p>
                <button
                  type="button"
                  className="cal-inline-schedule-btn"
                  onClick={() => setEventModalOpen(true)}
                >
                  + Add an Event
                </button>
              </div>
            ) : (
              <div className="cal-day-item-list">
                {selectedItems.map((it) => {
                  const cfg = TYPE_CONFIG[it.type];
                  return (
                    <article key={it.id} className={`cal-detail-card ${cfg.badgeClass}`}>
                      <div className="cal-detail-top">
                        <span className="cal-detail-icon">{cfg.icon}</span>
                        <div className="cal-detail-title-col">
                          <strong>{it.title}</strong>
                          <small>{it.classroomName} · {it.subtitle}{it.time ? ` at ${it.time}` : ''}</small>
                        </div>
                      </div>

                      {it.meta?.description ? (
                        <p className="cal-detail-desc">{it.meta.description as string}</p>
                      ) : null}

                      {it.meta?.message ? (
                        <p className="cal-detail-desc">{it.meta.message as string}</p>
                      ) : null}

                      <div className="cal-detail-actions">
                        {it.type === 'assignment' && onNavigateToAssignments && (
                          <button
                            type="button"
                            className="cal-link-action"
                            onClick={() => onNavigateToAssignments(it.meta?.assignmentId as string)}
                          >
                            Open Assignment →
                          </button>
                        )}
                        {it.type === 'challenge' && onNavigateToChallenges && (
                          <button
                            type="button"
                            className="cal-link-action"
                            onClick={() => onNavigateToChallenges(it.meta?.challengeId as string)}
                          >
                            View Challenge →
                          </button>
                        )}
                        {it.type === 'event' && Boolean(it.meta?.eventId) && (
                          <button
                            type="button"
                            className="cal-del-action"
                            onClick={() => handleDeleteEvent(it.meta?.eventId as string)}
                          >
                            Delete Event
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Agenda View */}
      {!loading && !error && viewMode === 'agenda' && (
        <div className="cal-agenda-layout">
          {upcomingItems.length === 0 ? (
            <div className="teacher-empty teacher-empty-students">
              <span>📅</span>
              <div>
                <strong>No upcoming calendar items</strong>
                <p>Schedule Sunday School, Bible Studies, or create assignments to populate your upcoming schedule.</p>
              </div>
            </div>
          ) : (
            <div className="cal-agenda-timeline">
              {upcomingItems.map((it) => {
                const cfg = TYPE_CONFIG[it.type];
                const dateObj = new Date(`${it.date}T00:00:00`);
                const dateHeader = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <article key={it.id} className={`cal-agenda-card ${cfg.badgeClass}`}>
                    <div className="cal-agenda-date-badge">
                      <strong>{dateObj.getDate()}</strong>
                      <span>{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>

                    <div className="cal-agenda-body">
                      <div className="cal-agenda-heading">
                        <span className="cal-agenda-icon">{cfg.icon}</span>
                        <div>
                          <h4>{it.title}</h4>
                          <small>{dateHeader} · {it.classroomName} · {it.subtitle}{it.time ? ` at ${it.time}` : ''}</small>
                        </div>
                      </div>

                      {it.meta?.description ? (
                        <p className="cal-detail-desc">{it.meta.description as string}</p>
                      ) : null}

                      {it.meta?.message ? (
                        <p className="cal-detail-desc">{it.meta.message as string}</p>
                      ) : null}
                    </div>

                    <div className="cal-agenda-actions">
                      {it.type === 'assignment' && onNavigateToAssignments && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => onNavigateToAssignments(it.meta?.assignmentId as string)}
                        >
                          View Assignment
                        </button>
                      )}
                      {it.type === 'challenge' && onNavigateToChallenges && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => onNavigateToChallenges(it.meta?.challengeId as string)}
                        >
                          View Challenge
                        </button>
                      )}
                      {it.type === 'event' && Boolean(it.meta?.eventId) && (
                        <button
                          type="button"
                          className="cal-del-action"
                          onClick={() => handleDeleteEvent(it.meta?.eventId as string)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {eventModalOpen && (
        <CreateEventModal
          classrooms={classrooms}
          initialClassroomId={classroomId}
          initialDate={selectedDateKey}
          onClose={() => setEventModalOpen(false)}
          onCreated={() => {
            setToast('Classroom event scheduled!');
            reload();
          }}
        />
      )}

      {/* Create Announcement Modal */}
      {announcementModalOpen && (
        <CreateAnnouncementModal
          classrooms={classrooms}
          initialClassroomId={classroomId}
          onClose={() => setAnnouncementModalOpen(false)}
          onCreated={(count) => {
            setToast(`Announcement posted to ${count ?? 'all'} student${count === 1 ? '' : 's'}!`);
            reload();
          }}
        />
      )}
    </div>
  );
}
