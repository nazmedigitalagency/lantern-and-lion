'use client';

import { useEffect, useState } from 'react';
import type { ClassroomCard, ClassroomsListResponse } from '../lib/classrooms/types';
import { GOAL_TYPE_LABEL, GOAL_TYPE_UNIT, type ClassChallengeSummary } from '../lib/challenges/types';
import CreateChallengeModal from './CreateChallengeModal';

const STATUS_LABEL: Record<ClassChallengeSummary['status'], string> = {
  active: 'Active',
  completed: 'Complete',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString();
}

export default function ChallengesPanel() {
  const [classrooms, setClassrooms] = useState<ClassroomCard[]>([]);
  const [classroomId, setClassroomId] = useState('');
  const [challenges, setChallenges] = useState<ClassChallengeSummary[] | null>(null);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/classrooms/list')
      .then((res) => (res.ok ? (res.json() as Promise<ClassroomsListResponse>) : null))
      .then((data) => { if (data) setClassrooms(data.classrooms); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const qs = classroomId ? `?classroomId=${classroomId}` : '';
    fetch(`/api/teacher/challenges${qs}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ challenges: ClassChallengeSummary[] }>) : Promise.reject()))
      .then((data) => { if (active) { setChallenges(data.challenges); setError(''); } })
      .catch(() => { if (active) setError('Could not load challenges — check your connection and try again.'); });
    return () => { active = false; };
  }, [classroomId, reloadToken]);

  function reload() { setReloadToken((t) => t + 1); }

  async function cancelChallenge(id: string) {
    setCancelBusyId(id);
    try {
      await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
      reload();
    } finally {
      setCancelBusyId(null);
    }
  }

  const loading = challenges === null && !error;

  return (
    <div className="challenges-panel">
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
        <button type="button" className="teacher-add-student-button" disabled={classrooms.length === 0} onClick={() => setCreateOpen(true)}>+ Create Challenge</button>
      </div>

      {loading && <p className="student-detail-empty">Loading challenges…</p>}
      {error && <p className="student-detail-empty">{error}</p>}

      {!loading && !error && challenges && (
        challenges.length === 0 ? (
          <div className="teacher-empty teacher-empty-students">
            <span>🎯</span>
            <div>
              <strong>No class challenges yet.</strong>
              <p>Create one to get your class working together toward a shared goal — an activity count, a story goal, or class XP.</p>
            </div>
          </div>
        ) : (
          <div className="challenge-list">
            {challenges.map((c) => (
              <div key={c.id} className={`challenge-card challenge-card-${c.status}`}>
                <div className="challenge-card-head">
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.classroomName} · {GOAL_TYPE_LABEL[c.goalType]} · {fmtDate(c.startDate)} – {fmtDate(c.endDate)}</small>
                  </div>
                  <span className={`tsc-status challenge-status-${c.status}`}>{STATUS_LABEL[c.status]}</span>
                </div>

                {c.description && <p className="challenge-card-desc">{c.description}</p>}

                <div className="challenge-progress">
                  <i><b style={{ width: `${c.percentComplete}%` }} /></i>
                  <span>{c.progress} / {c.goalTarget} {GOAL_TYPE_UNIT[c.goalType]} · {c.percentComplete}% complete</span>
                </div>

                {c.status === 'completed' && <p className="challenge-complete-banner">🎉 Class Challenge Complete!{c.rewardType === 'xp' && c.rewardAmount > 0 ? ` Everyone who contributed earned ${c.rewardAmount} bonus XP.` : ''}</p>}

                <div className="challenge-stats-row">
                  <div><b>{c.participantsCount}/{c.totalStudents}</b><span>participating</span></div>
                  <div><b>{Math.max(0, c.remaining)}</b><span>{GOAL_TYPE_UNIT[c.goalType]} to go</span></div>
                  <div><b>{c.daysRemaining === null ? '—' : c.daysRemaining}</b><span>days left</span></div>
                </div>

                <button type="button" className="challenge-toggle" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  {expandedId === c.id ? 'Hide participation' : 'View participation'}
                </button>

                {expandedId === c.id && (
                  <ul className="challenge-participants">
                    {c.topParticipants.length === 0 ? (
                      <li className="student-detail-empty">No contributions yet.</li>
                    ) : (
                      c.topParticipants.map((p, i) => (
                        <li key={p.studentId}><span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.name}</span><b>{p.contribution} {GOAL_TYPE_UNIT[c.goalType]}</b></li>
                      ))
                    )}
                  </ul>
                )}

                {c.status === 'active' && (
                  <button type="button" className="student-detail-remove" disabled={cancelBusyId === c.id} onClick={() => cancelChallenge(c.id)}>
                    {cancelBusyId === c.id ? 'Cancelling…' : 'Cancel challenge'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {createOpen && (
        <CreateChallengeModal
          classrooms={classrooms}
          defaultClassroomId={classroomId || undefined}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); reload(); }}
        />
      )}
    </div>
  );
}
