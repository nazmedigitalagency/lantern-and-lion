'use client';

import { useEffect, useState } from 'react';
import type { ProgressTrend, StudentTimelineResponse, TimelineEvent, TimelineRange } from '../lib/timeline/types';
import type { SuggestedAssignment } from '../lib/insights/types';
import CreateAssignmentModal, { type AssignmentTemplatePrefill } from './CreateAssignmentModal';

const RANGE_OPTIONS: { value: TimelineRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
];

const TREND_BADGE: Record<ProgressTrend['trend'], string> = {
  improving: '📈 Improving',
  declining: '📉 Declining',
  stable: '➡️ Stable',
  insufficient_data: '',
};

function toPrefill(s: SuggestedAssignment): AssignmentTemplatePrefill {
  return { title: s.title, instructions: s.instructions, assignmentType: s.assignmentType, referenceId: s.referenceId, timeLimitMinutes: null, requiredScore: null, xpReward: null, ageGroup: s.ageGroup };
}

function dayHeading(dayKey: string, todayKey: string, yesterdayKey: string): string {
  if (dayKey === todayKey) return 'Today';
  if (dayKey === yesterdayKey) return 'Yesterday';
  return new Date(`${dayKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function todayAndYesterdayKeys(): { todayKey: string; yesterdayKey: string } {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const yesterdayKey = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  return { todayKey, yesterdayKey };
}

function groupByDay(events: TimelineEvent[]): { dayKey: string; items: TimelineEvent[] }[] {
  const groups: { dayKey: string; items: TimelineEvent[] }[] = [];
  for (const e of events) {
    const last = groups[groups.length - 1];
    if (last && last.dayKey === e.dayKey) last.items.push(e);
    else groups.push({ dayKey: e.dayKey, items: [e] });
  }
  return groups;
}

export default function StudentActivityPanel({ studentId }: { studentId: string }) {
  const [range, setRangeState] = useState<TimelineRange>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<StudentTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignPrefill, setAssignPrefill] = useState<AssignmentTemplatePrefill | null>(null);
  const [assignOpenBlank, setAssignOpenBlank] = useState(false);

  function setRange(next: TimelineRange) {
    setRangeState(next);
    if (next !== 'custom') {
      setLoading(true);
      setError('');
    }
  }

  function setCustomRange(start: string, end: string) {
    setCustomStart(start);
    setCustomEnd(end);
    if (start && end) {
      setLoading(true);
      setError('');
    }
  }

  useEffect(() => {
    if (range === 'custom' && (!customStart || !customEnd)) return;
    let active = true;
    const qs = new URLSearchParams({ range });
    if (range === 'custom') {
      qs.set('start', customStart);
      qs.set('end', customEnd);
    }
    fetch(`/api/teacher/students/${studentId}/timeline?${qs.toString()}`)
      .then((res) => (res.ok ? (res.json() as Promise<StudentTimelineResponse>) : Promise.reject()))
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('Could not load activity — check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [studentId, range, customStart, customEnd]);

  const { todayKey, yesterdayKey } = todayAndYesterdayKeys();

  return (
    <div className="student-activity-panel">
      <div className="student-activity-filters">
        {RANGE_OPTIONS.map((opt) => (
          <button key={opt.value} type="button" className={range === opt.value ? 'active' : ''} onClick={() => setRange(opt.value)}>
            {opt.label}
          </button>
        ))}
        {range === 'custom' && (
          <span className="student-activity-custom-range">
            <input type="date" value={customStart} onChange={(e) => setCustomRange(e.target.value, customEnd)} max={todayKey} />
            <span>to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomRange(customStart, e.target.value)} max={todayKey} />
          </span>
        )}
      </div>

      {loading && <p className="student-detail-empty">Loading activity…</p>}
      {!loading && error && <p className="student-detail-empty">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="student-activity-summary">
            <div><b>{data.summary.learningSessions}</b><span>Learning sessions</span></div>
            <div><b>{data.summary.activitiesCompleted}</b><span>Activities completed</span></div>
            <div><b>{data.summary.assignmentsTotal ? `${data.summary.assignmentsCompleted}/${data.summary.assignmentsTotal}` : '—'}</b><span>Assignments</span></div>
            <div><b>{data.summary.avgQuizScore === null ? '—' : `${data.summary.avgQuizScore}%`}</b><span>Avg. quiz score</span></div>
            <div><b>🔥 {data.summary.learningStreakDays}</b><span>Learning streak</span></div>
          </div>

          {data.actions.length > 0 && (
            <div className="student-activity-actions">
              {data.actions.map((a) => (
                <div key={a.id} className="student-activity-action">
                  <p>{a.reason}</p>
                  <button
                    type="button"
                    className="add-student-primary"
                    onClick={() => (a.suggestedAssignment ? setAssignPrefill(toPrefill(a.suggestedAssignment)) : setAssignOpenBlank(true))}
                  >
                    {a.label}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="student-activity-timeline">
            {data.timeline.length === 0 ? (
              <p className="student-detail-empty">No activity in this time range.</p>
            ) : (
              groupByDay(data.timeline).map((group) => (
                <div key={group.dayKey} className="student-activity-day">
                  <p className="student-activity-day-heading">{dayHeading(group.dayKey, todayKey, yesterdayKey)}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        {item.precise && <time>{formatTime(item.occurredAt)}</time>}
                        <span>{item.emoji} {item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="student-activity-trends">
            <p className="teacher-kicker">Progress trends</p>
            <ul>
              {data.trends.map((t) => (
                <li key={t.key} className={`trend-${t.trend}`}>
                  <strong>{t.label}</strong>
                  {t.trend === 'insufficient_data' ? (
                    <span>Not enough history yet to show a trend.</span>
                  ) : (
                    <>
                      <span className={`student-insights-trend-badge trend-${t.trend}`}>{TREND_BADGE[t.trend]}</span>
                      {t.detail && <span>{t.detail}</span>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {assignPrefill && <CreateAssignmentModal initialTemplate={assignPrefill} onClose={() => setAssignPrefill(null)} onCreated={() => {}} />}
      {assignOpenBlank && <CreateAssignmentModal onClose={() => setAssignOpenBlank(false)} onCreated={() => {}} />}
    </div>
  );
}
