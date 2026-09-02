'use client';

import { useEffect, useState } from 'react';
import type { StudentDetailResponse } from '../lib/classrooms/types';
import { ACTIVITY_LABEL, dayLetter } from './format';

/**
 * Self-fetching student detail panel — reused by both the "My Students"
 * roster and a classroom's student list, so a click on a student card opens
 * the exact same profile no matter where it was clicked from.
 */
export default function StudentDetailModal({ studentId, onClose, onRemoved }: { studentId: string; onClose: () => void; onRemoved?: () => void }) {
  const [detail, setDetail] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`/api/teacher/students/${studentId}`)
      .then((res) => (res.ok ? (res.json() as Promise<StudentDetailResponse>) : Promise.reject()))
      .then((data) => {
        if (alive) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError('Could not load this student’s profile.');
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [studentId]);

  async function removeFromClassroom(classroomId: string) {
    setRemoveBusy(true);
    setRemoveError('');
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setRemoveError(data?.error || 'Could not remove this student.');
        return;
      }
      setRemoveConfirmId(null);
      onClose();
      onRemoved?.();
    } catch {
      setRemoveError('Could not remove this student. Check your connection and try again.');
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div className="student-detail-overlay" role="presentation" onClick={onClose}>
      <section
        className="student-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="student-detail-close" aria-label="Close" onClick={onClose}>×</button>

        {loading && (
          <div className="teacher-students-loading">
            <span></span>
            <p>Loading student profile…</p>
          </div>
        )}

        {!loading && error && <p className="student-detail-empty">{error}</p>}

        {!loading && detail && (
          <>
            <header className="student-detail-head">
              <span className="student-detail-avatar">{detail.student.name[0]}</span>
              <div>
                <h2 id="student-detail-title">{detail.student.name}</h2>
                <p>{detail.student.ageGroup === 'teen' ? 'Teen' : 'Child'} · Age {detail.student.age}</p>
              </div>
              <span className={`tsc-status tsc-status-${detail.student.activityStatus}`}>{ACTIVITY_LABEL[detail.student.activityStatus]}</span>
            </header>

            <div className="student-detail-stats">
              <div><b>{detail.student.levelTitle}</b><span>Level {detail.student.level}</span></div>
              <div><b>{detail.student.xp}</b><span>Total XP</span></div>
              <div><b>🔥 {detail.student.currentStreak}</b><span>current streak</span></div>
              <div><b>{detail.longestStreak}</b><span>longest streak</span></div>
              <div><b>{detail.student.weeklyActiveDays}/7</b><span>active this week</span></div>
              <div><b>{detail.student.masteryTracked ? `${detail.student.masteryPercent}%` : '—'}</b><span>avg. performance</span></div>
            </div>

            <div className="student-detail-section">
              <p className="teacher-kicker">This week</p>
              <div className="student-detail-calendar">
                {detail.weekCalendar.map((d) => (
                  <span key={d.date} className={`sdc-day sdc-${d.state}`} title={d.date}>{dayLetter(d.date)}</span>
                ))}
              </div>
            </div>

            {detail.student.needsAttention && (
              <div className="student-detail-attention">
                <p className="teacher-kicker">Needs attention</p>
                <ul>
                  {detail.student.needsAttentionReasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            <div className="student-detail-section">
              <p className="teacher-kicker">Strengths &amp; areas to practice</p>
              {detail.learning.strengths.length === 0 && detail.learning.needsPractice.length === 0 ? (
                <p className="student-detail-empty">Keep learning — we’ll identify strengths as more activity is completed.</p>
              ) : (
                <div className="student-detail-pills">
                  {detail.learning.strengths.map((c) => <span key={c.conceptId} className="pill pill-strength">{c.label}</span>)}
                  {detail.learning.needsPractice.map((c) => <span key={c.conceptId} className="pill pill-practice">{c.label}</span>)}
                </div>
              )}
            </div>

            {detail.stories.length > 0 && (
              <div className="student-detail-section">
                <p className="teacher-kicker">Interactive Bible stories</p>
                <p>{detail.stories.length} completed — most recently “{detail.stories[0].title}.”</p>
              </div>
            )}

            <div className="student-detail-section">
              <p className="teacher-kicker">Recent activity</p>
              {detail.recentActivity.length === 0 ? (
                <p className="student-detail-empty">No activity yet — check back once {detail.student.name.split(' ')[0]} starts learning.</p>
              ) : (
                <ul className="student-detail-activity">
                  {detail.recentActivity.map((item) => (
                    <li key={item.id}>
                      <time>{new Date(item.occurredAt).toLocaleDateString()}</time>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="student-detail-section">
              <p className="teacher-kicker">Classes</p>
              {removeError && <p className="add-student-error" role="alert">{removeError}</p>}
              <ul className="student-detail-classes">
                {detail.student.classrooms.map((c) => (
                  <li key={c.id}>
                    <span>{c.name}</span>
                    {removeConfirmId === c.id ? (
                      <span className="student-detail-remove-confirm">
                        <em>Remove {detail.student.name} from {c.name}?</em>
                        <button type="button" onClick={() => setRemoveConfirmId(null)} disabled={removeBusy}>Cancel</button>
                        <button type="button" className="student-detail-remove-go" onClick={() => removeFromClassroom(c.id)} disabled={removeBusy}>
                          {removeBusy ? 'Removing…' : 'Yes, remove'}
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="student-detail-remove" onClick={() => setRemoveConfirmId(c.id)}>Remove</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
