'use client';

import { useState } from 'react';
import { useStudentAssignments } from './useStudentAssignments';
import { pendingAssignments, sortByPriority, dueBadgeLabel } from './priority';
import { AssignmentDetailModal } from './AssignmentDetailModal';
import type { StudentAssignment } from './types';

/**
 * Compact "Your Assignments" summary for the Home/Today tab. Renders
 * nothing while loading or on error (the full Assignments page owns those
 * states) so a quiet dashboard never flashes an error banner — but does
 * show the friendly all-caught-up state once we know there's truly nothing
 * pending, since that's a reassuring, intentional message, not noise.
 */
export function AssignmentsWidget({ tone, onViewAll }: { tone: 'child' | 'teen'; onViewAll: () => void }) {
  const { assignments, state, reload } = useStudentAssignments();
  const [openAssignment, setOpenAssignment] = useState<StudentAssignment | null>(null);

  if (state === 'loading' || state === 'error' || !assignments) return null;

  const pending = sortByPriority(pendingAssignments(assignments));

  return (
    <section className={`assignments-widget assignments-widget-${tone}`} aria-label="Your assignments">
      <p className="assignments-widget-kicker">{tone === 'teen' ? 'ASSIGNMENTS' : 'Your Assignments'}</p>

      {pending.length === 0 ? (
        <p className="assignments-widget-caught-up">You&rsquo;re all caught up! 🎉</p>
      ) : (
        <>
          <p className="assignments-widget-count">
            {pending.length} {pending.length === 1 ? 'assignment' : 'assignments'} waiting for you
          </p>
          <div className="assignments-widget-list">
            {pending.slice(0, 3).map((a) => (
              <button key={a.id} type="button" className="assignments-widget-row" onClick={() => setOpenAssignment(a)}>
                <span className="assignments-widget-row-title">{a.title}</span>
                <span className={`assignments-widget-row-due badge-${a.dueBucket}`}>{dueBadgeLabel(a)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <button type="button" className="assignments-widget-viewall" onClick={onViewAll}>
        View all →
      </button>

      {openAssignment && (
        <AssignmentDetailModal
          assignment={openAssignment}
          tone={tone}
          onClose={() => setOpenAssignment(null)}
          onChanged={reload}
        />
      )}
    </section>
  );
}
