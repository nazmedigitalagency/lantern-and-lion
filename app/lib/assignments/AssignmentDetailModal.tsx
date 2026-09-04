'use client';

import { useCallback, useState } from 'react';
import { useDialogA11y } from '../use-dialog';
import { ASSIGNMENT_TYPE_LABEL, type StudentAssignment } from './types';
import { statusLabel } from './priority';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function AssignmentDetailModal({
  assignment,
  tone,
  onClose,
  onChanged,
}: {
  assignment: StudentAssignment;
  tone: 'child' | 'teen';
  onClose: () => void;
  onChanged: () => void;
}) {
  const [draftText, setDraftText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const closeModal = useCallback(() => onClose(), [onClose]);
  const dialogRef = useDialogA11y<HTMLDivElement>(true, closeModal);

  const a = assignment;
  const isGraded = a.status === 'graded' || a.status === 'returned';
  const isSubmitted = a.status === 'submitted';
  const canAct = a.status === 'assigned' || a.status === 'in_progress';
  const needsManualSubmit = !a.contentLink && canAct;

  async function doSubmit() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/child/assignments/${a.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText: draftText || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || 'Could not submit right now. Please try again.');
        return;
      }
      setConfirming(false);
      setJustSubmitted(true);
      onChanged();
    } catch {
      setError('Could not submit right now. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-label={a.title}>
      <div ref={dialogRef} className={`help-dialog assignment-detail-dialog assignment-detail-${tone}`}>
        <button type="button" className="close-help" onClick={closeModal} aria-label="Close">✕</button>

        <p className="assignment-detail-type">{ASSIGNMENT_TYPE_LABEL[a.assignmentType]}</p>
        <h2>{a.title}</h2>
        {a.classroomName && <p className="assignment-detail-from">From: {a.classroomName}</p>}

        {a.instructions && <p className="assignment-detail-instructions">{a.instructions}</p>}

        <div className="assignment-detail-facts">
          <div>
            <span>Due</span>
            <strong>{formatDate(a.dueDate) || 'No due date'}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{justSubmitted ? 'Submitted — waiting for review' : statusLabel(a)}</strong>
          </div>
          {a.requiredScore !== null && (
            <div>
              <span>Required score</span>
              <strong>{a.requiredScore}%</strong>
            </div>
          )}
          {a.xpReward ? (
            <div>
              <span>Reward</span>
              <strong>+{a.xpReward} XP</strong>
            </div>
          ) : null}
          {a.timeLimitMinutes && (
            <div>
              <span>Time</span>
              <strong>{a.timeLimitMinutes} min</strong>
            </div>
          )}
        </div>

        {justSubmitted && (
          <div className="assignment-detail-submitted-banner" role="status">
            <p><strong>Assignment submitted!</strong></p>
            <p>Submitted just now. {a.xpReward ? `You'll see your ${a.xpReward} XP once it's reviewed.` : 'Your teacher will review it soon.'} Waiting for your teacher to review it.</p>
          </div>
        )}

        {!justSubmitted && (isGraded || a.feedback) && (
          <div className="assignment-detail-result">
            {a.score !== null && <p className="assignment-detail-score">Score: {a.score}%</p>}
            {a.feedback ? (
              tone === 'child' ? (
                <div className="assignment-detail-feedback child-speech-feedback" role="region" aria-label="Teacher Feedback">
                  <div className="child-speech-kicker">
                    <span className="child-speech-avatar" aria-hidden="true">👩‍🏫</span>
                    <span className="child-speech-title">{a.teacherName || 'Ms. Sarah'} says...</span>
                    <span className="child-feedback-tag">Teacher Feedback</span>
                  </div>
                  <div className="child-speech-bubble">
                    <p>&ldquo;{a.feedback}&rdquo;</p>
                  </div>
                </div>
              ) : (
                <div className="assignment-detail-feedback teen-card-feedback" role="region" aria-label="Teacher Feedback">
                  <div className="teen-card-kicker">
                    <span className="teen-feedback-icon" aria-hidden="true">💬</span>
                    <span className="teen-card-title">Teacher feedback</span>
                    {a.teacherName && <span className="teen-teacher-sub">• {a.teacherName}</span>}
                  </div>
                  <div className="teen-card-body">
                    <p>&ldquo;{a.feedback}&rdquo;</p>
                  </div>
                </div>
              )
            ) : (
              <p className="assignment-detail-nofeedback">Nice work — this one&rsquo;s complete.</p>
            )}
          </div>
        )}

        {!justSubmitted && isSubmitted && (
          <p className="assignment-detail-waiting">Submitted — waiting for your teacher to review it.</p>
        )}

        {!justSubmitted && canAct && a.contentLink && (
          <a className="assignment-detail-start" href={a.contentLink}>
            {a.status === 'in_progress' ? 'Continue Assignment' : 'Start Assignment'}
          </a>
        )}

        {!justSubmitted && needsManualSubmit && !confirming && (
          <div className="assignment-detail-write">
            {a.instructions && (
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Type your answer here…"
                rows={5}
                maxLength={4000}
              />
            )}
            <button type="button" className="assignment-detail-start" onClick={() => setConfirming(true)}>
              {a.instructions ? 'Ready to Submit' : 'Mark as Done'}
            </button>
          </div>
        )}

        {!justSubmitted && needsManualSubmit && confirming && (
          <div className="assignment-detail-confirm">
            <p>Ready to submit?</p>
            <p className="assignment-detail-confirm-note">Once you submit, you can&rsquo;t change your answer.</p>
            {error && <p className="assignment-detail-error">{error}</p>}
            <div className="assignment-detail-confirm-actions">
              <button type="button" className="assignment-detail-cancel" onClick={() => setConfirming(false)} disabled={busy}>
                Not yet
              </button>
              <button type="button" className="assignment-detail-submit" onClick={doSubmit} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
