'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTierForXp, LEAGUE_TIERS } from '../lib/leagues/config';
import { canonicalRegions } from '../adventure/world-data';
import { signOutOfPersona } from '../lib/session';
import StudentsPanel from './StudentsPanel';
import ClassesPanel from './ClassesPanel';
import AssignmentsPanel from './AssignmentsPanel';
import TemplatesPanel from './TemplatesPanel';

type Page = 'overview' | 'students' | 'classes' | 'assignments' | 'messages' | 'safety';
type Student = { id: number; name: string; age: number; progress: number; needsHelp: boolean; parent: string; approved: boolean };
type Classroom = { id: number; name: string; ageBand: string; code: string; students: Student[]; teacherEmail: string; teacherName: string };
type Assignment = { id: number; classId: number; title: string; due: string; completed: number };
type LiveClassroom = { id: string; name: string; age_band: string | null; code: string; created_at: string };
type LiveStudent = {
  id: string;
  name: string;
  age: number;
  needsHelp: boolean;
  lastLoginAt: string | null;
  today: { active_seconds: number; games_completed: number; lessons_completed: number; quests_completed: number; xp_earned: number };
  currentStreak: number;
  weeklyConsistency: number;
  masteryPercent: number;
};
type ClassInsightConcept = { conceptId: string; label: string; avg: number } | null;
type ClassStoryInsight = { storyId: string; title: string; completedCount: number; percent: number };
type LiveClassSummary = {
  classroom: { id: string; name: string };
  overview: { studentCount: number; activeToday: number; avgActiveSeconds: number; gamesCompletedToday: number; lessonsCompletedToday: number; pendingApprovals: number };
  classInsight: { mostMastered: ClassInsightConcept; needsReinforcement: ClassInsightConcept };
  storyInsight: ClassStoryInsight[];
  students: LiveStudent[];
};

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function getStarterClassesFor(email: string, name: string): Classroom[] {
  return [
    {
      id: 1,
      name: 'Wednesday Explorers',
      ageBand: 'Ages 8–11',
      code: 'LION-482',
      teacherEmail: email,
      teacherName: name,
      students: [
        { id: 1, name: 'Amara A.', age: 9, progress: 78, needsHelp: false, parent: 'Jordan A.', approved: true },
        { id: 2, name: 'Mia K.', age: 10, progress: 52, needsHelp: true, parent: 'Chidi K.', approved: true },
        { id: 3, name: 'Noah B.', age: 8, progress: 91, needsHelp: false, parent: 'Sarah B.', approved: true },
      ],
    },
    {
      id: 2,
      name: 'Friday Teen Circle',
      ageBand: 'Ages 13–16',
      code: 'LAMP-731',
      teacherEmail: email,
      teacherName: name,
      students: [
        { id: 4, name: 'Tobi A.', age: 14, progress: 64, needsHelp: false, parent: 'Jordan A.', approved: true },
        { id: 5, name: 'Jay O.', age: 15, progress: 36, needsHelp: true, parent: 'Helen O.', approved: true },
      ],
    },
  ];
}


