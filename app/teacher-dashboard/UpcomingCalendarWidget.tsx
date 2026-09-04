'use client';

import { useEffect, useState } from 'react';
import type { CalendarItem } from '../api/teacher/calendar/route';
import { TYPE_CONFIG } from '../lib/calendar/config';
import { getTodayDateKey } from '../lib/date';

export default function UpcomingCalendarWidget({
  onViewCalendar,
  onNavigateToAssignments,
  onNavigateToChallenges,
}: {
  onViewCalendar: () => void;
  onNavigateToAssignments?: (assignmentId?: string) => void;
  onNavigateToChallenges?: (challengeId?: string) => void;
}) {
  const [items, setItems] = useState<CalendarItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/teacher/calendar')
      .then((res) => (res.ok ? (res.json() as Promise<{ items: CalendarItem[] }>) : null))
      .then((data) => {
        if (active && data) {
          const todayKey = getTodayDateKey();
          const upcoming = data.items
            .filter((it) => it.date >= todayKey)
            .slice(0, 4);
          setItems(upcoming);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function getRelativeDateLabel(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(`${dateStr}T00:00:00`);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="teacher-upcoming-widget">
        <div className="teacher-upcoming-header">
          <h3>
            <span>📅</span> Upcoming in your classrooms
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Loading upcoming schedule…</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="teacher-upcoming-widget">
        <div className="teacher-upcoming-header">
          <h3>
            <span>📅</span> Upcoming in your classrooms
          </h3>
          <button type="button" className="cal-link-action" onClick={onViewCalendar}>
            Open Calendar →
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
          No deadlines or events approaching this week.
        </p>
      </div>
    );
  }

  return (
    <div className="teacher-upcoming-widget">
      <div className="teacher-upcoming-header">
        <h3>
          <span>📅</span> Upcoming in your classrooms
        </h3>
        <button
          type="button"
          className="cal-link-action"
          onClick={onViewCalendar}
          style={{ background: '#FFF', borderColor: '#CBD5E1', color: '#1D4ED8' }}
        >
          View Calendar →
        </button>
      </div>

      <div className="teacher-upcoming-list">
        {items.map((it) => {
          const cfg = TYPE_CONFIG[it.type] || TYPE_CONFIG.event;
          const relDate = getRelativeDateLabel(it.date);

          return (
            <div
              key={it.id}
              className="teacher-upcoming-item"
              onClick={() => {
                if (
                  (it.type === 'assignment' || it.type === 'scripture_memory' || it.type === 'bible_adventure') &&
                  onNavigateToAssignments &&
                  it.meta?.assignmentId
                ) {
                  onNavigateToAssignments(it.meta.assignmentId as string);
                } else if (it.type === 'challenge' && onNavigateToChallenges && it.meta?.challengeId) {
                  onNavigateToChallenges(it.meta.challengeId as string);
                } else {
                  onViewCalendar();
                }
              }}
            >
              <div className="teacher-upcoming-item-left">
                <span className="teacher-upcoming-date-tag">{relDate}</span>
                <div className="teacher-upcoming-content">
                  <div className="teacher-upcoming-title">
                    <span style={{ marginRight: '6px' }}>{cfg.icon}</span>
                    {it.title}
                  </div>
                  <div className="teacher-upcoming-meta">
                    {it.classroomName} · {it.subtitle}
                    {it.time ? ` at ${it.time}` : ''}
                  </div>
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
                  style={{ flexShrink: 0 }}
                >
                  {it.status}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
