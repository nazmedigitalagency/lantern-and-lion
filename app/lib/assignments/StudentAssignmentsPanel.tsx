'use client';

import { useEffect, useState } from 'react';
import type { StudentAssignment } from './types';

const DUE_LABEL: Record<StudentAssignment['dueBucket'], string> = {
  upcoming: 'Upcoming',
  due_today: 'Due today',
  due_soon: 'Due soon',
  overdue: "You can still finish this",
  completed: 'Done',
};

/**
 * The student-facing half of the teacher's Assignment Center — same data,
 * shaped for a child/teen. Self-fetching so it drops into either dashboard
 * without touching their existing load sequence. Renders nothing when
 * there's nothing assigned, so it never adds clutter to a quiet day.
 */
export function StudentAssignmentsPanel({ tone = 'child' }: { tone?: 'child' | 'teen' }) {
  const [assignments, setAssignments] = useState<StudentAssignment[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch('/api/child/assignments')
      .then((res) => (res.ok ? (res.json() as Promise<{ assignments: StudentAssignment[] }>) : null))
      .then((data) => { if (data) setAssignments(data.assignments); })
      .catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function submit(id: string, text: string) {
    setBusyId(id);
    try {
      await fetch(`/api/child/assignments/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText: text || undefined }),
      });
      setExpandedId(null);
      setDraftText('');
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (!assignments || assignments.length === 0) return null;
  const pending = assignments.filter((a) => a.status !== 'graded' && a.status !== 'returned');
  const done = assignments.filter((a) => a.status === 'graded' || a.status === 'returned');
  if (pending.length === 0 && done.length === 0) return null;

  return (
    <section className={`student-assignments student-assignments-${tone}`} aria-label="My assignments">
      <p className="student-assignments-kicker">{tone === 'teen' ? 'ASSIGNMENTS' : 'My Assignments'}</p>
      <div className="student-assignments-list">
        {[...pending, ...done].map((a) => {
          const isOpen = expandedId === a.id;
          const canAct = a.status === 'assigned' || a.status === 'in_progress';
          const needsManualSubmit = !a.contentLink && canAct;
          return (
            <article key={a.id} className={`student-assignment-card ${a.dueBucket === 'overdue' ? 'is-overdue' : ''}`}>
              <div className="student-assignment-head">
                <strong>{a.title}</strong>
                <span className={`student-assignment-badge badge-${a.dueBucket}`}>{DUE_LABEL[a.dueBucket]}</span>
              </div>
              {a.instructions && <p className="student-assignment-instructions">{a.instructions}</p>}
              <div className="student-assignment-meta">
                {a.dueDate && <span>📅 Due {new Date(`${a.dueDate}T00:00:00`).toLocaleDateString()}</span>}
                {a.timeLimitMinutes && <span>⏱ {a.timeLimitMinutes} min</span>}
                {a.requiredScore !== null && <span>🎯 {a.requiredScore}% to pass</span>}
                {a.xpReward ? <span>⭐ {a.xpReward} XP</span> : null}
              </div>

              {(a.status === 'graded' || a.status === 'returned') && (
                <div className="student-assignment-result">
                  {a.score !== null && <p><b>Score: {a.score}%</b></p>}
                  {a.feedback && <p className="student-assignment-feedback">“{a.feedback}”</p>}
                </div>
              )}
              {a.status === 'submitted' && <p className="student-assignment-waiting">Submitted — waiting for your teacher to review it.</p>}

              {canAct && a.contentLink && (
                <a className="student-assignment-go" href={a.contentLink}>Go do it →</a>
              )}

              {needsManualSubmit && !isOpen && (
                <button type="button" className="student-assignment-go" onClick={() => { setExpandedId(a.id); setDraftText(''); }}>
                  {a.instructions ? 'Write my answer' : 'Mark as done'}
                </button>
              )}

              {needsManualSubmit && isOpen && (
                <div className="student-assignment-submit">
                  {a.instructions && (
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder="Type your answer here…"
                      rows={3}
                      maxLength={4000}
                    />
                  )}
                  <div className="student-assignment-submit-actions">
                    <button type="button" onClick={() => setExpandedId(null)}>Cancel</button>
                    <button type="button" disabled={busyId === a.id} onClick={() => submit(a.id, draftText)}>
                      {busyId === a.id ? 'Sending…' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
