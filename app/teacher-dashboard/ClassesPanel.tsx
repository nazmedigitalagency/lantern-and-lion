'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  AssignmentStatus,
  ClassroomCard,
  ClassroomDetailResponse,
  ClassroomsListResponse,
} from '../lib/classrooms/types';
import { STORY_CATALOG } from '../stories/catalog';
import { curriculumModules } from '../curriculum-data';
import StudentCard from './StudentCard';
import StudentDetailModal from './StudentDetailModal';

const AGE_BAND_OPTIONS = ['Ages 5–7', 'Ages 8–11', 'Ages 13–16'];
const MEETING_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ASSIGNMENT_TABS: { value: AssignmentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const LEADERBOARD_CATEGORIES: { key: keyof ClassroomDetailResponse['leaderboard']; title: string; emoji: string; blurb: string }[] = [
  { key: 'mostConsistent', title: 'Most Consistent', emoji: '📅', blurb: 'Active the most days this week' },
  { key: 'scriptureChampion', title: 'Scripture Champion', emoji: '📖', blurb: 'Most Bible stories completed' },
  { key: 'quizChampion', title: 'Quiz Champion', emoji: '🏆', blurb: 'Highest average performance' },
  { key: 'mostImproved', title: 'Most Improved', emoji: '📈', blurb: 'Longest run of correct answers right now' },
];

function formatMeeting(day: string | null, time: string | null): string | null {
  if (!day && !time) return null;
  if (day && time) return `${day}s at ${time}`;
  return day || time;
}

export default function ClassesPanel() {
  const [classrooms, setClassrooms] = useState<ClassroomCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createAgeBand, setCreateAgeBand] = useState('');
  const [createMeetingDay, setCreateMeetingDay] = useState('');
  const [createMeetingTime, setCreateMeetingTime] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');

  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  function refreshList() {
    fetch('/api/classrooms/list')
      .then((r) => (r.ok ? (r.json() as Promise<ClassroomsListResponse>) : null))
      .then((fresh) => { if (fresh) setClassrooms(fresh.classrooms); })
      .catch(() => {});
  }

  useEffect(() => {
    let alive = true;
    fetch('/api/classrooms/list')
      .then((res) => (res.ok ? (res.json() as Promise<ClassroomsListResponse>) : Promise.reject()))
      .then((data) => {
        if (alive) {
          setClassrooms(data.classrooms);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError('Could not load your classes — check your connection and try again.');
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, []);

  function openCreate() {
    setCreateOpen(true);
    setCreateName('');
    setCreateDescription('');
    setCreateAgeBand('');
    setCreateMeetingDay('');
    setCreateMeetingTime('');
    setCreateError('');
  }

  async function submitCreate() {
    if (!createName.trim()) return;
    setCreateBusy(true);
    setCreateError('');
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim() || undefined,
          ageBand: createAgeBand || undefined,
          meetingDay: createMeetingDay || undefined,
          meetingTime: createMeetingTime || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { classroom?: { id: string }; error?: string } | null;
      if (!res.ok || !data?.classroom) {
        setCreateError(data?.error || 'Could not create the class.');
        return;
      }
      setCreateOpen(false);
      refreshList();
      setSelectedClassroomId(data.classroom.id);
    } catch {
      setCreateError('Could not create the class. Check your connection and try again.');
    } finally {
      setCreateBusy(false);
    }
  }

  if (selectedClassroomId) {
    return (
      <ClassroomDetail
        classroomId={selectedClassroomId}
        onBack={() => {
          setSelectedClassroomId(null);
          refreshList();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="teacher-students-loading">
        <span></span>
        <p>Loading your classes…</p>
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
      <button type="button" className="teacher-add-student-button" onClick={openCreate}>+ Create Classroom</button>

      {(!classrooms || classrooms.length === 0) ? (
        <div className="teacher-empty teacher-empty-students">
          <span>🏫</span>
          <div>
            <strong>No classrooms yet.</strong>
            <p>Create your first classroom — Sunday School, Youth Bible Study, or whatever fits how you teach.</p>
          </div>
        </div>
      ) : (
        <div className="classroom-grid">
          {classrooms.map((c) => (
            <button key={c.id} className="classroom-card" onClick={() => setSelectedClassroomId(c.id)}>
              <div className="classroom-card-head">
                <strong>{c.name}</strong>
                {c.ageBand && <span className="classroom-card-age">{c.ageBand}</span>}
              </div>
              {c.description && <p className="classroom-card-desc">{c.description}</p>}
              <div className="classroom-card-stats">
                <div><b>{c.studentCount}</b><span>students</span></div>
                <div><b>{c.activeThisWeek}</b><span>active this week</span></div>
                <div><b>{c.avgAssignmentCompletion === null ? '—' : `${c.avgAssignmentCompletion}%`}</b><span>avg. completion</span></div>
                <div><b>{c.avgLearningActivity}%</b><span>learning activity</span></div>
              </div>
              {formatMeeting(c.meetingDay, c.meetingTime) && (
                <p className="classroom-card-meeting">🕐 {formatMeeting(c.meetingDay, c.meetingTime)}</p>
              )}
              {c.recentActivityPreview && <p className="classroom-card-activity">{c.recentActivityPreview}</p>}
            </button>
          ))}
        </div>
      )}

      {createOpen && (
        <div className="add-student-overlay" role="presentation" onClick={() => setCreateOpen(false)}>
          <section
            className="add-student-dialog classroom-create-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-classroom-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="student-detail-close" aria-label="Close" onClick={() => setCreateOpen(false)}>×</button>
            <h2 id="create-classroom-title">Create a classroom</h2>
            <label className="add-student-field">
              Classroom name
              <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Sunday School" maxLength={64} autoFocus />
            </label>
            <label className="add-student-field">
              Description <small>(optional)</small>
              <textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="What this class is about" maxLength={500} rows={2} />
            </label>
            <label className="add-student-field">
              Age group <small>(optional)</small>
              <select value={createAgeBand} onChange={(e) => setCreateAgeBand(e.target.value)}>
                <option value="">Not set</option>
                {AGE_BAND_OPTIONS.map((band) => <option key={band} value={band}>{band}</option>)}
              </select>
            </label>
            <div className="classroom-create-meeting">
              <label className="add-student-field">
                Meeting day <small>(optional)</small>
                <select value={createMeetingDay} onChange={(e) => setCreateMeetingDay(e.target.value)}>
                  <option value="">Not set</option>
                  {MEETING_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </label>
              <label className="add-student-field">
                Meeting time <small>(optional)</small>
                <input type="time" value={createMeetingTime} onChange={(e) => setCreateMeetingTime(e.target.value)} />
              </label>
            </div>
            {createError && <p className="add-student-error" role="alert">{createError}</p>}
            <button type="button" className="add-student-primary" disabled={createBusy || !createName.trim()} onClick={submitCreate}>
              {createBusy ? 'Creating…' : 'Create classroom'}
            </button>
          </section>
        </div>
      )}
    </>
  );
}

function ClassroomDetail({ classroomId, onBack }: { classroomId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<ClassroomDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignmentTab, setAssignmentTab] = useState<AssignmentStatus>('active');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [manageOpen, setManageOpen] = useState(false);
  const [manageBusyId, setManageBusyId] = useState<string | null>(null);
  const [manageError, setManageError] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignType, setAssignType] = useState<'story' | 'concept'>('story');
  const [assignReferenceId, setAssignReferenceId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [deleteAssignmentBusyId, setDeleteAssignmentBusyId] = useState<string | null>(null);

  function loadDetail() {
    fetch(`/api/classrooms/${classroomId}`)
      .then((res) => (res.ok ? (res.json() as Promise<ClassroomDetailResponse>) : Promise.reject()))
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load this classroom.');
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  const assignmentsByTab = useMemo(() => {
    if (!detail) return [];
    return detail.assignments.filter((a) => a.status === assignmentTab);
  }, [detail, assignmentTab]);

  async function addExistingStudent(childId: string) {
    setManageBusyId(childId);
    setManageError('');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setManageError(data?.error || 'Could not add this student.');
        return;
      }
      loadDetail();
    } catch {
      setManageError('Could not add this student. Check your connection and try again.');
    } finally {
      setManageBusyId(null);
    }
  }

  function openAssign() {
    setAssignOpen(true);
    setAssignType('story');
    setAssignReferenceId(STORY_CATALOG[0]?.id || '');
    setAssignTitle(STORY_CATALOG[0]?.title || '');
    setAssignDescription('');
    setAssignDueDate('');
    setAssignError('');
  }

  async function submitAssignment() {
    if (!assignTitle.trim() || !assignReferenceId) return;
    setAssignBusy(true);
    setAssignError('');
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignTitle.trim(),
          description: assignDescription.trim() || undefined,
          assignmentType: assignType,
          referenceId: assignReferenceId,
          dueDate: assignDueDate || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setAssignError(data?.error || 'Could not create the assignment.');
        return;
      }
      setAssignOpen(false);
      loadDetail();
    } catch {
      setAssignError('Could not create the assignment. Check your connection and try again.');
    } finally {
      setAssignBusy(false);
    }
  }

  async function deleteAssignment(assignmentId: string) {
    setDeleteAssignmentBusyId(assignmentId);
    try {
      await fetch(`/api/classrooms/${classroomId}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });
      loadDetail();
    } finally {
      setDeleteAssignmentBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="teacher-students-loading">
        <span></span>
        <p>Loading classroom…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="teacher-empty">
        <span>!</span>
        <div><strong>{error || 'Classroom not found.'}</strong></div>
      </div>
    );
  }

  const meeting = formatMeeting(detail.classroom.meetingDay, detail.classroom.meetingTime);

  return (
    <div className="classroom-detail">
      <button type="button" className="classroom-back" onClick={onBack}>← Back to Classes</button>

      <header className="classroom-detail-head">
        <div>
          <h1>{detail.classroom.name}</h1>
          {detail.classroom.description && <p className="classroom-detail-desc">{detail.classroom.description}</p>}
          <p className="classroom-detail-meta">
            Taught by you{detail.classroom.ageBand ? ` · ${detail.classroom.ageBand}` : ''}{meeting ? ` · ${meeting}` : ''} · Join code <strong>{detail.classroom.code}</strong>
          </p>
        </div>
      </header>

      <div className="classroom-detail-stats">
        <div><b>{detail.stats.studentCount}</b><span>Students</span></div>
        <div><b>{detail.stats.activeThisWeek}</b><span>Active this week</span></div>
        <div><b>{detail.stats.assignmentsCompletedPercent === null ? '—' : `${detail.stats.assignmentsCompletedPercent}%`}</b><span>Assignments completed</span></div>
        <div><b>{detail.stats.avgPerformance}%</b><span>Avg. performance</span></div>
        <div><b>{detail.stats.avgLearningActivity}%</b><span>Learning activity</span></div>
      </div>

      <section className="classroom-detail-section">
        <div className="classroom-section-head">
          <h2>Students</h2>
          <button type="button" className="classroom-manage-button" onClick={() => { setManageOpen(true); setManageError(''); }}>Manage Students</button>
        </div>
        {detail.students.length === 0 ? (
          <p className="student-detail-empty">No students in this class yet. Use Manage Students to add someone already connected to you, or share the join code above.</p>
        ) : (
          <div className="teacher-students-grid">
            {detail.students.map((s) => (
              <StudentCard key={s.id} student={s} onClick={() => setSelectedStudentId(s.id)} showClasses={false} />
            ))}
          </div>
        )}
        {detail.pending.length > 0 && (
          <div className="tsp-list classroom-pending-list">
            {detail.pending.map((p) => (
              <div key={p.id} className="tsp-row">
                <span>{p.name[0]}</span>
                <div><strong>{p.name}</strong><small>Waiting on parent approval</small></div>
                <em>Pending</em>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="classroom-detail-section">
        <div className="classroom-section-head">
          <h2>Assignments</h2>
          <button type="button" className="classroom-manage-button" onClick={openAssign}>+ Assign</button>
        </div>
        <div className="classroom-assignment-tabs">
          {ASSIGNMENT_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={assignmentTab === t.value ? 'active' : ''}
              onClick={() => setAssignmentTab(t.value)}
            >
              {t.label} ({detail.assignments.filter((a) => a.status === t.value).length})
            </button>
          ))}
        </div>
        {assignmentsByTab.length === 0 ? (
          <p className="student-detail-empty">
            {detail.assignments.length === 0 ? 'No assignments yet — assign a Bible story or lesson to the class.' : `No ${assignmentTab} assignments.`}
          </p>
        ) : (
          <ul className="classroom-assignment-list">
            {assignmentsByTab.map((a) => (
              <li key={a.id}>
                <div className="classroom-assignment-info">
                  <strong>{a.title}</strong>
                  <small>{a.referenceLabel}{a.dueDate ? ` · Due ${new Date(`${a.dueDate}T00:00:00`).toLocaleDateString()}` : ''}</small>
                </div>
                <div className="classroom-assignment-progress">
                  <i><b style={{ width: `${a.completionPercent}%` }} /></i>
                  <span>{a.completedCount}/{a.totalStudents} completed</span>
                </div>
                <button type="button" className="student-detail-remove" disabled={deleteAssignmentBusyId === a.id} onClick={() => deleteAssignment(a.id)}>
                  {deleteAssignmentBusyId === a.id ? 'Removing…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="classroom-detail-section">
        <h2>Class activity</h2>
        {detail.activity.length === 0 ? (
          <p className="student-detail-empty">No class activity yet this week.</p>
        ) : (
          <ul className="student-detail-activity classroom-activity-list">
            {detail.activity.map((item) => (
              <li key={item.id}>
                <time>{new Date(item.occurredAt).toLocaleDateString()}</time>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="classroom-detail-section">
        <h2>Leaderboard</h2>
        <div className="classroom-leaderboard-grid">
          {LEADERBOARD_CATEGORIES.map((cat) => {
            const entries = detail.leaderboard[cat.key];
            return (
              <div key={cat.key} className="classroom-leaderboard-card">
                <p className="classroom-leaderboard-title">{cat.emoji} {cat.title}</p>
                <small>{cat.blurb}</small>
                {entries.length === 0 ? (
                  <p className="student-detail-empty">Not enough activity yet.</p>
                ) : (
                  <ol>
                    {entries.map((e) => (
                      <li key={e.studentId}><span>{e.name}</span><b>{e.value} {e.unit}</b></li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {selectedStudentId && (
        <StudentDetailModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} onRemoved={loadDetail} />
      )}

      {manageOpen && (
        <div className="add-student-overlay" role="presentation" onClick={() => setManageOpen(false)}>
          <section className="add-student-dialog classroom-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="manage-students-title" onClick={(e) => e.stopPropagation()}>
            <button className="student-detail-close" aria-label="Close" onClick={() => setManageOpen(false)}>×</button>
            <h2 id="manage-students-title">Add Students</h2>
            <p>Students already connected to you, not yet in this class.</p>
            {manageError && <p className="add-student-error" role="alert">{manageError}</p>}
            {detail.connectedElsewhere.length === 0 ? (
              <p className="student-detail-empty">Every student connected to you is already in this class. Use + Add Student on My Students to connect someone new.</p>
            ) : (
              <ul className="classroom-manage-list">
                {detail.connectedElsewhere.map((s) => (
                  <li key={s.id}>
                    <span>{s.name}</span>
                    <small>{s.ageGroup === 'teen' ? 'Teen' : 'Child'}</small>
                    <button type="button" disabled={manageBusyId === s.id} onClick={() => addExistingStudent(s.id)}>
                      {manageBusyId === s.id ? 'Adding…' : 'Add'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {assignOpen && (
        <div className="add-student-overlay" role="presentation" onClick={() => setAssignOpen(false)}>
          <section className="add-student-dialog classroom-create-dialog" role="dialog" aria-modal="true" aria-labelledby="assign-title" onClick={(e) => e.stopPropagation()}>
            <button className="student-detail-close" aria-label="Close" onClick={() => setAssignOpen(false)}>×</button>
            <h2 id="assign-title">Assign to class</h2>
            <label className="add-student-field">
              Content type
              <select
                value={assignType}
                onChange={(e) => {
                  const type = e.target.value as 'story' | 'concept';
                  setAssignType(type);
                  const first = type === 'story' ? STORY_CATALOG[0] : curriculumModules[0];
                  setAssignReferenceId(first?.id || '');
                  setAssignTitle(first?.title || '');
                }}
              >
                <option value="story">Interactive Bible story</option>
                <option value="concept">Bible lesson</option>
              </select>
            </label>
            <label className="add-student-field">
              {assignType === 'story' ? 'Story' : 'Lesson'}
              <select
                value={assignReferenceId}
                onChange={(e) => {
                  setAssignReferenceId(e.target.value);
                  const found = assignType === 'story' ? STORY_CATALOG.find((s) => s.id === e.target.value) : curriculumModules.find((m) => m.id === e.target.value);
                  if (found) setAssignTitle(found.title);
                }}
              >
                {assignType === 'story'
                  ? STORY_CATALOG.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)
                  : curriculumModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </label>
            <label className="add-student-field">
              Title
              <input type="text" value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} maxLength={120} />
            </label>
            <label className="add-student-field">
              Notes <small>(optional)</small>
              <textarea value={assignDescription} onChange={(e) => setAssignDescription(e.target.value)} rows={2} maxLength={500} />
            </label>
            <label className="add-student-field">
              Due date <small>(optional)</small>
              <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} />
            </label>
            {assignError && <p className="add-student-error" role="alert">{assignError}</p>}
            <button type="button" className="add-student-primary" disabled={assignBusy || !assignTitle.trim()} onClick={submitAssignment}>
              {assignBusy ? 'Assigning…' : 'Assign to class'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
