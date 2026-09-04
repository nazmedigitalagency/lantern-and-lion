'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ClassroomCard, ClassroomsListResponse } from '../lib/classrooms/types';
import type { CalendarItem, CalendarItemType } from '../api/teacher/calendar/route';
import { formatDateKey, getTodayDateKey } from '../lib/date';
import CreateEventModal from './CreateEventModal';
import CreateAnnouncementModal from './CreateAnnouncementModal';

import { TYPE_CONFIG } from '../lib/calendar/config';
export { TYPE_CONFIG };

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

  // View mode and filter state
  const [viewDate, setViewDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | CalendarItemType>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getTodayDateKey());

  // Modals & detail selection
  const [activeDetailItem, setActiveDetailItem] = useState<CalendarItem | null>(null);
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
      .then((res) => (res.ok ? (res.json() as Promise<{ items: CalendarItem[] }>) : Promise.reject()))
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
    return () => {
      active = false;
    };
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
        setActiveDetailItem(null);
        reload();
      }
    } catch {
      alert('Could not delete event.');
    }
  }

  // Month navigation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  // Week navigation
  function prevWeek() {
    const d = new Date(viewDate);
    d.setDate(d.getDate() - 7);
    setViewDate(d);
  }

  function nextWeek() {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + 7);
    setViewDate(d);
  }

  function goToToday() {
    const today = new Date();
    setViewDate(today);
    setSelectedDateKey(getTodayDateKey());
  }

  // 1. Month grid computation (42 cells: 6 weeks)
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

    // Next month padding (up to 42 cells total)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ dateKey: formatDateKey(d), dayNum: i, currentMonth: false });
    }

    return days;
  }, [year, month]);

  // 2. Week computation (Sunday through Saturday for current viewDate)
  const weekDays = useMemo(() => {
    const d = new Date(viewDate);
    const dayOfWeek = d.getDay(); // 0 = Sun
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);

    const days: { date: Date; dateKey: string; dayName: string; dayNum: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      days.push({
        date: current,
        dateKey: formatDateKey(current),
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: current.getDate(),
      });
    }
    return days;
  }, [viewDate]);

  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `Week of ${startStr} – ${endStr}`;
  }, [weekDays]);

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
    return (items || [])
      .filter((it) => it.date === selectedDateKey)
      .filter((it) => typeFilter === 'all' || it.type === typeFilter);
  }, [items, selectedDateKey, typeFilter]);

  // Upcoming items for Agenda view (today onwards, grouped logically)
  const todayKey = getTodayDateKey();
  const upcomingItems = useMemo(() => {
    return (items || [])
      .filter((it) => it.date >= todayKey)
      .filter((it) => typeFilter === 'all' || it.type === typeFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items, todayKey, typeFilter]);

  // Group upcoming items into friendly buckets
  const upcomingBuckets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

    const buckets: { label: string; items: CalendarItem[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Tomorrow', items: [] },
      { label: 'Later This Week', items: [] },
      { label: 'Next Week & Beyond', items: [] },
    ];

    for (const item of upcomingItems) {
      const itemDate = new Date(`${item.date}T00:00:00`);
      if (item.date === todayKey) {
        buckets[0].items.push(item);
      } else if (item.date === formatDateKey(tomorrow)) {
        buckets[1].items.push(item);
      } else if (itemDate <= endOfWeek) {
        buckets[2].items.push(item);
      } else {
        buckets[3].items.push(item);
      }
    }

    return buckets.filter((b) => b.items.length > 0);
  }, [upcomingItems, todayKey]);

  return (
    <div className="teacher-calendar-container">
      {toast && (
        <div className="teacher-toast" role="status">
          <span>✨</span>
          <p>{toast}</p>
          <button type="button" onClick={() => setToast('')}>
            Dismiss
          </button>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="teacher-calendar-toolbar">
        <div className="cal-toolbar-left">
          {classrooms.length > 1 && (
            <label className="gradebook-classroom-select">
              Classroom
              <select
                value={classroomId}
                onChange={(e) => {
                  setLoading(true);
                  setClassroomId(e.target.value);
                }}
              >
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
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week View
            </button>
            <button
              type="button"
              className={viewMode === 'agenda' ? 'active' : ''}
              onClick={() => setViewMode('agenda')}
            >
              Upcoming
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
          📖 Assignments
        </button>
        <button
          type="button"
          className={`cal-type-pill pill-memory ${typeFilter === 'scripture_memory' ? 'active' : ''}`}
          onClick={() => setTypeFilter('scripture_memory')}
        >
          🧠 Scripture Memory
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
          className={`cal-type-pill pill-adventure ${typeFilter === 'bible_adventure' ? 'active' : ''}`}
          onClick={() => setTypeFilter('bible_adventure')}
        >
          📚 Bible Adventure
        </button>
        <button
          type="button"
          className={`cal-type-pill pill-event ${typeFilter === 'event' ? 'active' : ''}`}
          onClick={() => setTypeFilter('event')}
        >
          🎉 Events
        </button>
        <button
          type="button"
          className={`cal-type-pill pill-announcement ${typeFilter === 'announcement' ? 'active' : ''}`}
          onClick={() => setTypeFilter('announcement')}
        >
          📣 Announcements
        </button>
      </div>

      {loading && <p className="student-detail-empty">Loading classroom calendar…</p>}
      {error && <p className="student-detail-empty">{error}</p>}

      {/* ── 1. MONTH VIEW ── */}
      {!loading && !error && viewMode === 'month' && (
        <div className="cal-month-layout">
          {/* Calendar Grid Card */}
          <div className="cal-grid-card">
            <div className="cal-month-header">
              <div className="cal-month-nav">
                <button type="button" className="cal-nav-arrow" onClick={prevMonth} aria-label="Previous month">
                  ‹
                </button>
                <h2>{monthLabel}</h2>
                <button type="button" className="cal-nav-arrow" onClick={nextMonth} aria-label="Next month">
                  ›
                </button>
              </div>
              <button type="button" className="cal-today-btn" onClick={goToToday}>
                Today
              </button>
            </div>

            <div className="cal-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="cal-col-header">
                  {d}
                </div>
              ))}

              {calendarDays.map((cd) => {
                const isToday = cd.dateKey === todayKey;
                const isSelected = cd.dateKey === selectedDateKey;
                const dayItems = itemsByDate.get(cd.dateKey) || [];

                return (
                  <button
                    key={cd.dateKey}
                    type="button"
                    className={`cal-cell ${cd.currentMonth ? '' : 'other-month'} ${isToday ? 'is-today' : ''} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    onClick={() => setSelectedDateKey(cd.dateKey)}
                  >
                    <span className="cal-cell-day">{cd.dayNum}</span>
                    <div className="cal-cell-badges">
                      {dayItems.slice(0, 3).map((it) => {
                        const cfg = TYPE_CONFIG[it.type] || TYPE_CONFIG.event;
                        return (
                          <span
                            key={it.id}
                            className={`cal-mini-badge ${cfg.badgeClass}`}
                            title={`${it.title} (${it.classroomName})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailItem(it);
                            }}
                          >
                            <i aria-hidden="true">{cfg.icon}</i>
                            <span>{it.title}</span>
                          </span>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <span className="cal-more-badge">+{dayItems.length - 3} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Sidebar */}
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
                  const cfg = TYPE_CONFIG[it.type] || TYPE_CONFIG.event;
                  return (
                    <article
                      key={it.id}
                      className={`cal-detail-card ${cfg.badgeClass}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveDetailItem(it)}
                    >
                      <div className="cal-detail-top">
                        <span className="cal-detail-icon">{cfg.icon}</span>
                        <div className="cal-detail-title-col">
                          <strong>{it.title}</strong>
                          <small>
                            {it.classroomName} · {it.subtitle}
                            {it.time ? ` at ${it.time}` : ''}
                          </small>
                        </div>
                      </div>

                      {it.status && (
                        <span
                          className={`cal-status-pill ${
                            it.incompleteCount && it.incompleteCount > 0
                              ? 'status-incomplete'
                              : it.completedCount && it.completedCount > 0
                              ? 'status-complete'
                              : 'status-active'
                          }`}
                        >
                          {it.status}
                        </span>
                      )}

                      {it.description ? <p className="cal-detail-desc">{it.description}</p> : null}

                      <div className="cal-detail-actions">
                        {(it.type === 'assignment' ||
                          it.type === 'scripture_memory' ||
                          it.type === 'bible_adventure') &&
                          onNavigateToAssignments && (
                            <button
                              type="button"
                              className="cal-link-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToAssignments(it.meta?.assignmentId as string);
                              }}
                            >
                              View Assignment →
                            </button>
                          )}
                        {it.type === 'challenge' && onNavigateToChallenges && (
                          <button
                            type="button"
                            className="cal-link-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToChallenges(it.meta?.challengeId as string);
                            }}
                          >
                            View Challenge →
                          </button>
                        )}
                        {it.type === 'event' && Boolean(it.meta?.eventId) && (
                          <button
                            type="button"
                            className="cal-del-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(it.meta?.eventId as string);
                            }}
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

      {/* ── 2. WEEK VIEW ── */}
      {!loading && !error && viewMode === 'week' && (
        <div className="cal-week-layout">
          <div className="cal-month-header">
            <div className="cal-month-nav">
              <button type="button" className="cal-nav-arrow" onClick={prevWeek} aria-label="Previous week">
                ‹
              </button>
              <h2>{weekRangeLabel}</h2>
              <button type="button" className="cal-nav-arrow" onClick={nextWeek} aria-label="Next week">
                ›
              </button>
            </div>
            <button type="button" className="cal-today-btn" onClick={goToToday}>
              Today
            </button>
          </div>

          <div className="cal-week-grid">
            {weekDays.map((wd) => {
              const isToday = wd.dateKey === todayKey;
              const dayItems = itemsByDate.get(wd.dateKey) || [];

              return (
                <div key={wd.dateKey} className={`cal-week-col ${isToday ? 'is-today' : ''}`}>
                  <div className="cal-week-col-header">
                    <span className="cal-week-col-dayname">{wd.dayName}</span>
                    <span className="cal-week-col-daynum">{wd.dayNum}</span>
                  </div>

                  <div className="cal-week-events-list">
                    {dayItems.length === 0 ? (
                      <div className="cal-week-empty">No events</div>
                    ) : (
                      dayItems.map((it) => {
                        const cfg = TYPE_CONFIG[it.type] || TYPE_CONFIG.event;
                        return (
                          <div
                            key={it.id}
                            className={`cal-week-event-card ${cfg.badgeClass}`}
                            onClick={() => setActiveDetailItem(it)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>{cfg.icon}</span>
                              <span className="cal-week-event-title">{it.title}</span>
                            </div>
                            <span className="cal-week-event-sub">
                              {it.classroomName}
                              {it.time ? ` · ${it.time}` : ''}
                            </span>
                            {it.status && (
                              <span
                                className={`cal-status-pill ${
                                  it.incompleteCount && it.incompleteCount > 0
                                    ? 'status-incomplete'
                                    : 'status-active'
                                }`}
                                style={{ fontSize: '10px', padding: '1px 5px' }}
                              >
                                {it.status}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. UPCOMING AGENDA VIEW ── */}
      {!loading && !error && viewMode === 'agenda' && (
        <div className="cal-agenda-layout">
          {upcomingBuckets.length === 0 ? (
            <div className="teacher-empty teacher-empty-students">
              <span>📅</span>
              <div>
                <strong>No upcoming calendar items</strong>
                <p>Deadlines, class challenges, and scheduled events will appear here in chronological order.</p>
              </div>
            </div>
          ) : (
            upcomingBuckets.map((bucket) => (
              <div key={bucket.label} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3
                  style={{
                    margin: '10px 0 2px',
                    font: '800 16px var(--font-fredoka)',
                    color: '#1E293B',
                  }}
                >
                  {bucket.label}
                </h3>

                <div className="cal-agenda-timeline">
                  {bucket.items.map((it) => {
                    const cfg = TYPE_CONFIG[it.type] || TYPE_CONFIG.event;
                    const dateObj = new Date(`${it.date}T00:00:00`);
                    const dateHeader = dateObj.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <article
                        key={it.id}
                        className={`cal-agenda-card ${cfg.badgeClass}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveDetailItem(it)}
                      >
                        <div className="cal-agenda-date-badge">
                          <strong>{dateObj.getDate()}</strong>
                          <span>{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                        </div>

                        <div className="cal-agenda-body">
                          <div className="cal-agenda-heading">
                            <span className="cal-agenda-icon">{cfg.icon}</span>
                            <div>
                              <h4>{it.title}</h4>
                              <small>
                                {dateHeader} · {it.classroomName} · {it.subtitle}
                                {it.time ? ` at ${it.time}` : ''}
                              </small>
                            </div>
                          </div>

                          {it.status && (
                            <div style={{ marginTop: '6px' }}>
                              <span
                                className={`cal-status-pill ${
                                  it.incompleteCount && it.incompleteCount > 0
                                    ? 'status-incomplete'
                                    : it.completedCount && it.completedCount > 0
                                    ? 'status-complete'
                                    : 'status-active'
                                }`}
                              >
                                {it.status}
                              </span>
                            </div>
                          )}

                          {it.description ? (
                            <p className="cal-detail-desc" style={{ marginTop: '6px' }}>
                              {it.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="cal-agenda-actions">
                          {(it.type === 'assignment' ||
                            it.type === 'scripture_memory' ||
                            it.type === 'bible_adventure') &&
                            onNavigateToAssignments && (
                              <button
                                type="button"
                                className="button button-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToAssignments(it.meta?.assignmentId as string);
                                }}
                              >
                                View Assignment
                              </button>
                            )}
                          {it.type === 'challenge' && onNavigateToChallenges && (
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToChallenges(it.meta?.challengeId as string);
                              }}
                            >
                              View Challenge
                            </button>
                          )}
                          {it.type === 'event' && Boolean(it.meta?.eventId) && (
                            <button
                              type="button"
                              className="cal-del-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(it.meta?.eventId as string);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── EVENT DETAILS MODAL ── */}
      {activeDetailItem && (
        <div
          className="teacher-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveDetailItem(null)}
        >
          <div
            className="teacher-modal-card cal-detail-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="teacher-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>
                  {TYPE_CONFIG[activeDetailItem.type]?.icon || '📅'}
                </span>
                <div>
                  <span className="teacher-kicker">Event Details</span>
                  <h3 style={{ margin: 0, font: '800 20px var(--font-fredoka)', color: '#1E293B' }}>
                    {activeDetailItem.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="cal-nav-arrow"
                onClick={() => setActiveDetailItem(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span
                  className={`cal-type-pill ${TYPE_CONFIG[activeDetailItem.type]?.pillClass || ''} active`}
                  style={{ pointerEvents: 'none' }}
                >
                  {TYPE_CONFIG[activeDetailItem.type]?.icon} {TYPE_CONFIG[activeDetailItem.type]?.label}
                </span>

                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    background: '#F1F5F9',
                    color: '#1E293B',
                    padding: '4px 10px',
                    borderRadius: '999px',
                  }}
                >
                  🏫 {activeDetailItem.classroomName}
                </span>

                {activeDetailItem.status && (
                  <span
                    className={`cal-status-pill ${
                      activeDetailItem.incompleteCount && activeDetailItem.incompleteCount > 0
                        ? 'status-incomplete'
                        : activeDetailItem.completedCount && activeDetailItem.completedCount > 0
                        ? 'status-complete'
                        : 'status-active'
                    }`}
                  >
                    {activeDetailItem.status}
                  </span>
                )}
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong style={{ color: '#64748B' }}>Date: </strong>
                  <span style={{ fontWeight: 800, color: '#1E293B' }}>
                    {new Date(`${activeDetailItem.date}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {activeDetailItem.endDate && activeDetailItem.endDate !== activeDetailItem.date && (
                  <div>
                    <strong style={{ color: '#64748B' }}>Deadline: </strong>
                    <span style={{ fontWeight: 800, color: '#1E293B' }}>
                      {new Date(`${activeDetailItem.endDate}T00:00:00`).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {activeDetailItem.time && (
                  <div>
                    <strong style={{ color: '#64748B' }}>Time: </strong>
                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{activeDetailItem.time}</span>
                  </div>
                )}

                {activeDetailItem.subtitle && (
                  <div>
                    <strong style={{ color: '#64748B' }}>Category: </strong>
                    <span style={{ color: '#1E293B' }}>{activeDetailItem.subtitle}</span>
                  </div>
                )}
              </div>

              {activeDetailItem.description && (
                <div>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                    Description / Instructions
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      background: '#FFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: '#334155',
                    }}
                  >
                    {activeDetailItem.description}
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '8px',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '14px',
              }}
            >
              {(activeDetailItem.type === 'assignment' ||
                activeDetailItem.type === 'scripture_memory' ||
                activeDetailItem.type === 'bible_adventure') &&
                onNavigateToAssignments && (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      const id = activeDetailItem.meta?.assignmentId as string;
                      setActiveDetailItem(null);
                      onNavigateToAssignments(id);
                    }}
                  >
                    View Assignment →
                  </button>
                )}

              {activeDetailItem.type === 'challenge' && onNavigateToChallenges && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    const id = activeDetailItem.meta?.challengeId as string;
                    setActiveDetailItem(null);
                    onNavigateToChallenges(id);
                  }}
                >
                  View Challenge →
                </button>
              )}

              {activeDetailItem.type === 'event' && Boolean(activeDetailItem.meta?.eventId) && (
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ color: '#DC2626', borderColor: '#FECACA' }}
                  onClick={() => handleDeleteEvent(activeDetailItem.meta?.eventId as string)}
                >
                  Delete Event
                </button>
              )}

              <button
                type="button"
                className="button button-secondary"
                onClick={() => setActiveDetailItem(null)}
              >
                Close
              </button>
            </div>
          </div>
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
