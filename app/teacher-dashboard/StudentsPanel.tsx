'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ActivityStatus,
  AddStudentErrorResponse,
  AddStudentResponse,
  AgeGroup,
  StudentClassroomRef,
  StudentLookupResponse,
  StudentsRosterResponse,
} from '../lib/classrooms/types';
import StudentCard from './StudentCard';
import StudentDetailModal from './StudentDetailModal';

type SortKey = 'name' | 'most_active' | 'least_active' | 'xp_high' | 'xp_low' | 'performance_high' | 'performance_low' | 'recent_activity';
type AddStep = 'form' | 'confirm' | 'success';
type ConnectionTab = 'all' | 'approved' | 'pending' | 'declined' | 'revoked';

// Purely cosmetic mapping for the "student avatar" shown during Add Student
// confirmation — same four badge ids a family already picks from during
// setup (app/family-setup), just re-tinted to the Teacher Dashboard palette.
const AVATAR_BADGE: Record<string, { mark: string; tone: string }> = {
  lion: { mark: 'L', tone: 'var(--gold)' },
  lantern: { mark: 'B', tone: 'var(--purple)' },
  dove: { mark: 'P', tone: 'var(--blue)' },
  star: { mark: 'S', tone: 'var(--green)' },
};
function avatarBadge(avatar: string) {
  return AVATAR_BADGE[avatar] || { mark: '★', tone: 'var(--slate)' };
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'recent_activity', label: 'Most recent activity' },
  { value: 'most_active', label: 'Most active this week' },
  { value: 'least_active', label: 'Least active this week' },
  { value: 'xp_high', label: 'Highest XP' },
  { value: 'xp_low', label: 'Lowest XP' },
  { value: 'performance_high', label: 'Highest performance' },
  { value: 'performance_low', label: 'Lowest performance' },
];

