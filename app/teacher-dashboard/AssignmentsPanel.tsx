'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AssignmentBucket, AssignmentDetail, AssignmentListItem, SubmissionStatus } from '../lib/assignments/types';
import { isAutoScoredType } from '../lib/assignments/types';
import CreateAssignmentModal from './CreateAssignmentModal';
import SaveTemplateModal from './SaveTemplateModal';
import PublishAssignmentModal from './PublishAssignmentModal';

const BUCKET_TABS: { value: AssignmentBucket; label: string }[] = [
  { value: 'draft', label: 'Drafts' },
  { value: 'active', label: 'Active' },
  { value: 'due_soon', label: 'Due soon' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  assigned: 'Assigned',
  in_progress: 'In progress',
  submitted: 'Submitted',
  graded: 'Graded',
  returned: 'Returned',
};

function formatDate(iso: string | null): string {
  if (!iso) return 'No due date';
  return new Date(`${iso}T00:00:00`).toLocaleDateString();
}

export default function AssignmentsPanel() {
  const [assignments, setAssignments] = useState<AssignmentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<AssignmentBucket>('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function refresh() {
    fetch('/api/assignments')
      .then((res) => (res.ok ? (res.json() as Promise<{ assignments: AssignmentListItem[] }>) : Promise.reject()))
      .then((data) => {
        setAssignments(data.assignments);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load your assignments — check your connection and try again.');
        setLoading(false);
      });
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => (assignments || []).filter((a) => a.bucket === tab), [assignments, tab]);
  const counts = useMemo(() => {
    const c: Record<AssignmentBucket, number> = { draft: 0, active: 0, due_soon: 0, completed: 0, overdue: 0 };
    for (const a of assignments || []) c[a.bucket] += 1;
    return c;
  }, [assignments]);

  if (selectedId) {
    return <AssignmentDetailView assignmentId={selectedId} onBack={() => { setSelectedId(null); refresh(); }} />;
  }

  if (loading) {
    return (
      <div className="teacher-students-loading">
        <span></span>
        <p>Loading your assignments…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-empty">
        <span>!</span>
        <div><strong>{error}</strong></div>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="teacher-add-student-button" onClick={() => setCreateOpen(true)}>+ Create Assignment</button>

      {(!assignments || assignments.length === 0) ? (
        <div className="teacher-empty teacher-empty-students">
          <span>📝</span>
          <div>
            <strong>No assignments yet.</strong>
            <p>Create your first assignment — a Bible story, quiz, or a written response for your class.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="classroom-assignment-tabs assignment-center-tabs">
            {BUCKET_TABS.map((t) => (
              <button key={t.value} type="button" className={tab === t.value ? 'active' : ''} onClick={() => setTab(t.value)}>
                {t.label} ({counts[t.value]})
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="student-detail-empty">Nothing here.</p>
          ) : (
            <ul className="assignment-center-list">
              {filtered.map((a) => (
                <li key={a.id} onClick={() => setSelectedId(a.id)}>
                  <div className="assignment-center-row-main">
                    <strong>{a.title}</strong>
                    <small>
                      {a.referenceLabel || 'Custom'} · {a.classroom ? a.classroom.name : `${a.studentCount} student${a.studentCount === 1 ? '' : 's'}`} · Created {formatDate(a.createdAt.slice(0, 10))}
                    </small>
                  </div>
                  <div className="assignment-center-row-stats">
                    <span>{a.completedCount}/{a.studentCount} completed</span>
                    <span>{a.avgScore === null ? 'No scores yet' : `Avg. ${a.avgScore}%`}</span>
                    <span>{formatDate(a.dueDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {createOpen && <CreateAssignmentModal onClose={() => setCreateOpen(false)} onCreated={refresh} />}
    </>
  );
}

function AssignmentDetailView({ assignmentId, onBack }: { assignmentId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | SubmissionStatus>('all');
  const [gradingChildId, setGradingChildId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeBusy, setGradeBusy] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [duplicated, setDuplicated] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  function load() {
    fetch(`/api/assignments/${assignmentId}`)
      .then((res) => (res.ok ? (res.json() as Promise<AssignmentDetail>) : Promise.reject()))
      .then((data) => { setDetail(data); setLoading(false); })
      .catch(() => { setError('Could not load this assignment.'); setLoading(false); });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const submissions = useMemo(() => {
    if (!detail) return [];
    return submissionFilter === 'all' ? detail.submissions : detail.submissions.filter((s) => s.status === submissionFilter);
  }, [detail, submissionFilter]);

  function openGrading(childId: string, currentScore: number | null, currentFeedback: string | null) {
    setGradingChildId(childId);
    setGradeScore(currentScore === null ? '' : String(currentScore));
    setGradeFeedback(currentFeedback || '');
    setGradeError('');
  }

  async function submitGrade(returnToStudent: boolean) {
    if (!gradingChildId) return;
    setGradeBusy(true);
    setGradeError('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: gradingChildId,
          score: gradeScore ? Number(gradeScore) : undefined,
          feedback: gradeFeedback.trim() || undefined,
          returnToStudent,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setGradeError(data?.error || 'Could not save this grade.');
        return;
      }
      setGradingChildId(null);
      load();
    } catch {
      setGradeError('Could not save this grade. Check your connection and try again.');
    } finally {
      setGradeBusy(false);
    }
  }

  async function duplicate() {
    setDuplicateBusy(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/duplicate`, { method: 'POST' });
      if (res.ok) setDuplicated(true);
    } finally {
      setDuplicateBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="teacher-students-loading">
        <span></span>
        <p>Loading assignment…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="teacher-empty">
        <span>!</span>
        <div><strong>{error || 'Assignment not found.'}</strong></div>
      </div>
    );
  }

  const gradingRow = detail.submissions.find((s) => s.childId === gradingChildId);
  const manuallyGraded = !isAutoScoredType(detail.assignmentType);

  return (
    <div className="classroom-detail">
      <button type="button" className="classroom-back" onClick={onBack}>← Back to Assignments</button>

      <header className="classroom-detail-head">
        <div>
          <h1>{detail.title}</h1>
          {detail.instructions && <p className="classroom-detail-desc">{detail.instructions}</p>}
          <p className="classroom-detail-meta">
            {detail.referenceLabel || 'Custom'} · {detail.classroom ? detail.classroom.name : `${detail.studentCount} selected students`} · Due {formatDate(detail.dueDate)}
            {detail.status === 'draft' && ' · Draft'}
          </p>
        </div>
        <div className="assignment-detail-actions">
          {detail.status === 'draft' && (
            <button type="button" className="assignment-publish-button" onClick={() => setPublishOpen(true)}>Publish</button>
          )}
          <button type="button" onClick={() => setSaveTemplateOpen(true)}>Save as template</button>
          <button type="button" onClick={duplicate} disabled={duplicateBusy}>{duplicateBusy ? 'Duplicating…' : duplicated ? 'Duplicated ✓' : 'Duplicate'}</button>
        </div>
      </header>

      {publishOpen && (
        <PublishAssignmentModal
          assignmentId={assignmentId}
          defaultClassroomId={detail.classroom?.id || null}
          onClose={() => setPublishOpen(false)}
          onPublished={() => { setPublishOpen(false); load(); }}
        />
      )}

      {saveTemplateOpen && (
        <SaveTemplateModal
          source={{ assignmentType: detail.assignmentType, referenceId: detail.referenceId, instructions: detail.instructions, timeLimitMinutes: detail.timeLimitMinutes, requiredScore: detail.requiredScore, xpReward: detail.xpReward, defaultTitle: detail.title }}
          onClose={() => setSaveTemplateOpen(false)}
          onSaved={() => {}}
        />
      )}

      <div className="classroom-detail-stats">
        <div><b>{detail.completedCount}/{detail.studentCount}</b><span>Completed</span></div>
        <div><b>{detail.gradedCount}/{detail.studentCount}</b><span>Graded</span></div>
        <div><b>{detail.avgScore === null ? '—' : `${detail.avgScore}%`}</b><span>Average score</span></div>
        <div><b>{detail.requiredScore === null ? '—' : `${detail.requiredScore}%`}</b><span>Required score</span></div>
        <div><b>{detail.xpReward || 0}</b><span>XP reward</span></div>
      </div>

      <section className="classroom-detail-section">
        <div className="classroom-section-head">
          <h2>Student submissions</h2>
          <select value={submissionFilter} onChange={(e) => setSubmissionFilter(e.target.value as 'all' | SubmissionStatus)} aria-label="Filter submissions">
            <option value="all">All students</option>
            <option value="assigned">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        {submissions.length === 0 ? (
          <p className="student-detail-empty">No students match this filter.</p>
        ) : (
          <div className="assignment-submissions-table">
            <div className="assignment-submissions-head">
              <span>Student</span><span>Status</span><span>Score</span><span>Submitted</span><span>Actions</span>
            </div>
            {submissions.map((s) => (
              <div key={s.childId} className="assignment-submissions-row">
                <span>{s.studentName}</span>
                <span className={`tsc-status assignment-status-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                <span>{s.score === null ? '—' : `${s.score}%`}</span>
                <span>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '—'}</span>
                <span>
                  {(manuallyGraded && (s.status === 'submitted' || s.status === 'graded' || s.status === 'returned')) ? (
                    <button type="button" className="student-detail-remove" onClick={() => openGrading(s.childId, s.score, s.feedback)}>
                      {s.status === 'submitted' ? 'Grade' : 'Edit grade'}
                    </button>
                  ) : (
                    <span className="assignment-no-action">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {gradingChildId && gradingRow && (
        <div className="add-student-overlay" role="presentation" onClick={() => setGradingChildId(null)}>
          <section className="add-student-dialog classroom-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="grade-title" onClick={(e) => e.stopPropagation()}>
            <button className="student-detail-close" aria-label="Close" onClick={() => setGradingChildId(null)}>×</button>
            <h2 id="grade-title">Grade {gradingRow.studentName}&apos;s work</h2>
            {gradingRow.responseText && (
              <div className="assignment-response-box">
                <p className="teacher-kicker">Response</p>
                <p>{gradingRow.responseText}</p>
              </div>
            )}
            <label className="add-student-field">
              Score % <small>(optional)</small>
              <input type="number" min={0} max={100} value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} />
            </label>
            <label className="add-student-field">
              Feedback <small>(private, visible only to this student)</small>
              <textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} rows={3} maxLength={2000} placeholder="Great work! Review verse 6 once more." />
            </label>
            {gradeError && <p className="add-student-error" role="alert">{gradeError}</p>}
            <div className="add-student-actions">
              <button type="button" className="add-student-secondary" disabled={gradeBusy} onClick={() => submitGrade(false)}>
                {gradeBusy ? 'Saving…' : 'Save grade'}
              </button>
              <button type="button" className="add-student-primary" disabled={gradeBusy} onClick={() => submitGrade(true)}>
                {gradeBusy ? 'Returning…' : 'Save & Return'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
