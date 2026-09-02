'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ActivityStatus, AgeGroup, StudentDetailResponse, StudentsRosterResponse } from '../lib/classrooms/types';

type SortKey = 'name' | 'most_active' | 'least_active' | 'xp_high' | 'xp_low' | 'performance_high' | 'performance_low' | 'recent_activity';

const ACTIVITY_LABEL: Record<ActivityStatus, string> = {
  active: 'Active',
  recently_active: 'Recently active',
  inactive: 'Inactive',
};

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

function formatLastActive(iso: string | null): string {
  if (!iso) return 'Never logged in';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Active today';
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Active ${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return `Last active ${new Date(iso).toLocaleDateString()}`;
}

function dayLetter(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' });
}

export default function StudentsPanel({ onGoToClasses }: { onGoToClasses: () => void }) {
  const [roster, setRoster] = useState<StudentsRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentClassroomId, setAddStudentClassroomId] = useState('');
  const [addStudentCode, setAddStudentCode] = useState('');
  const [addStudentBusy, setAddStudentBusy] = useState(false);
  const [addStudentNotice, setAddStudentNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState<'all' | AgeGroup>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityStatus>('all');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('name');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

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
    if (roster && roster.classrooms.length > 0 && !addStudentClassroomId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- defaults the picker once, from freshly-loaded roster data
      setAddStudentClassroomId(roster.classrooms[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster]);

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- selectedId changed, must show loading before the fetch below resolves
    setDetailLoading(true);
    setDetailError('');
    fetch(`/api/teacher/students/${selectedId}`)
      .then((res) => (res.ok ? (res.json() as Promise<StudentDetailResponse>) : Promise.reject()))
      .then((data) => {
        if (alive) {
          setDetail(data);
          setDetailLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setDetailError('Could not load this student’s profile.');
          setDetailLoading(false);
        }
      });
    return () => { alive = false; };
  }, [selectedId]);

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

  function closeDetail() {
    setSelectedId(null);
    setDetail(null);
    setDetailError('');
  }

  function clearFilters() {
    setSearch('');
    setClassFilter('all');
    setAgeFilter('all');
    setActivityFilter('all');
    setAttentionOnly(false);
  }

  async function submitAddStudent() {
    if (!addStudentClassroomId || !addStudentCode.trim()) return;
    setAddStudentBusy(true);
    setAddStudentNotice(null);
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherCode: addStudentCode.trim(), classroomId: addStudentClassroomId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; child?: { name: string } } | null;
      if (!res.ok) {
        setAddStudentNotice({ kind: 'error', text: data?.error || 'Could not send the connection request.' });
        return;
      }
      setAddStudentNotice({ kind: 'success', text: `Request sent — ${data?.child?.name} is waiting on their parent's approval.` });
      setAddStudentCode('');
      // Refresh the roster so the new pending student shows up right away.
      fetch('/api/teacher/students')
        .then((r) => (r.ok ? (r.json() as Promise<StudentsRosterResponse>) : null))
        .then((fresh) => { if (fresh) setRoster(fresh); })
        .catch(() => {});
    } catch {
      setAddStudentNotice({ kind: 'error', text: 'Could not send the connection request. Check your connection and try again.' });
    } finally {
      setAddStudentBusy(false);
    }
  }

  function renderAddStudentBlock(classrooms: { id: string; name: string; ageBand: string | null }[]) {
    if (classrooms.length === 0) return null;
    return (
      <section className="teacher-add-student-code">
        <button
          type="button"
          className="teacher-add-student-toggle"
          aria-expanded={addStudentOpen}
          onClick={() => { setAddStudentOpen((v) => !v); setAddStudentNotice(null); }}
        >
          {addStudentOpen ? '− Add Student' : '+ Add Student'}
        </button>
        {addStudentOpen && (
          <div className="teacher-add-student-form">
            <p>Enter a student&apos;s Teacher Code to send them a classroom connection request. Their parent must approve it first.</p>
            <div className="teacher-add-student-fields">
              <select
                value={addStudentClassroomId}
                onChange={(e) => setAddStudentClassroomId(e.target.value)}
                aria-label="Class to add this student to"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={addStudentCode}
                onChange={(e) => setAddStudentCode(e.target.value)}
                placeholder="LNL-TCH-XXXXXX"
                aria-label="Student's Teacher Code"
                maxLength={32}
              />
              <button type="button" disabled={addStudentBusy || !addStudentCode.trim()} onClick={submitAddStudent}>
                {addStudentBusy ? 'Sending…' : 'Send Request'}
              </button>
            </div>
            {addStudentNotice && (
              <p className={addStudentNotice.kind === 'error' ? 'teacher-add-student-error' : 'teacher-add-student-success'} role="status">
                {addStudentNotice.text}
              </p>
            )}
          </div>
        )}
      </section>
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
        {roster && renderAddStudentBlock(roster.classrooms)}
      </>
    );
  }

  return (
    <>
      {renderAddStudentBlock(roster.classrooms)}
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
        {filtered.length} of {roster.students.length} student{roster.students.length === 1 ? '' : 's'}
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters}>Clear filters</button>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="teacher-empty teacher-empty-students">
          <span>{attentionOnly ? '✓' : '🔍'}</span>
          <div>
            <strong>{attentionOnly ? 'No one needs attention right now — nice work!' : 'No students match your search or filters.'}</strong>
            {!attentionOnly && <p>Try a different name, or clear your filters to see everyone.</p>}
            {hasActiveFilters && <button onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>
      ) : (
        <div className="teacher-students-grid">
          {filtered.map((s) => (
            <button key={s.id} className="teacher-student-card" onClick={() => setSelectedId(s.id)}>
              <div className="tsc-top">
                <span className="tsc-avatar">{s.name[0]}</span>
                <div className="tsc-id">
                  <strong>{s.name}</strong>
                  <small>{s.ageGroup === 'teen' ? 'Teen' : 'Child'} · Age {s.age}</small>
                </div>
              </div>
              {s.classrooms.length > 0 && (
                <div className="tsc-classes">
                  {s.classrooms.map((c) => <span key={c.id}>{c.name}</span>)}
                </div>
              )}
              <div className="tsc-stats">
                <div><b>Lvl {s.level}</b><span>{s.xp} XP</span></div>
                <div><b>🔥 {s.currentStreak}</b><span>day streak</span></div>
                <div><b>{s.weeklyActiveDays}/7</b><span>active days</span></div>
                <div><b>{s.masteryTracked ? `${s.masteryPercent}%` : '—'}</b><span>performance</span></div>
              </div>
              <div className="tsc-foot">
                <span className={`tsc-status tsc-status-${s.activityStatus}`}>{ACTIVITY_LABEL[s.activityStatus]}</span>
                <small>{formatLastActive(s.lastActiveAt)}</small>
                {s.needsAttention && <em className="tsc-flag">Needs attention</em>}
              </div>
            </button>
          ))}
        </div>
      )}

      {roster.pending.length > 0 && (
        <section className="teacher-students-pending">
          <p className="teacher-kicker">Waiting on parent approval ({roster.pending.length})</p>
          <div className="tsp-list">
            {roster.pending.map((p) => (
              <div key={p.id} className="tsp-row">
                <span>{p.name[0]}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.classrooms.map((c) => c.name).join(', ')}</small>
                </div>
                <em>Pending</em>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedId && (
        <div className="student-detail-overlay" role="presentation" onClick={closeDetail}>
          <section
            className="student-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="student-detail-close" aria-label="Close" onClick={closeDetail}>×</button>

            {detailLoading && (
              <div className="teacher-students-loading">
                <span></span>
                <p>Loading student profile…</p>
              </div>
            )}

            {!detailLoading && detailError && <p className="student-detail-empty">{detailError}</p>}

            {!detailLoading && detail && (
              <>
                <header className="student-detail-head">
                  <span className="student-detail-avatar">{detail.student.name[0]}</span>
                  <div>
                    <h2 id="student-detail-title">{detail.student.name}</h2>
                    <p>
                      {detail.student.ageGroup === 'teen' ? 'Teen' : 'Child'} · Age {detail.student.age}
                      {detail.student.classrooms.length > 0 ? ` · ${detail.student.classrooms.map((c) => c.name).join(', ')}` : ''}
                    </p>
                  </div>
                  <span className={`tsc-status tsc-status-${detail.student.activityStatus}`}>{ACTIVITY_LABEL[detail.student.activityStatus]}</span>
                </header>

                <div className="student-detail-stats">
                  <div><b>{detail.student.levelTitle}</b><span>Level {detail.student.level}</span></div>
                  <div><b>{detail.student.xp}</b><span>Total XP</span></div>
                  <div><b>🔥 {detail.student.currentStreak}</b><span>current streak</span></div>
                  <div><b>{detail.longestStreak}</b><span>longest streak</span></div>
                  <div><b>{detail.student.weeklyActiveDays}/7</b><span>active this week</span></div>
                  <div><b>{detail.student.masteryTracked ? `${detail.student.masteryPercent}%` : '—'}</b><span>avg. performance</span></div>
                </div>

                <div className="student-detail-section">
                  <p className="teacher-kicker">This week</p>
                  <div className="student-detail-calendar">
                    {detail.weekCalendar.map((d) => (
                      <span key={d.date} className={`sdc-day sdc-${d.state}`} title={d.date}>{dayLetter(d.date)}</span>
                    ))}
                  </div>
                </div>

                {detail.student.needsAttention && (
                  <div className="student-detail-attention">
                    <p className="teacher-kicker">Needs attention</p>
                    <ul>
                      {detail.student.needsAttentionReasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                <div className="student-detail-section">
                  <p className="teacher-kicker">Strengths &amp; areas to practice</p>
                  {detail.learning.strengths.length === 0 && detail.learning.needsPractice.length === 0 ? (
                    <p className="student-detail-empty">Keep learning — we’ll identify strengths as more activity is completed.</p>
                  ) : (
                    <div className="student-detail-pills">
                      {detail.learning.strengths.map((c) => <span key={c.conceptId} className="pill pill-strength">{c.label}</span>)}
                      {detail.learning.needsPractice.map((c) => <span key={c.conceptId} className="pill pill-practice">{c.label}</span>)}
                    </div>
                  )}
                </div>

                {detail.stories.length > 0 && (
                  <div className="student-detail-section">
                    <p className="teacher-kicker">Interactive Bible stories</p>
                    <p>{detail.stories.length} completed — most recently “{detail.stories[0].title}.”</p>
                  </div>
                )}

                <div className="student-detail-section">
                  <p className="teacher-kicker">Recent activity</p>
                  {detail.recentActivity.length === 0 ? (
                    <p className="student-detail-empty">No activity yet — check back once {detail.student.name.split(' ')[0]} starts learning.</p>
                  ) : (
                    <ul className="student-detail-activity">
                      {detail.recentActivity.map((item) => (
                        <li key={item.id}>
                          <time>{new Date(item.occurredAt).toLocaleDateString()}</time>
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
