'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StudentsRosterResponse } from '../lib/classrooms/types';

type Classroom = { id: string; name: string };

/**
 * Turns a draft into a live assignment. A classroom-targeted draft already has its
 * classroom_id stored, so this just confirms and publishes; a student-targeted draft
 * never persisted its roster (drafts don't create submission rows), so the teacher
 * re-picks who it goes to here — same targeting UI as Create Assignment.
 */
export default function PublishAssignmentModal({
  assignmentId,
  defaultClassroomId,
  onClose,
  onPublished,
}: {
  assignmentId: string;
  defaultClassroomId: string | null;
  onClose: () => void;
  onPublished: () => void;
}) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; classroomIds: string[] }[]>([]);
  const [classroomId, setClassroomId] = useState(defaultClassroomId || '');
  const [targetMode, setTargetMode] = useState<'classroom' | 'students'>('classroom');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/classrooms').then((r) => (r.ok ? (r.json() as Promise<{ classrooms?: Classroom[] }>) : null)).then((data) => {
      if (data?.classrooms) {
        setClassrooms(data.classrooms);
        if (!defaultClassroomId && data.classrooms[0]) setClassroomId(data.classrooms[0].id);
      }
    }).catch(() => {});
    fetch('/api/teacher/students').then((r) => (r.ok ? (r.json() as Promise<StudentsRosterResponse>) : null)).then((data) => {
      if (data?.students) setStudents(data.students.map((s) => ({ id: s.id, name: s.name, classroomIds: s.classrooms.map((c) => c.id) })));
    }).catch(() => {});
  }, [defaultClassroomId]);

  const eligibleStudents = useMemo(
    () => (targetMode === 'students' && classroomId ? students.filter((s) => s.classroomIds.includes(classroomId)) : students),
    [students, targetMode, classroomId]
  );

  const canPublish = targetMode === 'classroom' ? Boolean(classroomId) : selectedStudentIds.length > 0;

  function toggleStudent(id: string) {
    setSelectedStudentIds((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));
  }

  async function publish() {
    if (!canPublish) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: targetMode === 'classroom' ? classroomId : undefined,
          studentIds: targetMode === 'students' ? selectedStudentIds : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not publish this assignment.');
        return;
      }
      onPublished();
    } catch {
      setError('Could not publish this assignment. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-student-overlay" role="presentation" onClick={onClose}>
      <section className="add-student-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-assignment-title" onClick={(e) => e.stopPropagation()}>
        <button className="student-detail-close" aria-label="Close" onClick={onClose}>×</button>
        <h2 id="publish-assignment-title">Publish this assignment</h2>
        <p className="add-student-note">Students will see it in their assignments as soon as it goes live.</p>

        <div className="add-student-field">
          Assign to
          <div className="assign-target-toggle">
            <button type="button" className={targetMode === 'classroom' ? 'active' : ''} onClick={() => setTargetMode('classroom')}>Entire classroom</button>
            <button type="button" className={targetMode === 'students' ? 'active' : ''} onClick={() => setTargetMode('students')}>Selected students</button>
          </div>
        </div>

        {targetMode === 'classroom' ? (
          <label className="add-student-field">
            Classroom
            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
              {classrooms.length === 0 && <option value="">No classes yet</option>}
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        ) : (
          <div className="add-student-field">
            Students
            {eligibleStudents.length === 0 ? (
              <p className="student-detail-empty">No connected students yet.</p>
            ) : (
              <div className="assign-student-picker">
                {eligibleStudents.map((s) => (
                  <label key={s.id} className="assign-student-option">
                    <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="add-student-error" role="alert">{error}</p>}
        <div className="add-student-actions">
          <button type="button" className="add-student-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="add-student-primary" disabled={busy || !canPublish} onClick={publish}>
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </section>
    </div>
  );
}
