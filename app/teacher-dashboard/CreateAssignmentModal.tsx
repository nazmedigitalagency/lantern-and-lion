'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AssignmentType } from '../lib/assignments/types';
import { assignableConcepts, assignableGames, assignableStories } from '../lib/assignments/content';
import type { StudentsRosterResponse } from '../lib/classrooms/types';

const TYPE_OPTIONS: { value: AssignmentType; label: string; hint: string }[] = [
  { value: 'story', label: 'Interactive Story', hint: 'A full branching Bible story' },
  { value: 'reading', label: 'Bible Reading', hint: 'A curriculum lesson, read through' },
  { value: 'quiz', label: 'Bible Quiz', hint: 'A curriculum lesson, practiced and scored' },
  { value: 'memory', label: 'Scripture Memory', hint: 'A curriculum lesson, memorized' },
  { value: 'game', label: 'Game Challenge', hint: 'One of the auto-scored arcade games' },
  { value: 'written', label: 'Written Response', hint: 'Student types an answer — you grade it' },
  { value: 'custom', label: 'Custom Assignment', hint: 'Anything else — student marks it done' },
];

type Classroom = { id: string; name: string };

export default function CreateAssignmentModal({
  defaultClassroomId,
  lockClassroom,
  onClose,
  onCreated,
}: {
  defaultClassroomId?: string;
  lockClassroom?: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; classroomIds: string[] }[]>([]);

  const [type, setType] = useState<AssignmentType>('story');
  const [referenceId, setReferenceId] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [classroomId, setClassroomId] = useState(defaultClassroomId || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetMode, setTargetMode] = useState<'classroom' | 'students'>(defaultClassroomId ? 'classroom' : 'classroom');
  const [dueDate, setDueDate] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [requiredScore, setRequiredScore] = useState('');
  const [xpReward, setXpReward] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<'draft' | 'assigned' | null>(null);

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

  const contentOptions = useMemo(() => {
    if (type === 'story') return assignableStories();
    if (type === 'reading' || type === 'quiz' || type === 'memory') return assignableConcepts();
    if (type === 'game') return assignableGames();
    return [];
  }, [type]);

  useEffect(() => {
    if (contentOptions.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- switching to written/custom clears the dependent content picker
      setReferenceId('');
      return;
    }
    setReferenceId(contentOptions[0].id);
    if (!title.trim() || TYPE_OPTIONS.some((t) => t.label === title)) setTitle(contentOptions[0].label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const needsContent = type !== 'written' && type !== 'custom';
  const selectedContentLabel = contentOptions.find((c) => c.id === referenceId)?.label || '';
  const classroomName = classrooms.find((c) => c.id === classroomId)?.name || '';
  const eligibleStudents = targetMode === 'students' && classroomId ? students.filter((s) => s.classroomIds.includes(classroomId)) : students;

  const canSubmit = title.trim().length > 0 && (!needsContent || Boolean(referenceId)) && (targetMode === 'classroom' ? Boolean(classroomId) : selectedStudentIds.length > 0);

  function toggleStudent(id: string) {
    setSelectedStudentIds((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));
  }

  async function submit(publish: boolean) {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim() || undefined,
          assignmentType: type,
          referenceId: needsContent ? referenceId : undefined,
          classroomId: targetMode === 'classroom' ? classroomId : undefined,
          studentIds: targetMode === 'students' ? selectedStudentIds : undefined,
          dueDate: dueDate || undefined,
          timeLimitMinutes: timeLimit ? Number(timeLimit) : undefined,
          requiredScore: requiredScore ? Number(requiredScore) : undefined,
          xpReward: xpReward ? Number(xpReward) : undefined,
          publish,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not create the assignment.');
        return;
      }
      setSuccess(publish ? 'assigned' : 'draft');
      onCreated();
    } catch {
      setError('Could not create the assignment. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-student-overlay" role="presentation" onClick={onClose}>
      <section className="add-student-dialog create-assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="create-assignment-title" onClick={(e) => e.stopPropagation()}>
        <button className="student-detail-close" aria-label="Close" onClick={onClose}>×</button>

        {success ? (
          <>
            <span className="add-student-success-mark">✓</span>
            <h2 id="create-assignment-title">{success === 'assigned' ? 'Assignment sent.' : 'Draft saved.'}</h2>
            <p className="add-student-note">{success === 'assigned' ? 'Students will see it in their assignments now.' : 'Find it under Drafts whenever you’re ready to assign it.'}</p>
            <button type="button" className="add-student-primary" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <h2 id="create-assignment-title">Create Assignment</h2>

            <label className="add-student-field">
              Assignment type
              <select value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <small>{TYPE_OPTIONS.find((t) => t.value === type)?.hint}</small>
            </label>

            {needsContent && (
              <label className="add-student-field">
                {type === 'story' ? 'Story' : type === 'game' ? 'Game' : 'Lesson'}
                <select value={referenceId} onChange={(e) => { setReferenceId(e.target.value); const found = contentOptions.find((c) => c.id === e.target.value); if (found && (!title.trim() || TYPE_OPTIONS.some((t) => t.label === title))) setTitle(found.label); }}>
                  {contentOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
            )}

            <label className="add-student-field">
              Title
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </label>

            <label className="add-student-field">
              Instructions <small>(optional)</small>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} maxLength={2000} placeholder="What should students do?" />
            </label>

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
                <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} disabled={lockClassroom}>
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

            <div className="classroom-create-meeting">
              <label className="add-student-field">
                Due date <small>(optional)</small>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
              <label className="add-student-field">
                Time limit (minutes) <small>(optional)</small>
                <input type="number" min={1} max={600} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </label>
            </div>
            <div className="classroom-create-meeting">
              <label className="add-student-field">
                Required score % <small>(optional)</small>
                <input type="number" min={0} max={100} value={requiredScore} onChange={(e) => setRequiredScore(e.target.value)} />
              </label>
              <label className="add-student-field">
                XP reward <small>(optional)</small>
                <input type="number" min={0} max={2000} value={xpReward} onChange={(e) => setXpReward(e.target.value)} />
              </label>
            </div>

            <div className="assign-preview">
              <p className="teacher-kicker">Preview</p>
              <strong>{title || 'Untitled assignment'}</strong>
              {instructions && <p>{instructions}</p>}
              <ul>
                {needsContent && <li>{TYPE_OPTIONS.find((t) => t.value === type)?.label}: {selectedContentLabel || 'Choose content'}</li>}
                <li>To: {targetMode === 'classroom' ? (classroomName || 'Choose a classroom') : `${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? '' : 's'}`}</li>
                <li>Due: {dueDate ? new Date(`${dueDate}T00:00:00`).toLocaleDateString() : 'No due date'}</li>
                {requiredScore && <li>Required score: {requiredScore}%</li>}
                {xpReward && <li>Reward: {xpReward} XP</li>}
              </ul>
            </div>

            {error && <p className="add-student-error" role="alert">{error}</p>}

            <div className="add-student-actions">
              <button type="button" className="add-student-secondary" disabled={busy || !canSubmit} onClick={() => submit(false)}>
                {busy ? 'Saving…' : 'Save Draft'}
              </button>
              <button type="button" className="add-student-primary" disabled={busy || !canSubmit} onClick={() => submit(true)}>
                {busy ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
