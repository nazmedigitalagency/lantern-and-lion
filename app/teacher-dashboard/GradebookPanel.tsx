'use client';

import { useEffect, useState } from 'react';
import type { ClassroomCard, ClassroomsListResponse } from '../lib/classrooms/types';
import type { SubmissionStatus } from '../lib/assignments/types';
import type { ClassGradebookResponse, GradebookQueueItem } from '../lib/gradebook/types';
import GradeSubmissionModal, { type GradeTarget } from './GradeSubmissionModal';

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  assigned: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  graded: 'Graded',
  returned: 'Returned',
};

const TREND_ICON: Record<string, string> = { improving: '📈', declining: '📉', stable: '➡️', insufficient_data: '' };

type QueueFilter = 'all' | 'ungraded' | 'submitted' | 'overdue';

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default function GradebookPanel() {
  const [classrooms, setClassrooms] = useState<ClassroomCard[]>([]);
  const [classroomId, setClassroomId] = useState('');
  const [view, setView] = useState<'queue' | 'grid'>('queue');

  useEffect(() => {
    fetch('/api/classrooms/list')
      .then((res) => (res.ok ? (res.json() as Promise<ClassroomsListResponse>) : null))
      .then((data) => { if (data) setClassrooms(data.classrooms); })
      .catch(() => {});
  }, []);

  return (
    <div className="gradebook-panel">
      <div className="gradebook-top-controls">
        {classrooms.length > 1 && (
          <label className="gradebook-classroom-select">
            Classroom
            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
              <option value="">All classes</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <div className="student-activity-filters">
          <button type="button" className={view === 'queue' ? 'active' : ''} onClick={() => setView('queue')}>Gradebook</button>
          <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>Class Gradebook</button>
        </div>
      </div>

      {view === 'queue' ? <QueueView classroomId={classroomId} /> : <GridView classroomId={classroomId} classrooms={classrooms} />}
    </div>
  );
}

function QueueView({ classroomId }: { classroomId: string }) {
  const [items, setItems] = useState<GradebookQueueItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [gradeTarget, setGradeTarget] = useState<GradeTarget | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkScore, setBulkScore] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [toast, setToast] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  function load() {
    setReloadToken((t) => t + 1);
  }

  useEffect(() => {
    let active = true;
    const qs = classroomId ? `?classroomId=${classroomId}` : '';
    fetch(`/api/gradebook/queue${qs}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ items: GradebookQueueItem[] }>) : Promise.reject()))
      .then((data) => {
        if (active) {
          setItems(data.items);
          setLoading(false);
          setSelected(new Set());
        }
      })
      .catch(() => {
        if (active) {
          setError('Could not load the gradebook — check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [classroomId, reloadToken]);

  if (loading) return <p className="student-detail-empty">Loading gradebook…</p>;
  if (error) return <p className="student-detail-empty">{error}</p>;
  if (!items) return null;

  const filtered = items.filter((it) => {
    if (filter === 'ungraded') return it.status === 'submitted';
    if (filter === 'submitted') return it.status === 'submitted' || it.status === 'graded' || it.status === 'returned';
    if (filter === 'overdue') return it.overdue;
    return true;
  });

  function rowKey(it: GradebookQueueItem) { return `${it.assignmentId}:${it.childId}`; }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function selectedItems(): GradebookQueueItem[] {
    return filtered.filter((it) => selected.has(rowKey(it)));
  }

  async function bulkReturn() {
    const chosen = selectedItems().filter((it) => it.status === 'graded');
    if (chosen.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/assignments/bulk-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: chosen.map((it) => ({ assignmentId: it.assignmentId, childId: it.childId })) }),
      });
      const data = (await res.json().catch(() => null)) as { returned?: number; skipped?: number } | null;
      setToast(`Returned ${data?.returned ?? 0} submission${data?.returned === 1 ? '' : 's'} to students.`);
      load();
    } finally {
      setBulkBusy(false);
    }
  }

  async function applyBulkGrade() {
    if (bulkScore === '') { setBulkError('Enter a score to apply.'); return; }
    const chosen = selectedItems();
    setBulkBusy(true);
    setBulkError('');
    try {
      const res = await fetch('/api/assignments/bulk-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: chosen.map((it) => ({ assignmentId: it.assignmentId, childId: it.childId })),
          score: Number(bulkScore),
          feedback: bulkFeedback.trim() || undefined,
          returnToStudent: true,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; graded?: number; skippedAuto?: number } | null;
      if (!res.ok) { setBulkError(data?.error || 'Could not save these grades.'); return; }
      setToast(`Graded ${data?.graded ?? 0} submission${data?.graded === 1 ? '' : 's'}${data?.skippedAuto ? ` (${data.skippedAuto} auto-scored, skipped)` : ''}.`);
      setBulkOpen(false);
      setBulkScore('');
      setBulkFeedback('');
      load();
    } catch {
      setBulkError('Could not save these grades. Check your connection and try again.');
    } finally {
      setBulkBusy(false);
    }
  }

  const FILTER_OPTIONS: { value: QueueFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'ungraded', label: 'Ungraded' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <div>
      <div className="student-activity-filters">
        {FILTER_OPTIONS.map((f) => (
          <button key={f.value} type="button" className={filter === f.value ? 'active' : ''} onClick={() => setFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      {toast && <p className="gradebook-toast">{toast}</p>}

      {selected.size > 0 && (
        <div className="gradebook-bulk-bar">
          <span>{selected.size} selected</span>
          <button type="button" onClick={() => setBulkOpen(true)}>Grade selected…</button>
          <button type="button" disabled={bulkBusy} onClick={bulkReturn}>Return selected to students</button>
        </div>
      )}

      {bulkOpen && (
        <div className="add-student-overlay" role="presentation" onClick={() => setBulkOpen(false)}>
          <section className="add-student-dialog classroom-manage-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="student-detail-close" aria-label="Close" onClick={() => setBulkOpen(false)}>×</button>
            <h2>Grade {selected.size} submissions</h2>
            <p className="student-detail-empty">Auto-scored assignments (stories, quizzes, reading, memory, games) are skipped — override their scores one at a time instead.</p>
            <label className="add-student-field">
              Score %
              <input type="number" min={0} max={100} value={bulkScore} onChange={(e) => setBulkScore(e.target.value)} />
            </label>
            <label className="add-student-field">
              Feedback <small>(applied to all selected)</small>
              <textarea value={bulkFeedback} onChange={(e) => setBulkFeedback(e.target.value)} rows={3} maxLength={2000} />
            </label>
            {bulkError && <p className="add-student-error" role="alert">{bulkError}</p>}
            <div className="add-student-actions">
              <button type="button" className="add-student-primary" disabled={bulkBusy} onClick={applyBulkGrade}>
                {bulkBusy ? 'Saving…' : 'Grade & return to students'}
              </button>
            </div>
          </section>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="student-detail-empty">Nothing here.</p>
      ) : (
        <div className="gradebook-queue-table">
          <div className="gradebook-queue-row gradebook-queue-head">
            <span></span><span>Class</span><span>Student</span><span>Assignment</span><span>Status</span><span>Score</span><span>Submitted</span><span>Graded</span><span>Feedback</span><span></span>
          </div>
          {filtered.map((it) => {
            const key = rowKey(it);
            return (
              <div key={key} className="gradebook-queue-row">
                <span><input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} aria-label={`Select ${it.studentName} — ${it.assignmentTitle}`} /></span>
                <span>{it.classroomName || '—'}</span>
                <span>{it.studentName}</span>
                <span>{it.assignmentTitle}</span>
                <span className={`tsc-status assignment-status-${it.status}`}>{STATUS_LABEL[it.status]}{it.overdue ? ' · Overdue' : ''}</span>
                <span>{it.score === null ? '—' : `${it.score}%`}{it.scoreOverridden ? ' (overridden)' : ''}</span>
                <span>{fmtDate(it.submittedAt)}</span>
                <span>{it.status === 'graded' || it.status === 'returned' ? '✓' : '—'}</span>
                <span>{it.feedback ? '💬' : '—'}</span>
                <span>
                  {(it.status === 'submitted' || it.status === 'graded' || it.status === 'returned') && (
                    <button
                      type="button"
                      className="student-detail-remove"
                      onClick={() => setGradeTarget({
                        assignmentId: it.assignmentId,
                        assignmentType: it.assignmentType,
                        childId: it.childId,
                        studentName: it.studentName,
                        responseText: it.responseText,
                        currentScore: it.score,
                        currentFeedback: it.feedback,
                        scoreOverridden: it.scoreOverridden,
                      })}
                    >
                      {it.status === 'submitted' ? 'Grade' : 'Edit'}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {gradeTarget && (
        <GradeSubmissionModal target={gradeTarget} onClose={() => setGradeTarget(null)} onSaved={() => { setGradeTarget(null); load(); }} />
      )}
    </div>
  );
}

function GridView({ classroomId, classrooms }: { classroomId: string; classrooms: ClassroomCard[] }) {
  const [data, setData] = useState<ClassGradebookResponse | null>(null);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [gradeTarget, setGradeTarget] = useState<GradeTarget | null>(null);

  useEffect(() => {
    if (!classroomId) return;
    let active = true;
    fetch(`/api/classrooms/${classroomId}/gradebook`)
      .then((res) => (res.ok ? (res.json() as Promise<ClassGradebookResponse>) : Promise.reject()))
      .then((d) => {
        if (active) {
          setData(d);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Could not load this class gradebook.');
      });
    return () => {
      active = false;
    };
  }, [classroomId, reloadToken]);

  const loading = !!classroomId && !error && (!data || data.classroom.id !== classroomId);

  if (!classroomId) {
    return (
      <div className="teacher-empty teacher-empty-students">
        <span>📊</span>
        <div>
          <strong>Select a class to see its spreadsheet gradebook.</strong>
          <p>{classrooms.length === 0 ? 'Create a classroom first.' : 'Use the Classroom dropdown above.'}</p>
        </div>
      </div>
    );
  }

  if (loading) return <p className="student-detail-empty">Loading class gradebook…</p>;
  if (error || !data) return <p className="student-detail-empty">{error || 'Class not found.'}</p>;

  return (
    <div>
      <div className="student-activity-summary">
        <div><b>{data.classSummary.avgScore === null ? '—' : `${data.classSummary.avgScore}%`}</b><span>Average class score</span></div>
        <div><b>{data.classSummary.completionRate === null ? '—' : `${data.classSummary.completionRate}%`}</b><span>Completion rate</span></div>
        <div><b>{data.classSummary.awaitingGrading}</b><span>Awaiting grading</span></div>
        <div><b>{data.classSummary.overdueCount}</b><span>Overdue</span></div>
      </div>
      {data.classSummary.mostImproved && (
        <p className="gradebook-most-improved">🌟 {data.classSummary.mostImproved.detail}</p>
      )}

      {data.assignments.length === 0 ? (
        <p className="student-detail-empty">No live assignments in this class yet.</p>
      ) : data.students.length === 0 ? (
        <p className="student-detail-empty">No students in this class yet.</p>
      ) : (
        <>
          <div className="gradebook-table-wrap">
            <table className="gradebook-table">
              <thead>
                <tr>
                  <th>Student</th>
                  {data.assignments.map((a) => <th key={a.id}>{a.title}</th>)}
                  <th>Average</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s.studentId}>
                    <td>{s.name} {TREND_ICON[s.trend] && <span title={s.trendDetail || ''}>{TREND_ICON[s.trend]}</span>}</td>
                    {data.assignments.map((a) => {
                      const cell = s.cells[a.id];
                      return (
                        <td key={a.id}>
                          {cell && (cell.status === 'submitted' || cell.status === 'graded' || cell.status === 'returned') ? (
                            <button
                              type="button"
                              className={`gradebook-cell gradebook-cell-${cell.status}${cell.overdue ? ' gradebook-cell-overdue' : ''}`}
                              onClick={() => setGradeTarget({
                                assignmentId: a.id,
                                assignmentType: a.assignmentType,
                                childId: s.studentId,
                                studentName: s.name,
                                responseText: cell.responseText,
                                currentScore: cell.score,
                                currentFeedback: cell.feedback,
                                scoreOverridden: cell.scoreOverridden,
                              })}
                            >
                              {cell.score === null ? STATUS_LABEL[cell.status] : `${cell.score}%`}
                            </button>
                          ) : (
                            <span className={`gradebook-cell gradebook-cell-empty${cell?.overdue ? ' gradebook-cell-overdue' : ''}`}>{cell?.overdue ? 'Overdue' : '—'}</span>
                          )}
                        </td>
                      );
                    })}
                    <td><b>{s.average === null ? '—' : `${s.average}%`}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="gradebook-cards">
            {data.students.map((s) => (
              <div key={s.studentId} className="gradebook-student-card">
                <div className="gradebook-student-card-head">
                  <strong>{s.name}</strong>
                  <b>{s.average === null ? '—' : `${s.average}%`} avg</b>
                </div>
                <ul>
                  {data.assignments.map((a) => {
                    const cell = s.cells[a.id];
                    const gradable = cell && (cell.status === 'submitted' || cell.status === 'graded' || cell.status === 'returned');
                    return (
                      <li key={a.id}>
                        <span>{a.title}</span>
                        {gradable ? (
                          <button type="button" onClick={() => setGradeTarget({
                            assignmentId: a.id,
                            assignmentType: a.assignmentType,
                            childId: s.studentId,
                            studentName: s.name,
                            responseText: cell!.responseText,
                            currentScore: cell!.score,
                            currentFeedback: cell!.feedback,
                            scoreOverridden: cell!.scoreOverridden,
                          })}>
                            {cell!.score === null ? STATUS_LABEL[cell!.status] : `${cell!.score}%`}
                          </button>
                        ) : (
                          <em>{cell?.overdue ? 'Overdue' : '—'}</em>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="gradebook-student-card-stats">{s.completed} completed · {s.pending} pending{s.overdue ? ` · ${s.overdue} overdue` : ''}{TREND_ICON[s.trend] ? ` · ${TREND_ICON[s.trend]}` : ''}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {gradeTarget && (
        <GradeSubmissionModal
          target={gradeTarget}
          onClose={() => setGradeTarget(null)}
          onSaved={() => {
            setGradeTarget(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}