const codePrefixForAgeBand = (ageBand: string) => (ageBand.includes('5') ? 'LIGHT' : ageBand.includes('13') ? 'LAMP' : 'LION');
const generateJoinCode = (ageBand: string) => `${codePrefixForAgeBand(ageBand)}-${Math.floor(100 + Math.random() * 900)}`;
const nextId = () => Date.now();

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherName, setTeacherName] = useState('Teacher');
  const [page, setPage] = useState<Page>('overview');
  const [assignmentsSubTab, setAssignmentsSubTab] = useState<'assignments' | 'templates'>('assignments');
  const [allClasses, setAllClasses] = useState<Classroom[]>([]);
  const [activeClass, setActiveClass] = useState(1);
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: 1, classId: 1, title: 'David chooses courage', due: 'Friday', completed: 2 },
    { id: 2, classId: 2, title: 'Build Psalm 119:105', due: 'Sunday', completed: 1 },
  ]);
  const [notice, setNotice] = useState('');
  const [newClass, setNewClass] = useState('');
  const [ageBand, setAgeBand] = useState('Ages 8–11');
  const [message, setMessage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(1);
  const [sentMessages, setSentMessages] = useState<Array<{ studentId: number; body: string }>>([]);
  const [reviewed, setReviewed] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [liveClassrooms, setLiveClassrooms] = useState<LiveClassroom[]>([]);
  const [liveClassId, setLiveClassId] = useState<string | null>(null);
  const [liveSummary, setLiveSummary] = useState<LiveClassSummary | null>(null);
  const [newLiveClassName, setNewLiveClassName] = useState('');

  useEffect(() => {
    if (!hydrated) return;
    fetch('/api/classrooms')
      .then((res) => (res.ok ? (res.json() as Promise<{ classrooms: LiveClassroom[] }>) : null))
      .then((data) => {
        if (data?.classrooms) {
          setLiveClassrooms(data.classrooms);
          if (!liveClassId && data.classrooms[0]) setLiveClassId(data.classrooms[0].id);
        }
      })
      .catch(() => { /* Real backend offline fallback */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!liveClassId) return;
    fetch(`/api/classrooms/${liveClassId}/summary`)
      .then((res) => (res.ok ? (res.json() as Promise<LiveClassSummary>) : null))
      .then((data) => {
        if (data?.overview) setLiveSummary(data);
      })
      .catch(() => {});
  }, [liveClassId]);

  function createLiveClass() {
    if (!newLiveClassName.trim()) return;
    fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLiveClassName.trim() }),
    })
      .then((res) => res.json() as Promise<{ classroom?: LiveClassroom; error?: string }>)
      .then((data) => {
        if (data?.classroom) {
          setLiveClassrooms((prev) => [data.classroom as LiveClassroom, ...prev]);
          setLiveClassId((data.classroom as LiveClassroom).id);
          setNewLiveClassName('');
          setNotice(`${data.classroom.name} is ready. Share code ${data.classroom.code} with approved families.`);
        } else if (data?.error) {
          setNotice(data.error);
        }
      })
      .catch(() => setNotice('Could not create the class — check your connection.'));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const session = JSON.parse(localStorage.getItem('lanternLionTeacherSession') || 'null');
        if (!session?.email) {
          try {
            sessionStorage.setItem('lanternLionPendingModuleRedirect', '/teacher-dashboard');
          } catch { /* Storage unavailable. */ }
          router.replace('/teacher-access');
          return;
        }
        const email = session.email;
        const name = session.name || 'Teacher';
        setTeacherEmail(email);
        setTeacherName(name);

        const saved = JSON.parse(localStorage.getItem('lanternLionTeacherClasses') || 'null');
        const work = JSON.parse(localStorage.getItem('lanternLionTeacherAssignments') || 'null');

        if (Array.isArray(saved) && saved.length) {
          const teacherClasses = saved.filter((c: Classroom) => !c.teacherEmail || c.teacherEmail === email);
          if (teacherClasses.length) {
            setAllClasses(saved);
            setActiveClass(teacherClasses[0].id);
          } else {
            const starters = getStarterClassesFor(email, name);
            const combined = [...saved, ...starters];
            setAllClasses(combined);
            setActiveClass(starters[0].id);
            localStorage.setItem('lanternLionTeacherClasses', JSON.stringify(combined));
          }
        } else {
          const starters = getStarterClassesFor(email, name);
          setAllClasses(starters);
          setActiveClass(starters[0].id);
          localStorage.setItem('lanternLionTeacherClasses', JSON.stringify(starters));
        }

        if (Array.isArray(work)) setAssignments(work);
      } catch {
        const starters = getStarterClassesFor('teacher@lanternandlion.com', 'Teacher');
        setAllClasses(starters);
        setActiveClass(starters[0].id);
      }
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const classes = allClasses.filter((item) => !item.teacherEmail || item.teacherEmail === teacherEmail);
  const classroom = classes.find((item) => item.id === activeClass) || classes[0];
  const students = classes.flatMap((item) => item.students);
  const approvedStudents = students.filter((item) => item.approved);
  const pendingStudents = students.filter((item) => !item.approved);
  const helpStudents = approvedStudents.filter((item) => item.needsHelp && !reviewed.includes(item.id));
  const average = approvedStudents.length
    ? Math.round(approvedStudents.reduce((sum, item) => sum + item.progress, 0) / approvedStudents.length)
    : 0;

  function saveAllClasses(next: Classroom[]) {
    setAllClasses(next);
    localStorage.setItem('lanternLionTeacherClasses', JSON.stringify(next));
  }

  function createClass() {
    if (!newClass.trim()) {
      setNotice('Add a class name first.');
      return;
    }
    const nextClass: Classroom = {
      id: nextId(),
      name: newClass.trim(),
      ageBand,
      code: generateJoinCode(ageBand),
      teacherEmail,
      teacherName,
      students: [],
    };
    const next = [...allClasses, nextClass];
    saveAllClasses(next);
    setActiveClass(nextClass.id);
    setNewClass('');
    setNotice(`${nextClass.name} is ready. Share its code only with approved families.`);
  }

  function signOut() {
    void signOutOfPersona('teacher');
  }

  const nav: Array<[Page, string, string]> = [
    ['overview', 'O', 'Overview'],
    ['students', 'St', 'My Students'],
    ['classes', 'C', 'Classes'],
    ['assignments', 'A', 'Assignments'],
    ['messages', 'M', 'Parent messages'],
    ['safety', 'S', 'Safety'],
  ];

  if (!hydrated) {
    return (
      <main className="dashboard-loading">
        <span></span>
        <p>Opening the teacher space…</p>
      </main>
    );
  }

  return (
    <main className="teacher-dashboard">
      <aside className="teacher-sidebar">
        <Link href="/" className="teacher-brand">
          <Image src="/lantern-lion-logo.png" alt="" width={58} height={58} />
          <span>
            <strong>Lantern &amp; Lion</strong>
            <small>Teacher space</small>
          </span>
        </Link>
        <nav aria-label="Teacher dashboard">
          {nav.map(([id, mark, label]) => (
            <button
              key={id}
              className={page === id ? 'active' : ''}
              aria-pressed={page === id}
              onClick={() => setPage(id)}
            >
              <span>{mark}</span>
              {label}
              {id === 'safety' && helpStudents.length > 0 ? <b>{helpStudents.length}</b> : null}
            </button>
          ))}
        </nav>
        <div>
          <Link href="/learn?activity=david-chooses-courage">Preview an activity</Link>
          <Link href="/teacher-access" onClick={signOut}>
            Sign out of demo
          </Link>
        </div>
      </aside>

      <section className="teacher-main">
        <header className="teacher-topbar">
          <div>
            <span>Teacher workspace</span>
            <strong>{teacherName}</strong>
          </div>
          {classes.length > 0 && classroom && (
            <label>
              Current class
              <select value={activeClass} onChange={(e) => setActiveClass(Number(e.target.value))}>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </header>

        {classes.length === 0 || !classroom ? (
          <div className="teacher-content">
            <div className="teacher-title">
              <p className="teacher-kicker">Welcome, {teacherName}</p>
              <h1>Create your first classroom.</h1>
              <p>Set up a class circle to generate student join codes, share lessons, and monitor student progress.</p>
            </div>
            <section className="teacher-create-class">
              <div>
                <p className="teacher-kicker">New Class Setup</p>
                <h2>Create a Learning Circle</h2>
              </div>
              <label>
                Class name
                <input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="e.g. Wednesday Explorers" />
              </label>
              <label>
                Age group
                <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)}>
                  <option>Ages 5–7</option>
                  <option>Ages 8–11</option>
                  <option>Ages 13–16</option>
                </select>
              </label>
              <button onClick={createClass}>Create class</button>
            </section>
          </div>
        ) : (
          <>
            {page === 'overview' && (
              <div className="teacher-content">
                <div className="teacher-title">
                  <p className="teacher-kicker">Good morning, {teacherName.split(' ')[0]}</p>
                  <h1>See the class, not just the scores.</h1>
                  <p>Start with the learners who asked for help, then notice the quiet progress happening everywhere else.</p>
                </div>

                <div className="teacher-metrics">
                  <article>
                    <span>Students</span>
                    <strong>{approvedStudents.length}</strong>
                    <small>
                      Across {classes.length} classes{pendingStudents.length ? ` · ${pendingStudents.length} pending approval` : ''}
                    </small>
                  </article>
                  <article>
                    <span>Average progress</span>
                    <strong>{average}%</strong>
                    <small>This week</small>
                  </article>
                  <article>
                    <span>Active assignments</span>
                    <strong>{assignments.filter((item) => classes.some((c) => c.id === item.classId)).length}</strong>
                    <small>Nothing overdue</small>
                  </article>
                  <article className="attention">
                    <span>Needs a look</span>
                    <strong>{helpStudents.length}</strong>
                    <small>Private help flags</small>
                  </article>
                </div>

                <section className="teacher-panel teacher-class-overview-panel">
                  <div className="teacher-panel-head">
                    <div>
                      <p className="teacher-kicker">Live class activity</p>
                      <h2>{liveSummary?.classroom.name || 'Create a class to see real activity'}</h2>
                    </div>
                    {liveClassrooms.length > 1 && (
                      <select value={liveClassId || ''} onChange={(e) => setLiveClassId(e.target.value)}>
                        {liveClassrooms.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {liveClassrooms.length === 0 ? (
                    <div className="teacher-add-student">
                      <label>
                        Class name
                        <input value={newLiveClassName} onChange={(e) => setNewLiveClassName(e.target.value)} placeholder="e.g. Sunday Juniors" />
                      </label>
                      <button onClick={createLiveClass}>Create your first live class</button>
                    </div>
                  ) : (
                    liveSummary && (
                      <>
                        <div className="teacher-class-overview">
                          <div>
                            <b>{liveSummary.overview.studentCount}</b>
                            <span>students</span>
                          </div>
                          <div>
                            <b>{liveSummary.overview.activeToday}</b>
                            <span>active today</span>
                          </div>
                          <div>
                            <b>{formatMinutes(liveSummary.overview.avgActiveSeconds)}</b>
                            <span>avg active learning</span>
                          </div>
                          <div>
                            <b>{liveSummary.overview.gamesCompletedToday}</b>
                            <span>games completed</span>
                          </div>
                          <div>
                            <b>{liveSummary.overview.lessonsCompletedToday}</b>
                            <span>lessons completed</span>
                          </div>
                          {liveSummary.overview.pendingApprovals > 0 && (
                            <div>
                              <b>{liveSummary.overview.pendingApprovals}</b>
                              <span>pending parent approval</span>
                            </div>
                          )}
                        </div>

                        {(liveSummary.classInsight?.mostMastered || liveSummary.classInsight?.needsReinforcement) && (
                          <p className="teacher-class-insight">
                            {liveSummary.classInsight?.mostMastered && (
                              <span>
                                🏆 Most mastered: <b>{liveSummary.classInsight.mostMastered.label}</b> ({liveSummary.classInsight.mostMastered.avg}%)
                              </span>
                            )}
                            {liveSummary.classInsight?.needsReinforcement && (
                              <span>
                                📌 Class needs reinforcement: <b>{liveSummary.classInsight.needsReinforcement.label}</b> ({liveSummary.classInsight.needsReinforcement.avg}%)
                              </span>
                            )}
                          </p>
                        )}

                        {liveSummary.storyInsight?.some((s) => s.completedCount > 0) && (
                          <p className="teacher-class-insight">
                            📖{' '}
                            {liveSummary.storyInsight
                              .filter((s) => s.completedCount > 0)
                              .map((s) => (
                                <span key={s.storyId}>
                                  {s.title}: <b>{s.percent}%</b> completed
                                </span>
                              ))}
                          </p>
                        )}

                        {liveSummary.students.length > 0 && (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="teacher-roster-table">
                              <thead>
                                <tr>
                                  <th>Student</th>
                                  <th>League</th>
                                  <th>Active today</th>
                                  <th>Games</th>
                                  <th>Lessons</th>
                                  <th>XP</th>
                                  <th>Streak</th>
                                  <th>This week</th>
                                  <th>Mastery</th>
                                </tr>
                              </thead>
                              <tbody>
                                {liveSummary.students.map((s) => {
                                  const tierId = getTierForXp(s.today.xp_earned * 5);
                                  const tier = LEAGUE_TIERS[tierId];
                                  return (
                                    <tr key={s.id}>
                                      <td>{s.name}{s.needsHelp ? ' · needs help' : ''}</td>
                                      <td>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: tier.badgeTone }}>
                                          {tier.emoji} {tier.name}
                                        </span>
                                      </td>
                                      <td>{formatMinutes(s.today.active_seconds)}</td>
                                      <td>{s.today.games_completed}</td>
                                      <td>{s.today.lessons_completed}</td>
                                      <td>{s.today.xp_earned}</td>
                                      <td>🔥 {s.currentStreak}</td>
                                      <td>{s.weeklyConsistency}/7</td>
                                      <td>{s.masteryPercent}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {liveSummary.students.length === 0 && (
                          <p>No approved students yet — share your class code with families and approve them from the parent dashboard.</p>
                        )}
                      </>
                    )
                  )}
                </section>

                <div className="teacher-overview-grid">
                  <section className="teacher-panel">
                    <div className="teacher-panel-head">
                      <div>
                        <p className="teacher-kicker">{classroom.name}</p>
                        <h2>Learning this week</h2>
                      </div>
                      <button onClick={() => setPage('classes')}>Open class</button>
                    </div>

                    <div className="teacher-roster-mini">
                      {classroom.students.map((student) => (
                        <article key={student.id} className={student.approved ? '' : 'teacher-student-pending'}>
                          <span>{student.name[0]}</span>
                          <div>
                            <strong>{student.name}</strong>
                            <small>{student.approved ? `${student.progress}% of this week's path` : 'Pending parent approval'}</small>
                            <i>
                              <b style={{ width: `${student.approved ? student.progress : 0}%` }} />
                            </i>
                          </div>
                          {!student.approved ? <em>Pending</em> : student.needsHelp && !reviewed.includes(student.id) ? <em>Needs help</em> : <b>On path</b>}
                        </article>
                      ))}
                    </div>

                    <div style={{ margin: '1.5rem 20px 0', padding: '1.1rem 0 1.4rem', borderTop: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0' }}>
                        🗺️ Bible Adventure World — 8 Canonical Lands
                      </p>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {canonicalRegions.map((reg) => (
                          <span
                            key={reg.id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.8rem',
                              lineHeight: 1.4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                            }}
                          >
                            <span aria-hidden="true">{reg.icon}</span>
                            <strong>{reg.name}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>

                  <aside className="teacher-help-panel">
                    <p className="teacher-kicker">Respond with care</p>
                    <h2>{helpStudents.length ? `${helpStudents.length} learners asked for help.` : 'No new help flags.'}</h2>
                    <p>Flags show the activity and attempt pattern. Message the parent if a conversation would help.</p>
                    <button onClick={() => setPage('safety')}>Review help flags</button>
                  </aside>
                </div>
              </div>
            )}

            {page === 'students' && (
              <div className="teacher-content">
                <div className="teacher-title">
                  <p className="teacher-kicker">My Students</p>
                  <h1>Every learner, at a glance.</h1>
                  <p>See who&apos;s active, who&apos;s progressing, and who could use a check-in — across every class you teach.</p>
                </div>
                <StudentsPanel onGoToClasses={() => setPage('classes')} />
              </div>
            )}

            {page === 'classes' && (
              <div className="teacher-content">
                <div className="teacher-title">
                  <p className="teacher-kicker">Classes</p>
                  <h1>Organize your students into classrooms.</h1>
                  <p>Create a classroom for each group you teach, assign Bible stories and lessons, and see how each class is progressing.</p>
                </div>
                <ClassesPanel />
              </div>
            )}

            {page === 'assignments' && (
              <div className="teacher-content">
                <div className="teacher-title">
                  <p className="teacher-kicker">Assignments</p>
                  <h1>Assign, monitor, and grade.</h1>
                  <p>Create Bible-learning assignments for a whole classroom or hand-picked students, and see completion and scores in one place.</p>
                </div>
                <div className="assignments-subtabs">
                  <button type="button" className={assignmentsSubTab === 'assignments' ? 'active' : ''} onClick={() => setAssignmentsSubTab('assignments')}>Assignments</button>
                  <button type="button" className={assignmentsSubTab === 'templates' ? 'active' : ''} onClick={() => setAssignmentsSubTab('templates')}>Templates</button>
                </div>
                {assignmentsSubTab === 'assignments' ? <AssignmentsPanel /> : <TemplatesPanel />}
              </div>
            )}

            {page === 'messages' && (
              <div className="teacher-content">
                <div className="teacher-title">
                  <p className="teacher-kicker">Parent messages</p>
                  <h1>Keep adults in the conversation.</h1>
                  <p>Teachers message a verified parent account. Children cannot receive or send private messages.</p>
                </div>

                <section className="teacher-message-layout">
                  <aside>
                    {approvedStudents.slice(0, 4).map((student) => (
                      <button
                        className={selectedStudent === student.id ? 'active' : ''}
                        aria-pressed={selectedStudent === student.id}
                        onClick={() => setSelectedStudent(student.id)}
                        key={student.id}
                      >
                        <span>{student.parent[0]}</span>
                        <div>
                          <strong>{student.parent}</strong>
                          <small>Parent of {student.name}</small>
                        </div>
                      </button>
                    ))}
                  </aside>

                  <div>
                    <header>
                      <strong>{approvedStudents.find((item) => item.id === selectedStudent)?.parent || approvedStudents[0]?.parent}</strong>
                      <small>Parent of {approvedStudents.find((item) => item.id === selectedStudent)?.name || approvedStudents[0]?.name}</small>
                    </header>
                    <div className="teacher-message-list">
                      {(() => {
                        const activeStudent = approvedStudents.find((item) => item.id === selectedStudent) || approvedStudents[0];
                        if (!activeStudent) return <p>No approved students in this class yet.</p>;
                        const studentClass = classes.find((c) => c.students.some((s) => s.id === activeStudent.id));
                        const topicAssignment = assignments.find((item) => item.classId === studentClass?.id);
                        const topic = topicAssignment?.title || 'this week’s activity';
                        return (
                          <p>
                            <b>{activeStudent.parent}</b>
                            {activeStudent.name} enjoyed “{topic}.” Is there something we can talk about at home?
                          </p>
                        );
                      })()}
                      <p className="sent">
                        <b>You</b>Ask what stood out to them most — that detail helped today.
                      </p>
                      {sentMessages
                        .filter((item) => item.studentId === selectedStudent)
                        .map((item, index) => (
                          <p className="sent" key={index}>
                            <b>You</b>{item.body}
                          </p>
                        ))}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!message.trim()) return;
                        setSentMessages([...sentMessages, { studentId: selectedStudent, body: message.trim() }]);
                        setNotice('Your message was added to the parent conversation.');
                        setMessage('');
                      }}
                    >
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write to the parent, not the child" />
                      <button>Send to parent</button>
                    </form>
                  </div>
                </section>
              </div>
            )}

            {page === 'safety' && (
              <div className="teacher-content">
                <div className="teacher-title">
                  <p className="teacher-kicker">Safeguarding</p>
                  <h1>Every flag deserves a calm response.</h1>
                  <p>Teachers see only students assigned to their classes. Serious concerns should follow your organisation’s safeguarding procedure.</p>
                </div>

                <div className="teacher-safety-banner">
                  <strong>Children cannot message teachers privately.</strong>
                  <span>Help flags are visible to the teacher and parent. This demo stores review status only on this device.</span>
                </div>

                <section className="teacher-panel teacher-flags">
                  <div className="teacher-panel-head">
                    <div>
                      <p className="teacher-kicker">Open help flags</p>
                      <h2>{helpStudents.length} need review</h2>
                    </div>
                  </div>
                  {helpStudents.map((student) => (
                    <article key={student.id}>
                      <span>!</span>
                      <div>
                        <strong>
                          {student.name} · {classes.find((item) => item.students.some((member) => member.id === student.id))?.name}
                        </strong>
                        <p>Asked for help after two attempts in “Build Psalm 119:105”. No free-text child message was collected.</p>
                        <small>Today · Parent: {student.parent}</small>
                      </div>
                      <button
                        onClick={() => {
                          setReviewed([...reviewed, student.id]);
                          setNotice(`${student.name}’s flag was marked as reviewed.`);
                        }}
                      >
                        Mark reviewed
                      </button>
                    </article>
                  ))}
                  {!helpStudents.length && (
                    <div className="teacher-empty">
                      <span>✓</span>
                      <strong>Every current flag has been reviewed.</strong>
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}

        {notice && (
          <div className="teacher-toast" role="status">
            <span>✓</span>
            <p>{notice}</p>
            <button onClick={() => setNotice('')}>Close</button>
          </div>
        )}
      </section>
    </main>
  );
}