export default function StudentsPanel({ onGoToClasses }: { onGoToClasses: () => void }) {
  const [roster, setRoster] = useState<StudentsRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<AddStep>('form');
  const [addClassroomId, setAddClassroomId] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');
  const [addLookup, setAddLookup] = useState<StudentLookupResponse | null>(null);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState<'all' | AgeGroup>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityStatus>('all');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('name');
  const [statusFilter, setStatusFilter] = useState<ConnectionTab>('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/teacher/students')
      .then((res) => (res.ok ? (res.json() as Promise<StudentsRosterResponse>) : Promise.reject()))
      .then((data) => {
        if (alive) {
          setRoster(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError('Could not load your students — check your connection and try again.');
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (roster && roster.classrooms.length > 0 && !addClassroomId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- defaults the picker once, from freshly-loaded roster data
      setAddClassroomId(roster.classrooms[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster]);

  const attentionCount = roster?.students.filter((s) => s.needsAttention).length || 0;

  const filtered = useMemo(() => {
    if (!roster) return [];
    let list = roster.students;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q));
    if (classFilter !== 'all') list = list.filter((s) => s.classrooms.some((c) => c.id === classFilter));
    if (ageFilter !== 'all') list = list.filter((s) => s.ageGroup === ageFilter);
    if (activityFilter !== 'all') list = list.filter((s) => s.activityStatus === activityFilter);
    if (attentionOnly) list = list.filter((s) => s.needsAttention);

    const sorted = [...list];
    switch (sort) {
      case 'most_active': sorted.sort((a, b) => b.weeklyActiveDays - a.weeklyActiveDays); break;
      case 'least_active': sorted.sort((a, b) => a.weeklyActiveDays - b.weeklyActiveDays); break;
      case 'xp_high': sorted.sort((a, b) => b.xp - a.xp); break;
      case 'xp_low': sorted.sort((a, b) => a.xp - b.xp); break;
      case 'performance_high': sorted.sort((a, b) => b.masteryPercent - a.masteryPercent); break;
      case 'performance_low': sorted.sort((a, b) => a.masteryPercent - b.masteryPercent); break;
      case 'recent_activity': sorted.sort((a, b) => new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime()); break;
      default: sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [roster, search, classFilter, ageFilter, activityFilter, attentionOnly, sort]);

  const hasActiveFilters = Boolean(search.trim()) || classFilter !== 'all' || ageFilter !== 'all' || activityFilter !== 'all' || attentionOnly;

  function clearFilters() {
    setSearch('');
    setClassFilter('all');
    setAgeFilter('all');
    setActivityFilter('all');
    setAttentionOnly(false);
  }

  function refreshRoster() {
    fetch('/api/teacher/students')
      .then((r) => (r.ok ? (r.json() as Promise<StudentsRosterResponse>) : null))
      .then((fresh) => { if (fresh) setRoster(fresh); })
      .catch(() => {});
  }

  function openAddModal() {
    setAddOpen(true);
    setAddStep('form');
    setAddCode('');
    setAddError('');
    setAddLookup(null);
  }

  function closeAddModal() {
    setAddOpen(false);
  }

  function backToCode() {
    setAddStep('form');
    setAddLookup(null);
    setAddError('');
  }

  function addAnotherStudent() {
    setAddStep('form');
    setAddCode('');
    setAddLookup(null);
    setAddError('');
  }

  async function findStudent() {
    if (!addClassroomId || !addCode.trim()) return;
    setAddBusy(true);
    setAddError('');
    try {
      const res = await fetch('/api/teacher/students/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherCode: addCode.trim(), classroomId: addClassroomId }),
      });
      const data = (await res.json().catch(() => null)) as (StudentLookupResponse & { error?: string }) | null;
      if (!res.ok || !data) {
        setAddError(data?.error || 'Could not look up that code.');
        return;
      }
      setAddLookup(data);
      setAddStep('confirm');
    } catch {
      setAddError('Could not look up that code. Check your connection and try again.');
    } finally {
      setAddBusy(false);
    }
  }

  async function sendConnectionRequest() {
    if (!addLookup || !addClassroomId) return;
    setAddBusy(true);
    setAddError('');
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherCode: addCode.trim(), classroomId: addClassroomId }),
      });
      const data = (await res.json().catch(() => null)) as (AddStudentResponse & Partial<AddStudentErrorResponse>) | null;
      if (!res.ok || !data?.success) {
        setAddError(data?.error || 'Could not send the connection request.');
        return;
      }
      setAddStep('success');
      refreshRoster();
    } catch {
      setAddError('Could not send the connection request. Check your connection and try again.');
    } finally {
      setAddBusy(false);
    }
  }

  function renderAddButton(classrooms: StudentClassroomRef[]) {
    if (classrooms.length === 0) return null;
    return (
      <button type="button" className="teacher-add-student-button" onClick={openAddModal}>
        + Add Student
      </button>
    );
  }

  function renderAddModal() {
    if (!addOpen || !roster) return null;
    const badge = addLookup ? avatarBadge(addLookup.student.avatar) : null;
    return (
      <div className="add-student-overlay" role="presentation" onClick={closeAddModal}>
        <section
          className="add-student-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="student-detail-close" aria-label="Close" onClick={closeAddModal}>×</button>

          {addStep === 'form' && (
            <>
              <h2 id="add-student-title">Add a student</h2>
              <p>Ask your student to share their Lantern &amp; Lion Teacher Code.</p>
              <label className="add-student-field">
                Class
                <select value={addClassroomId} onChange={(e) => setAddClassroomId(e.target.value)} aria-label="Class to add this student to">
                  {roster.classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="add-student-field">
                Teacher Code
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value)}
                  placeholder="LNL-TCH-XXXXXX"
                  aria-label="Student's Teacher Code"
                  maxLength={32}
                  autoFocus
                />
              </label>
              {addError && <p className="add-student-error" role="alert">{addError}</p>}
              <button type="button" className="add-student-primary" disabled={addBusy || !addCode.trim()} onClick={findStudent}>
                {addBusy ? 'Looking…' : 'Find Student'}
              </button>
            </>
          )}

          {addStep === 'confirm' && addLookup && badge && (
            <>
              {(addLookup.connection === 'none' || addLookup.connection === 'declined' || addLookup.connection === 'revoked' || addLookup.connection === 'removed') && (
                <>
                  <h2 id="add-student-title">Is this the student you&apos;re trying to add?</h2>
                  <div className="add-student-preview">
                    <span className="add-student-avatar" style={{ background: badge.tone }}>{badge.mark}</span>
                    <strong>{addLookup.student.name}</strong>
                    <small>{addLookup.student.ageGroup === 'teen' ? 'Teen' : 'Child'}</small>
                  </div>
                  <p className="add-student-note">
                    Adding to <strong>{addLookup.classroom.name}</strong>.
                    {addLookup.connection === 'declined' && ' (Previously declined by parent).'}
                    {addLookup.connection === 'revoked' && ' (Previously revoked by parent).'}
                    {addLookup.connection === 'removed' && ' (Previously removed from class).'}
                    {' '}Their parent must approve before you can see any learning data.
                  </p>
                  {addError && <p className="add-student-error" role="alert">{addError}</p>}
                  <div className="add-student-actions">
                    <button type="button" className="add-student-secondary" onClick={backToCode}>Back</button>
                    <button type="button" className="add-student-primary" disabled={addBusy} onClick={sendConnectionRequest}>
                      {addBusy ? 'Sending…' : 'Send Connection Request'}
                    </button>
                  </div>
                </>
              )}
              {addLookup.connection === 'approved' && (
                <>
                  <h2 id="add-student-title">Already connected</h2>
                  <div className="add-student-preview">
                    <span className="add-student-avatar" style={{ background: badge.tone }}>{badge.mark}</span>
                    <strong>{addLookup.student.name}</strong>
                    <small>{addLookup.student.ageGroup === 'teen' ? 'Teen' : 'Child'}</small>
                  </div>
                  <p className="add-student-note">This student is already connected to your classroom.</p>
                  <div className="add-student-actions">
                    <button type="button" className="add-student-secondary" onClick={backToCode}>Try another code</button>
                    <button type="button" className="add-student-primary" onClick={closeAddModal}>Done</button>
                  </div>
                </>
              )}
              {addLookup.connection === 'pending' && (
                <>
                  <h2 id="add-student-title">Connection request pending</h2>
                  <div className="add-student-preview">
                    <span className="add-student-avatar" style={{ background: badge.tone }}>{badge.mark}</span>
                    <strong>{addLookup.student.name}</strong>
                    <small>{addLookup.student.ageGroup === 'teen' ? 'Teen' : 'Child'}</small>
                  </div>
                  <p className="add-student-note">A request is already waiting on their parent&apos;s approval.</p>
                  <div className="add-student-actions">
                    <button type="button" className="add-student-secondary" onClick={backToCode}>Try another code</button>
                    <button type="button" className="add-student-primary" onClick={closeAddModal}>Done</button>
                  </div>
                </>
              )}
            </>
          )}

          {addStep === 'success' && (
            <>
              <span className="add-student-success-mark">✓</span>
              <h2 id="add-student-title">Connection request sent.</h2>
              <p className="add-student-note">{addLookup?.student.name} will appear in Pending approval until their parent approves the request.</p>
              <div className="add-student-actions">
                <button type="button" className="add-student-secondary" onClick={addAnotherStudent}>Add another</button>
                <button type="button" className="add-student-primary" onClick={closeAddModal}>Done</button>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="teacher-students-loading">
        <span></span>
        <p>Loading your students…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-empty">
        <span>!</span>
        <div>
          <strong>{error}</strong>
        </div>
      </div>
    );
  }

  if (!roster || (roster.students.length === 0 && roster.pending.length === 0)) {
    return (
      <>
        <div className="teacher-empty teacher-empty-students">
          <span>🎓</span>
          <div>
            <strong>{roster && roster.classrooms.length === 0 ? "You don't have any classes yet." : 'No students yet.'}</strong>
            <p>
              {roster && roster.classrooms.length === 0
                ? 'Create a class, then share its join code with approved families to start seeing students here.'
                : 'Share your class join code with families, or add a student directly with their Teacher Code below.'}
            </p>
            <button onClick={onGoToClasses}>Go to Classes</button>
          </div>
        </div>
        {roster && renderAddButton(roster.classrooms)}
        {renderAddModal()}
      </>
    );
  }

  return (
    <>
      {renderAddButton(roster.classrooms)}
      <div className="teacher-connection-tabs" role="tablist" aria-label="Filter students by connection status">
        <button
          type="button"
          className={`teacher-conn-tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All ({roster.students.length + roster.pending.length + (roster.declined?.length || 0) + (roster.revoked?.length || 0)})
        </button>
        <button
          type="button"
          className={`teacher-conn-tab ${statusFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          Connected ({roster.students.length})
        </button>
        <button
          type="button"
          className={`teacher-conn-tab ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending Approval ({roster.pending.length})
        </button>
        <button
          type="button"
          className={`teacher-conn-tab ${statusFilter === 'declined' ? 'active' : ''}`}
          onClick={() => setStatusFilter('declined')}
        >
          Declined ({roster.declined?.length || 0})
        </button>
        <button
          type="button"
          className={`teacher-conn-tab ${statusFilter === 'revoked' ? 'active' : ''}`}
          onClick={() => setStatusFilter('revoked')}
        >
          Revoked ({roster.revoked?.length || 0})
        </button>
      </div>

      {(statusFilter === 'all' || statusFilter === 'approved') && (
        <>
          <div className="teacher-students-toolbar">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name…"
              aria-label="Search students"
            />
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Filter by class">
              <option value="all">All classes</option>
              {roster.classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value as 'all' | AgeGroup)} aria-label="Filter by age group">
              <option value="all">Child &amp; Teen</option>
              <option value="child">Child</option>
              <option value="teen">Teen</option>
            </select>
            <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value as 'all' | ActivityStatus)} aria-label="Filter by activity status">
              <option value="all">Any activity</option>
              <option value="active">Active</option>
              <option value="recently_active">Recently active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="button"
              className={attentionOnly ? 'teacher-students-attention-toggle active' : 'teacher-students-attention-toggle'}
              aria-pressed={attentionOnly}
              onClick={() => setAttentionOnly((v) => !v)}
            >
              Needs attention{attentionCount > 0 ? ` (${attentionCount})` : ''}
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort students">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
          </div>

          <p className="teacher-students-count">
            {filtered.length} of {roster.students.length} connected student{roster.students.length === 1 ? '' : 's'}
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters}>Clear filters</button>
            )}
          </p>

          {filtered.length === 0 ? (
            <div className="teacher-empty teacher-empty-students">
              <span>{attentionOnly ? '✓' : '🔍'}</span>
              <div>
                <strong>{attentionOnly ? 'No one needs attention right now — nice work!' : 'No connected students match your search or filters.'}</strong>
                {!attentionOnly && <p>Try a different name, or clear your filters to see everyone.</p>}
                {hasActiveFilters && <button onClick={clearFilters}>Clear filters</button>}
              </div>
            </div>
          ) : (
            <div className="teacher-students-grid">
              {filtered.map((s) => (
                <StudentCard key={s.id} student={s} onClick={() => setSelectedId(s.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {(statusFilter === 'all' || statusFilter === 'pending') && (
        <section className="teacher-students-pending">
          <p className="teacher-kicker">Waiting on parent approval ({roster.pending.length})</p>
          {roster.pending.length === 0 ? (
            <p className="tsp-empty-note">No pending requests waiting on parent approval.</p>
          ) : (
            <div className="tsp-list">
              {roster.pending.map((p) => (
                <div key={p.id} className="tsp-row">
                  <span>{p.name[0]}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.classrooms.map((c) => c.name).join(', ')}</small>
                  </div>
                  <em className="tsp-status-badge pending">Pending</em>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(statusFilter === 'all' || statusFilter === 'declined') && (roster.declined?.length || 0) > 0 && (
        <section className="teacher-students-pending teacher-students-declined">
          <p className="teacher-kicker">Declined by parent ({roster.declined?.length || 0})</p>
          <div className="tsp-list">
            {(roster.declined || []).map((p) => (
              <div key={p.id} className="tsp-row">
                <span>{p.name[0]}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.classrooms.map((c) => c.name).join(', ')}</small>
                </div>
                <em className="tsp-status-badge declined">Declined</em>
              </div>
            ))}
          </div>
        </section>
      )}

      {statusFilter === 'declined' && (!roster.declined || roster.declined.length === 0) && (
        <section className="teacher-students-pending">
          <p className="teacher-kicker">Declined by parent (0)</p>
          <p className="tsp-empty-note">No requests have been declined.</p>
        </section>
      )}

      {(statusFilter === 'all' || statusFilter === 'revoked') && (roster.revoked?.length || 0) > 0 && (
        <section className="teacher-students-pending teacher-students-revoked">
          <p className="teacher-kicker">Access revoked by parent ({roster.revoked?.length || 0})</p>
          <div className="tsp-list">
            {(roster.revoked || []).map((p) => (
              <div key={p.id} className="tsp-row">
                <span>{p.name[0]}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.classrooms.map((c) => c.name).join(', ')}</small>
                </div>
                <em className="tsp-status-badge revoked">Revoked</em>
              </div>
            ))}
          </div>
        </section>
      )}

      {statusFilter === 'revoked' && (!roster.revoked || roster.revoked.length === 0) && (
        <section className="teacher-students-pending">
          <p className="teacher-kicker">Access revoked by parent (0)</p>
          <p className="tsp-empty-note">No student connections have been revoked.</p>
        </section>
      )}

      {selectedId && (
        <StudentDetailModal studentId={selectedId} onClose={() => setSelectedId(null)} onRemoved={refreshRoster} />
      )}

      {renderAddModal()}
    </>
  );
}
