'use client';

import type { StudentCard as StudentCardData } from '../lib/classrooms/types';
import { ACTIVITY_LABEL, formatLastActive } from './format';

/** The compact student card used by both "My Students" and a classroom's student list. */
export default function StudentCard({ student, onClick, showClasses = true }: { student: StudentCardData; onClick: () => void; showClasses?: boolean }) {
  return (
    <button className="teacher-student-card" onClick={onClick}>
      <div className="tsc-top">
        <span className="tsc-avatar">{student.name[0]}</span>
        <div className="tsc-id">
          <strong>{student.name}</strong>
          <small>{student.ageGroup === 'teen' ? 'Teen' : 'Child'} · Age {student.age}</small>
        </div>
      </div>
      {showClasses && student.classrooms.length > 0 && (
        <div className="tsc-classes">
          {student.classrooms.map((c) => <span key={c.id}>{c.name}</span>)}
        </div>
      )}
      <div className="tsc-stats">
        <div><b>Lvl {student.level}</b><span>{student.xp} XP</span></div>
        <div><b>🔥 {student.currentStreak}</b><span>day streak</span></div>
        <div><b>{student.weeklyActiveDays}/7</b><span>active days</span></div>
        <div><b>{student.masteryTracked ? `${student.masteryPercent}%` : '—'}</b><span>performance</span></div>
      </div>
      <div className="tsc-foot">
        <span className={`tsc-status tsc-status-${student.activityStatus}`}>{ACTIVITY_LABEL[student.activityStatus]}</span>
        <small>{formatLastActive(student.lastActiveAt)}</small>
        {student.needsAttention && <em className="tsc-flag">Needs attention</em>}
      </div>
    </button>
  );
}
