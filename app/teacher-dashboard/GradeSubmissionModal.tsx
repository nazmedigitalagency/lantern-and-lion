'use client';

import { useState } from 'react';
import { isAutoScoredType, type AssignmentType } from '../lib/assignments/types';

export type GradeTarget = {
  assignmentId: string;
  assignmentType: AssignmentType;
  childId: string;
  studentName: string;
  responseText: string | null;
  currentScore: number | null;
  currentFeedback: string | null;
  scoreOverridden?: boolean;
};

/**
 * The one grading UI in the app — opened from the Assignment Center's
 * per-assignment submissions table and from the Gradebook's per-student
 * grid and "needs grading" queue alike, all against the same
 * `POST /api/assignments/{id}/grade` endpoint. For auto-scored types (story/
 * reading/quiz/memory/game) the score starts read-only; a teacher must
 * explicitly check "override this score" before it becomes editable, so an
 * automatic score is never silently overwritten.
 */
export default function GradeSubmissionModal({ target, onClose, onSaved }: { target: GradeTarget; onClose: () => void; onSaved: () => void }) {
  const autoScored = isAutoScoredType(target.assignmentType);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [score, setScore] = useState(target.currentScore === null ? '' : String(target.currentScore));
  const [feedback, setFeedback] = useState(target.currentFeedback || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const scoreEditable = !autoScored || overrideConfirmed;

  async function submit(returnToStudent: boolean) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/assignments/${target.assignmentId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: target.childId,
          score: scoreEditable && score !== '' ? Number(score) : undefined,
          feedback: feedback.trim() || undefined,
          returnToStudent,
          override: autoScored && overrideConfirmed ? true : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not save this grade.');
        return;
      }
      onSaved();
    } catch {
      setError('Could not save this grade. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-student-overlay" role="presentation" onClick={onClose}>
      <section className="add-student-dialog classroom-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="grade-title" onClick={(e) => e.stopPropagation()}>
        <button className="student-detail-close" aria-label="Close" onClick={onClose}>×</button>
        <h2 id="grade-title">Grade {target.studentName}&apos;s work</h2>

        {target.responseText && (
          <div className="assignment-response-box">
            <p className="teacher-kicker">Response</p>
            <p>{target.responseText}</p>
          </div>
        )}

        {autoScored && (
          <div className="grade-auto-notice">
            <p>
              This is an automatically scored assignment{target.currentScore !== null ? ` — the activity itself recorded ${target.currentScore}%` : ''}
              {target.scoreOverridden ? ' (already overridden once).' : '.'}
            </p>
            <label className="grade-override-toggle">
              <input type="checkbox" checked={overrideConfirmed} onChange={(e) => setOverrideConfirmed(e.target.checked)} />
              Override this automatic score
            </label>
          </div>
        )}

        <label className="add-student-field">
          Score % <small>{autoScored ? '(read-only unless overridden)' : '(optional)'}</small>
          <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} disabled={!scoreEditable} />
        </label>
        <label className="add-student-field">
          Feedback <small>(private, visible only to this student)</small>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} maxLength={2000} placeholder="Great work! Review verse 6 once more." />
        </label>
        {error && <p className="add-student-error" role="alert">{error}</p>}
        <div className="add-student-actions">
          <button type="button" className="add-student-secondary" disabled={busy} onClick={() => submit(false)}>
            {busy ? 'Saving…' : 'Save grade'}
          </button>
          <button type="button" className="add-student-primary" disabled={busy} onClick={() => submit(true)}>
            {busy ? 'Returning…' : 'Save & Return'}
          </button>
        </div>
      </section>
    </div>
  );
}
