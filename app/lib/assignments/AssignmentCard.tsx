'use client';

import { ASSIGNMENT_TYPE_LABEL, type StudentAssignment } from './types';
import { dueBadgeLabel, statusLabel } from './priority';

export function AssignmentCard({
  assignment,
  tone,
  onOpen,
}: {
  assignment: StudentAssignment;
  tone: 'child' | 'teen';
  onOpen: (assignment: StudentAssignment) => void;
}) {
  const a = assignment;
  const isDone = a.status === 'graded' || a.status === 'returned';

  return (
    <button
      type="button"
      className={`assignment-card assignment-card-${tone} ${a.dueBucket === 'overdue' ? 'is-overdue' : ''} ${isDone ? 'is-done' : ''}`}
      onClick={() => onOpen(a)}
    >
      <div className="assignment-card-top">
        <span className={`assignment-badge badge-${a.dueBucket}`}>{dueBadgeLabel(a)}</span>
        {a.xpReward ? <span className="assignment-xp-chip">⭐ {a.xpReward} XP</span> : null}
      </div>
      <strong className="assignment-card-title">{a.title}</strong>
      <span className="assignment-card-type">{ASSIGNMENT_TYPE_LABEL[a.assignmentType]}</span>
      {a.classroomName && <span className="assignment-card-from">From {a.classroomName}</span>}
      <span className={`assignment-card-status status-${a.status}`}>{statusLabel(a)}</span>
    </button>
  );
}
