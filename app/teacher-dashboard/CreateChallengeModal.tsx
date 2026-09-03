'use client';

import { useState } from 'react';
import type { ClassroomCard } from '../lib/classrooms/types';
import { GOAL_TYPE_LABEL, type ChallengeGoalType } from '../lib/challenges/types';

const GOAL_TYPES: ChallengeGoalType[] = ['activities', 'stories', 'lessons', 'xp'];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function inAWeek(): string {
  return new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
}

export default function CreateChallengeModal({ classrooms, defaultClassroomId, onClose, onCreated }: { classrooms: ClassroomCard[]; defaultClassroomId?: string; onClose: () => void; onCreated: () => void }) {
  const [classroomId, setClassroomId] = useState(defaultClassroomId || classrooms[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<ChallengeGoalType>('activities');
  const [goalTarget, setGoalTarget] = useState('100');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(inAWeek());
  const [rewardType, setRewardType] = useState<'xp' | 'none'>('none');
  const [rewardAmount, setRewardAmount] = useState('50');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!classroomId || !name.trim() || !goalTarget) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          name: name.trim(),
          description: description.trim() || undefined,
          goalType,
          goalTarget: Number(goalTarget),
          startDate,
          endDate,
          rewardType,
          rewardAmount: rewardType === 'xp' ? Number(rewardAmount) || 0 : 0,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not create this challenge.');
        return;
      }
      onCreated();
    } catch {
      setError('Could not create this challenge. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-student-overlay" role="presentation" onClick={onClose}>
      <section className="add-student-dialog classroom-create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-challenge-title" onClick={(e) => e.stopPropagation()}>
        <button className="student-detail-close" aria-label="Close" onClick={onClose}>×</button>
        <h2 id="create-challenge-title">Create a class challenge</h2>

        <label className="add-student-field">
          Classroom
          <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="add-student-field">
          Challenge name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Complete 100 Bible Activities This Week" maxLength={120} autoFocus />
        </label>

        <label className="add-student-field">
          Description <small>(optional)</small>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} placeholder="Let's work together to..." />
        </label>

        <div className="classroom-create-meeting">
          <label className="add-student-field">
            Eligible activity
            <select value={goalType} onChange={(e) => setGoalType(e.target.value as ChallengeGoalType)}>
              {GOAL_TYPES.map((g) => <option key={g} value={g}>{GOAL_TYPE_LABEL[g]}</option>)}
            </select>
          </label>
          <label className="add-student-field">
            Goal
            <input type="number" min={1} max={1_000_000} value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
          </label>
        </div>

        <div className="classroom-create-meeting">
          <label className="add-student-field">
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="add-student-field">
            End date
            <input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        <div className="classroom-create-meeting">
          <label className="add-student-field">
            Reward
            <select value={rewardType} onChange={(e) => setRewardType(e.target.value as 'xp' | 'none')}>
              <option value="none">Recognition only — no reward</option>
              <option value="xp">Bonus XP for everyone who contributes</option>
            </select>
          </label>
          {rewardType === 'xp' && (
            <label className="add-student-field">
              XP amount
              <input type="number" min={0} max={100000} value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} />
            </label>
          )}
        </div>

        {error && <p className="add-student-error" role="alert">{error}</p>}
        <button type="button" className="add-student-primary" disabled={busy || !classroomId || !name.trim()} onClick={submit}>
          {busy ? 'Creating…' : 'Start challenge'}
        </button>
      </section>
    </div>
  );
}
