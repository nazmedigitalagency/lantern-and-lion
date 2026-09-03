'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ClassroomCard,
  ClassroomDetailResponse,
  ClassroomsListResponse,
} from '../lib/classrooms/types';
import type { AssignmentBucket, AssignmentListItem } from '../lib/assignments/types';
import type { ClassActivityResponse, TimelineRange } from '../lib/timeline/types';
import StudentCard from './StudentCard';
import StudentDetailModal from './StudentDetailModal';
import CreateAssignmentModal from './CreateAssignmentModal';

const CLASS_ACTIVITY_RANGES: { value: TimelineRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const AGE_BAND_OPTIONS = ['Ages 5–7', 'Ages 8–11', 'Ages 13–16'];
const MEETING_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ASSIGNMENT_TABS: { value: AssignmentBucket; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'due_soon', label: 'Due soon' },
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
  const [assignmentTab, setAssignmentTab] = useState<AssignmentBucket>('active');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [manageOpen, setManageOpen] = useState(false);
  const [manageBusyId, setManageBusyId] = useState<string | null>(null);
  const [manageError, setManageError] = useState('');

  const [assignments, setAssignments] = useState<AssignmentListItem[] | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteAssignmentBusyId, setDeleteAssignmentBusyId] = useState<string | null>(null);

  const [activityRange, setActivityRange] = useState<TimelineRange>('week');
  const [classActivity, setClassActivity] = useState<ClassActivityResponse | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);

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

  function loadAssignments() {
    fetch(`/api/assignments?classroomId=${classroomId}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ assignments: AssignmentListItem[] }>) : null))
      .then((data) => { if (data) setAssignments(data.assignments); })
      .catch(() => {});
  }

  useEffect(() => {
    loadDetail();
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  function selectActivityRange(next: TimelineRange) {
    setActivityRange(next);
    setActivityLoading(true);
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/classrooms/${classroomId}/activity?range=${activityRange}`)
      .then((res) => (res.ok ? (res.json() as Promise<ClassActivityResponse>) : Promise.reject()))
      .then((d) => {
        if (active) {
          setClassActivity(d);
          setActivityLoading(false);
        }
      })
      .catch(() => {
        if (active) setActivityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [classroomId, activityRange]);

  const assignmentsByTab = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter((a) => a.status === 'assigned' && a.bucket === assignmentTab);
  }, [assignments, assignmentTab]);
  const liveAssignments = useMemo(() => (assignments || []).filter((a) => a.status === 'assigned'), [assignments]);

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

  async function deleteAssignment(assignmentId: string) {
    setDeleteAssignmentBusyId(assignmentId);
    try {
      await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' });
      loadAssignments();
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
          <button type="button" className="classroom-manage-button" onClick={() => setAssignOpen(true)}>+ Assign</button>
        </div>
        <div className="classroom-assignment-tabs">
          {ASSIGNMENT_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={assignmentTab === t.value ? 'active' : ''}
              onClick={() => setAssignmentTab(t.value)}
            >
              {t.label} ({liveAssignments.filter((a) => a.bucket === t.value).length})
            </button>
          ))}
        </div>
        {assignmentsByTab.length === 0 ? (
          <p className="student-detail-empty">
            {liveAssignments.length === 0 ? 'No assignments yet — assign a Bible story, lesson, or game to the class.' : `No ${assignmentTab.replace('_', ' ')} assignments.`}
          </p>
        ) : (
          <ul className="classroom-assignment-list">
            {assignmentsByTab.map((a) => (
              <li key={a.id}>
                <div className="classroom-assignment-info">
                  <strong>{a.title}</strong>
                  <small>{a.referenceLabel || 'Custom'}{a.dueDate ? ` · Due ${new Date(`${a.dueDate}T00:00:00`).toLocaleDateString()}` : ''}</small>
                </div>
                <div className="classroom-assignment-progress">
                  <i><b style={{ width: `${a.studentCount ? Math.round((a.completedCount / a.studentCount) * 100) : 0}%` }} /></i>
                  <span>{a.completedCount}/{a.studentCount} completed</span>
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
        <div className="classroom-section-head">
          <h2>Activity</h2>
          <div className="student-activity-filters">
            {CLASS_ACTIVITY_RANGES.map((opt) => (
              <button key={opt.value} type="button" className={activityRange === opt.value ? 'active' : ''} onClick={() => selectActivityRange(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {activityLoading || !classActivity ? (
          <p className="student-detail-empty">Loading activity…</p>
        ) : (
          <>
            <div className="student-activity-summary">
              <div><b>{classActivity.summary.studentsActiveCount}/{classActivity.summary.studentCount}</b><span>Active students</span></div>
              <div><b>{classActivity.summary.storiesCompletedCount}</b><span>Bible stories completed</span></div>
            </div>

            {classActivity.assignments.length > 0 && (
              <ul className="class-activity-assignments">
                {classActivity.assignments.map((a) => (
                  <li key={a.assignmentId}>
                    <strong>{a.title}</strong>
                    <p>
                      {a.completedCount} student{a.completedCount === 1 ? '' : 's'} completed it, {a.inProgressCount} currently working on it, {a.notStartedCount} haven&apos;t started.
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {classActivity.activity.length === 0 ? (
              <p className="student-detail-empty">No class activity in this time range.</p>
            ) : (
              <ul className="student-detail-activity classroom-activity-list">
                {classActivity.activity.map((item) => (
                  <li key={item.id}>
                    <time>{new Date(item.occurredAt).toLocaleDateString()}</time>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
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
        <CreateAssignmentModal
          defaultClassroomId={classroomId}
          lockClassroom
          onClose={() => setAssignOpen(false)}
          onCreated={loadAssignments}
        />
      )}
    </div>
  );
}
