'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSkillProfile } from '../lib/skill-profile';

type Child = { id: number; name: string; username?: string; age: number; avatar: string; pin: string };
type Family = { familyName: string; country: string; children: Child[]; privateArtwork: boolean; teacherMessages: boolean; progressEmails: boolean };
type Assignment = { id: number; childId: number; title: string; due: string };
type ActivityLog = { id: number; childId: number; childName: string; title: string; type: string; reference?: string; attempts: number; time: string; timestamp?: string };
type HelpRequest = { child: string; kind: string; time: string; message?: string };

function suggestionFor(request: HelpRequest): string {
  if (request.kind.startsWith('Chat:')) {
    return `${request.child} shared something with Lumen (our AI helper) that sounded like it needed a caring adult, so it was flagged for you instead of answered fully. Lumen’s suggestion: find a quiet, low-pressure moment — not right when you first bring it up — and gently ask ${request.child} to tell you more in their own words. Avoid reacting with alarm or jumping straight to consequences; the goal is for them to feel safe having told you. If what they describe involves safety, bullying, or self-harm, consider looping in a school counselor, pastor, or pediatrician.`;
  }
  if (request.kind === 'Something feels wrong') {
    return `${request.child} tapped “Something feels wrong” inside their own space. Lumen’s suggestion: check in privately and ask open questions like “What happened?” rather than “What did you do?” — this was flagged as a safety concern, not a behavior issue, so lead with reassurance that they did the right thing by speaking up.`;
  }
  if (request.kind === 'Wants their parent') {
    return `${request.child} asked to be connected with you directly. Lumen’s suggestion: this is usually a simple “I miss you” or “I need you” moment — a quick hug, call, or a few minutes of undivided attention often resolves it.`;
  }
  if (request.kind === 'Stuck in an activity') {
    return `${request.child} got stuck inside a lesson and asked for help. Lumen’s suggestion: sit with them for a few minutes and let them explain the activity to you — kids often work through the sticking point just by talking it out loud.`;
  }
  return `Lumen flagged this for your attention. Check in with ${request.child} when you both have a quiet moment.`;
}
type Page = 'overview' | 'children' | 'assignments' | 'messages' | 'settings';

type DailySummaryRow = {
  active_seconds: number;
  session_count: number;
  games_played: number;
  games_completed: number;
  lessons_completed: number;
  quests_completed: number;
  xp_earned: number;
  achievements_earned: number;
} | null;

type TodayActivityChild = {
  child: { id: string; name: string; username?: string; age: number; avatar: string };
  summary: DailySummaryRow;
  timeline: { eventType: string; occurredAt: string; metadata?: Record<string, unknown> }[];
};

type NotificationItem = {
  id: string;
  child_id: string | null;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

function formatActiveTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const EVENT_LABELS: Record<string, string> = {
  USER_LOGIN: 'Logged in',
  SESSION_STARTED: 'Session started',
  SESSION_RESUMED: 'Came back after a break',
  SESSION_IDLE: 'Went idle',
  SESSION_ENDED: 'Logged out',
  GAME_STARTED: 'Started a game',
  GAME_COMPLETED: 'Completed a game',
  LESSON_STARTED: 'Started a lesson',
  LESSON_COMPLETED: 'Completed a lesson',
  QUEST_STARTED: 'Started a quest',
  QUEST_COMPLETED: 'Completed a quest',
  ACHIEVEMENT_EARNED: 'Earned an achievement',
  XP_EARNED: 'Earned XP',
};

const fallbackFamily: Family = {
  familyName: 'The Adeyemi Family',
  country: 'Nigeria',
  children: [
    { id: 1, name: 'Amara', age: 9, avatar: 'lion', pin: '2468' },
    { id: 2, name: 'Tobi', age: 14, avatar: 'lantern', pin: '1357' },
  ],
  privateArtwork: true,
  teacherMessages: true,
  progressEmails: false,
};
const lessonOptions = ['David chooses courage', 'In the beginning', 'Noah trusts and builds', 'Build Psalm 119:105', 'A kind choice at lunch', 'Daniel in the lions’ den', 'Build John 3:16', 'Make a courage card'];

export default function ParentDashboardPage() {
  const router = useRouter();
  const [page, setPage] = useState<Page>('overview');
  const [family, setFamily] = useState<Family>(fallbackFamily);
  const [hasFamily, setHasFamily] = useState(true);
  const [connectedClass, setConnectedClass] = useState<{ id: number; name: string; ageBand: string; code: string; teacher: string } | null>(null);
  const [parentName, setParentName] = useState('Jordan Adeyemi');
  const [selectedChild, setSelectedChild] = useState<number>(fallbackFamily.children[0].id);
  const [assignments, setAssignments] = useState<Assignment[]>([{ id: 1, childId: 1, title: 'David chooses courage', due: 'Friday' }]);
  const [childProgressMap, setChildProgressMap] = useState<Record<number, string[]>>({});
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [helpRequest, setHelpRequest] = useState<HelpRequest | null>(null);
  const [showHelpDetail, setShowHelpDetail] = useState(false);
  const [lesson, setLesson] = useState(lessonOptions[0]);
  const [due, setDue] = useState('Friday');
  const [savedNotice, setSavedNotice] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([{ from: 'Mrs Grace', body: 'Amara asked a thoughtful question about courage today.', time: 'Today, 10:24' }]);
  const [hydrated, setHydrated] = useState(false);
  const [todayActivity, setTodayActivity] = useState<TodayActivityChild[]>([]);
  const [activityTimezone, setActivityTimezone] = useState('UTC');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedActivityChild, setSelectedActivityChild] = useState<string | null>(null);
  const [classMemberships, setClassMemberships] = useState<{ classroomId: string; classroomName: string; childId: string; childName: string; approved: boolean }[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Parsed and checked outside the main try/catch below: if this throws
      // (e.g. corrupted localStorage) it must still redirect, not be
      // swallowed into rendering the page as if a session were present.
      let session: { name?: string } | null = null;
      try { session = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null'); } catch { /* Treat as no session. */ }
      if (!session) {
        try { sessionStorage.setItem('lanternLionPendingModuleRedirect', '/parent-dashboard'); } catch { /* Storage unavailable. */ }
        router.replace('/parent-access');
        return;
      }
      try {
        const storedFamily = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
        const storedAssignments = JSON.parse(localStorage.getItem('lanternLionDemoAssignments') || 'null');
        const progressMap = JSON.parse(localStorage.getItem('lanternLionChildProgressMap') || '{}');
        const generalProgress = JSON.parse(localStorage.getItem('lanternLionDemoProgress') || '[]');
        const logs = JSON.parse(localStorage.getItem('lanternLionChildActivityLog') || '[]');
        const storedHelp = JSON.parse(localStorage.getItem('lanternLionDemoHelpRequest') || 'null');
        const storedConnectedClass = JSON.parse(localStorage.getItem('lanternLionConnectedClass') || 'null');
        if (storedConnectedClass?.name) setConnectedClass(storedConnectedClass);

        setHasFamily(Boolean(storedFamily?.children?.length));
        if (storedFamily?.children?.length) {
          setFamily(storedFamily);
          setSelectedChild(storedFamily.children[0].id);
          if (!Array.isArray(storedAssignments)) {
            const seeded = [{ id: Date.now(), childId: storedFamily.children[0].id, title: 'David chooses courage', due: 'Friday' }];
            setAssignments(seeded);
            localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(seeded));
          } else {
            const validIds = new Set(storedFamily.children.map((child: Child) => child.id));
            const seen = new Set<string>();
            const normalized = storedAssignments.filter((item: Assignment) => {
              const key = `${item.childId}:${item.title}`;
              if (!validIds.has(item.childId) || seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            setAssignments(normalized);
            localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(normalized));
          }
        }
        if (session?.name) setParentName(session.name);

        const normalizedMap = { ...progressMap };
        if (storedFamily?.children?.length) {
          const firstId = storedFamily.children[0].id;
          if (!normalizedMap[firstId] && Array.isArray(generalProgress) && generalProgress.length) {
            normalizedMap[firstId] = generalProgress;
          }
        }
        setChildProgressMap(normalizedMap);

        if (Array.isArray(logs) && logs.length > 0) {
          setActivityLogs(logs);
        } else {
          setActivityLogs([
            { id: 1, childId: 1, childName: 'Amara', title: 'David chooses courage', type: 'Story', attempts: 1, time: 'Today' },
            { id: 2, childId: 1, childName: 'Amara', title: 'Build Psalm 119:105', type: 'Word game', attempts: 3, time: 'Today' },
            { id: 3, childId: 2, childName: 'Tobi', title: 'A kind choice at lunch', type: 'Decision lab', attempts: 1, time: 'Yesterday' },
          ]);
        }

        if (storedHelp?.child) {
          setHelpRequest(storedHelp);
        }
      } catch { /* Keep the demo family available. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!savedNotice) return;
    const timer = window.setTimeout(() => setSavedNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [savedNotice]);

  useEffect(() => {
    if (!hydrated) return;
    fetch('/api/family/today')
      .then((res) => (res.ok ? (res.json() as Promise<{ children: TodayActivityChild[]; timezone: string }>) : null))
      .then((data) => {
        if (data?.children) {
          setTodayActivity(data.children);
          setActivityTimezone(data.timezone || 'UTC');
          if (!selectedActivityChild && data.children[0]) setSelectedActivityChild(data.children[0].child.id);
        }
      })
      .catch(() => { /* Real backend not reachable — section stays hidden. */ });

    fetch('/api/notifications?limit=15')
      .then((res) => (res.ok ? (res.json() as Promise<{ notifications: NotificationItem[] }>) : null))
      .then((data) => { if (data?.notifications) setNotifications(data.notifications); })
      .catch(() => { /* Non-blocking. */ });

    fetch('/api/family/classrooms')
      .then((res) => (res.ok ? (res.json() as Promise<{ memberships: typeof classMemberships }>) : null))
      .then((data) => { if (data?.memberships) setClassMemberships(data.memberships); })
      .catch(() => { /* Non-blocking. */ });
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  function approveClassroom(classroomId: string, childId: string, approved: boolean) {
    setClassMemberships((current) => current.map((m) => (m.classroomId === classroomId && m.childId === childId ? { ...m, approved } : m)));
    fetch(`/api/classrooms/${classroomId}/students/${childId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    }).catch(() => {});
  }

  function markNotificationRead(id: string) {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: true }),
    }).catch(() => {});
  }

  const children = family.children.length ? family.children : fallbackFamily.children;
  const activeChild = children.find((child) => child.id === selectedChild) || children[0];
  // Real learning data — the same Skill Profile the child sees on their own Character page,
  // sourced from every Arcade game's shared session/XP pipeline, not a parent-only mock.
  const activeChildSkillProfile = hydrated ? getSkillProfile(activeChild.id) : null;

  const totalCompletedAcrossFamily = Object.values(childProgressMap).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
  const activeChildCompleted = childProgressMap[activeChild.id] || [];
  const activeChildPoints = activeChildCompleted.length * 8;
  const versesLearnedCount = activeChildCompleted.filter((t) => t.includes('Psalm') || t.includes('John') || t.includes('Proverbs') || t.includes('Philippians') || t.includes('Genesis') || t.includes('Matthew')).length;

  function addAssignment() {
    const existing = assignments.find((item) => item.childId === selectedChild && item.title === lesson);
    const next = existing ? assignments.map((item) => item.id === existing.id ? { ...item, due } : item) : [...assignments, { id: Date.now(), childId: selectedChild, title: lesson, due }];
    setAssignments(next);
    localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(next));
    setSavedNotice(existing ? `${lesson} was already assigned. The due date is now ${due}.` : `${lesson} was assigned to ${activeChild.name}.`);
  }

  function saveSettings(next: Family) {
    setFamily(next);
    localStorage.setItem('lanternLionDemoFamily', JSON.stringify(next));
    setSavedNotice('Family settings saved on this device.');
  }

  function sendMessage() {
    if (!message.trim()) return;
    setMessages((current) => [...current, { from: 'You', body: message.trim(), time: 'Just now' }]);
    setMessage('');
    setSavedNotice('Your demo message was added.');
  }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span></span><p>Opening the parent space…</p></main>;

  if (!hasFamily) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Let’s set up your family first.</p>
        <Link href="/family-setup" className="button button-primary">Set up your family</Link>
      </main>
    );
  }

  return (
    <main className="parent-dashboard-page">
      <aside className="parent-sidebar">
        <Link className="parent-dashboard-brand" href="/">
          <Image src="/lantern-lion-logo.png" alt="" width={58} height={58} priority />
          <span><strong>Lantern &amp; Lion</strong><small>Parent space</small></span>
        </Link>
        <nav aria-label="Parent dashboard">
          <button aria-pressed={page === 'overview'} className={page === 'overview' ? 'active' : ''} onClick={() => setPage('overview')}><span>H</span>Home</button>
          <button aria-pressed={page === 'children'} className={page === 'children' ? 'active' : ''} onClick={() => setPage('children')}><span>C</span>Children</button>
          <button aria-pressed={page === 'assignments'} className={page === 'assignments' ? 'active' : ''} onClick={() => setPage('assignments')}><span>A</span>Assignments</button>
          <button aria-pressed={page === 'messages'} className={page === 'messages' ? 'active' : ''} onClick={() => setPage('messages')}><span>M</span>Messages <b>1</b></button>
          <button aria-pressed={page === 'settings'} className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}><span>S</span>Settings</button>
        </nav>
        <div className="parent-sidebar-bottom">
          <a href={`/child-dashboard?preview=1&child=${activeChild.id}`}>Preview child space</a>
          <a href="/family-setup">Edit family &amp; profiles</a>
          <a href="/parent-access" onClick={() => localStorage.removeItem('lanternLionDemoSession')}>Sign out</a>
        </div>
      </aside>

      <section className="parent-dashboard-main">
        <header className="parent-dashboard-top">
          <div>
            <p>{family.familyName}</p>
            <span>Live Parent Dashboard · {children.length} {children.length === 1 ? 'child' : 'children'}</span>
          </div>
          <div className="parent-account-button">
            <span>{parentName.slice(0, 1)}</span>
            <div><strong>{parentName}</strong><small>Family owner</small></div>
          </div>
        </header>

        {page === 'overview' && (
          <div className="parent-dashboard-content">
            <div className="parent-page-title">
              <p className="parent-dash-kicker">This week at home</p>
              <h1>Good morning, {parentName.split(' ')[0]}.</h1>
              <p>Real-time updates on what your children are exploring, stories finished, and any place where help was requested.</p>
            </div>

            <div className="parent-metric-grid">
              <article>
                <span>Finished</span>
                <strong>{totalCompletedAcrossFamily}</strong>
                <small>activities across family</small>
              </article>
              <article>
                <span>Returned</span>
                <strong>3 days</strong>
                <small>active return streak</small>
              </article>
              <article>
                <span>Practised</span>
                <strong>{versesLearnedCount}</strong>
                <small>memory verses</small>
              </article>
              <article className={helpRequest ? 'attention' : ''}>
                <span>Needs you</span>
                <strong>{helpRequest ? '1' : '0'}</strong>
                <small>{helpRequest ? 'activity to review' : 'all on track'}</small>
              </article>
            </div>

            {todayActivity.length > 0 && (
              <section className="parent-activity-section" aria-label="Today's learning activity">
                <div className="panel-heading">
                  <div>
                    <p className="parent-dash-kicker">Today&apos;s activity</p>
                    <h2>Learning today</h2>
                  </div>
                  {todayActivity.length > 1 && (
                    <select value={selectedActivityChild || ''} onChange={(e) => setSelectedActivityChild(e.target.value)}>
                      {todayActivity.map((item) => (
                        <option key={item.child.id} value={item.child.id}>{item.child.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                {(() => {
                  const active = todayActivity.find((item) => item.child.id === selectedActivityChild) || todayActivity[0];
                  const summary = active.summary;
                  return (
                    <>
                      <div className="parent-activity-tiles">
                        <div><b>{formatActiveTime(summary?.active_seconds || 0)}</b><span>🕐 Active time</span></div>
                        <div><b>{summary?.games_played || 0}</b><span>🎮 Games played</span></div>
                        <div><b>{summary?.lessons_completed || 0}</b><span>📚 Lessons</span></div>
                        <div><b>{summary?.xp_earned || 0}</b><span>⭐ XP earned</span></div>
                        <div><b>{summary?.quests_completed || 0}</b><span>🔥 Quests</span></div>
                        <div><b>{summary?.achievements_earned || 0}</b><span>🏆 Achievements</span></div>
                      </div>
                      <ul className="parent-activity-timeline">
                        {active.timeline.length === 0 && <li>No activity yet today.</li>}
                        {active.timeline.map((event, i) => (
                          <li key={i}>
                            <time>{new Date(event.occurredAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: activityTimezone })}</time>
                            <span>{EVENT_LABELS[event.eventType] || event.eventType}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  );
                })()}
              </section>
            )}

            {classMemberships.some((m) => !m.approved) && (
              <section className="parent-activity-section" aria-label="Class join requests">
                <div className="panel-heading">
                  <div>
                    <p className="parent-dash-kicker">Class requests</p>
                    <h2>Waiting for your approval</h2>
                  </div>
                </div>
                <ul className="parent-notification-list">
                  {classMemberships.filter((m) => !m.approved).map((m) => (
                    <li key={`${m.classroomId}-${m.childId}`}>
                      <strong>{m.childName}</strong> wants to join <strong>{m.classroomName}</strong>
                      <div style={{ marginTop: 8 }}>
                        <button className="button button-primary" onClick={() => approveClassroom(m.classroomId, m.childId, true)}>Approve</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {notifications.length > 0 && (
              <section className="parent-activity-section" aria-label="Notifications">
                <div className="panel-heading">
                  <div>
                    <p className="parent-dash-kicker">Notifications</p>
                    <h2>Recent updates</h2>
                  </div>
                </div>
                <ul className="parent-notification-list">
                  {notifications.map((n) => (
                    <li key={n.id} className={n.read_at ? '' : 'unread'} onClick={() => !n.read_at && markNotificationRead(n.id)}>
                      <strong>{n.title}</strong>
                      <p style={{ margin: '4px 0 0' }}>{n.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="parent-overview-grid">
              <section className="family-progress-panel">
                <div className="panel-heading">
                  <div>
                    <p className="parent-dash-kicker">Children</p>
                    <h2>Learning this week</h2>
                  </div>
                  <button onClick={() => setPage('children')}>View full reports →</button>
                </div>
                <div className="parent-child-rows">
                  {children.map((child, index) => {
                    const cDone = childProgressMap[child.id] || (index === 0 ? activeChildCompleted : []);
                    const cPoints = 42 + cDone.length * 8;
                    return (
                      <article key={child.id}>
                        <span className={child.age >= 13 ? 'teen' : ''}>{child.name.slice(0, 1)}</span>
                        <div>
                          <strong>{child.name}</strong>
                          <small>
                            {child.age >= 13 ? 'Lion’s Den (Teen)' : 'The Lantern Club'} · ★ {cPoints} pts
                          </small>
                          <div>
                            <i style={{ width: `${Math.min(100, Math.max(25, cDone.length * 20))}%` }} />
                          </div>
                        </div>
                        <b>{cDone.length} done</b>
                        <button onClick={() => { setSelectedChild(child.id); setPage('children'); }}>
                          View
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="parent-attention-panel">
                <p className="parent-dash-kicker">Needs a little help</p>
                <h2>{helpRequest ? 'Activity flagged for review' : 'No alerts right now'}</h2>
                {helpRequest ? (
                  <button type="button" className="flagged-activity flagged-activity-clickable" onClick={() => setShowHelpDetail(true)}>
                    <span>!</span>
                    <div>
                      <strong>{helpRequest.child} asked for help</strong>
                      <small>Category: {helpRequest.kind} · {new Date(helpRequest.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <b className="flagged-activity-cta">View details →</b>
                  </button>
                ) : (
                  <div className="flagged-activity">
                    <span>✓</span>
                    <div>
                      <strong>All clear</strong>
                      <small>Your children are progressing smoothly through their lessons.</small>
                    </div>
                  </div>
                )}
                <p>Asking for help is celebrated in Lantern &amp; Lion. Use flagged moments for warm family conversations.</p>
                {helpRequest && (
                  <button onClick={() => { localStorage.removeItem('lanternLionDemoHelpRequest'); setHelpRequest(null); setShowHelpDetail(false); setSavedNotice('Help flag marked as resolved.'); }}>
                    Mark as reviewed
                  </button>
                )}
              </aside>
            </div>

            {showHelpDetail && helpRequest && (
              <div className="help-overlay" role="presentation" onClick={() => setShowHelpDetail(false)}>
                <section className="help-dialog help-report-modal" role="dialog" aria-modal="true" aria-labelledby="help-report-title" onClick={(event) => event.stopPropagation()}>
                  <button className="close-help" aria-label="Close" onClick={() => setShowHelpDetail(false)}>×</button>
                  <p className="parent-dash-kicker">Flagged by Lumen · {new Date(helpRequest.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <h2 id="help-report-title">{helpRequest.child} · {helpRequest.kind}</h2>
                  {helpRequest.message && (
                    <div className="help-report-quote">
                      <span className="parent-dash-kicker">What {helpRequest.child} said</span>
                      <blockquote>“{helpRequest.message}”</blockquote>
                    </div>
                  )}
                  <div className="help-report-suggestion">
                    <span className="parent-dash-kicker">🏮 Lumen’s suggestion</span>
                    <p>{suggestionFor(helpRequest)}</p>
                  </div>
                  <div className="help-report-actions">
                    <button className="button button-primary" onClick={() => { localStorage.removeItem('lanternLionDemoHelpRequest'); setHelpRequest(null); setShowHelpDetail(false); setSavedNotice('Help flag marked as resolved.'); }}>
                      Mark as reviewed
                    </button>
                    <button className="button button-secondary" onClick={() => setShowHelpDetail(false)}>Close</button>
                  </div>
                </section>
              </div>
            )}

            <section className="recent-learning">
              <div className="panel-heading">
                <div>
                  <p className="parent-dash-kicker">Real-time log</p>
                  <h2>Recent child activity</h2>
                </div>
              </div>
              <div>
                {activityLogs.slice(0, 5).map((log) => (
                  <article key={log.id}>
                    <span>{log.type.slice(0, 1)}</span>
                    <div>
                      <strong>{log.title}</strong>
                      <small>{log.childName} · {log.type} {log.attempts > 1 ? `(${log.attempts} attempts)` : 'finished'}</small>
                    </div>
                    <b>{log.time}</b>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {page === 'children' && (
          <div className="parent-dashboard-content">
            <div className="parent-page-title">
              <p className="parent-dash-kicker">Child profiles</p>
              <h1>{activeChild.name}’s detailed progress</h1>
              <p>Review completed stories, memory verses, quiz answers, and points earned.</p>
            </div>

            <div className="child-profile-tabs">
              {children.map((child) => (
                <button
                  key={child.id}
                  className={selectedChild === child.id ? 'active' : ''}
                  onClick={() => setSelectedChild(child.id)}
                >
                  <span>{child.name.slice(0, 1)}</span>
                  <div>
                    <strong>{child.name}</strong>
                    <small>Age {child.age} · {child.age >= 13 ? 'Lion’s Den' : 'Lantern Club'}</small>
                  </div>
                </button>
              ))}
              <a href="/family-setup">Manage profiles in family setup</a>
            </div>

            <section className="single-child-report">
              <div className="single-child-head">
                <span>{activeChild.name.slice(0, 1)}</span>
                <div>
                  <p className="parent-dash-kicker">{activeChild.age >= 13 ? 'Lion’s Den (Ages 13–17)' : 'The Lantern Club (Ages 5–12)'}</p>
                  <h2>{activeChild.name}’s activity report</h2>
                  <small>PIN: {activeChild.pin} · Username: @{activeChild.username || activeChild.name.toLowerCase()}</small>
                </div>
                <a href={`/child-dashboard?preview=1&child=${activeChild.id}`}>Preview child dashboard</a>
              </div>

              <div className="child-report-metrics">
                <article>
                  <strong>{activeChildCompleted.length}</strong>
                  <span>Activities finished</span>
                </article>
                <article>
                  <strong>{activeChildPoints}</strong>
                  <span>Light points earned</span>
                </article>
                <article>
                  <strong>{versesLearnedCount}</strong>
                  <span>Memory verses locked</span>
                </article>
              </div>

              {activeChildSkillProfile && activeChildSkillProfile.totalSessions > 0 && (
                <section className="parent-skill-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="parent-dash-kicker">What {activeChild.name} is learning</p>
                      <h2>Level {activeChildSkillProfile.level.level} — {activeChildSkillProfile.level.title}</h2>
                    </div>
                    <Link href="/arcade">Lantern Arcade →</Link>
                  </div>
                  <p className="parent-skill-note">Not screen time — real practice. This comes from every Arcade game {activeChild.name} has played.</p>
                  {activeChildSkillProfile.skills.length > 0 && (
                    <div className="char-skill-list parent-skill-list">
                      {activeChildSkillProfile.skills.map((s) => (
                        <div key={s.skill} className="char-skill-row">
                          <span>{s.label}</span>
                          <span className="char-skill-stars" aria-label={`${s.stars} out of 5`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} aria-hidden="true">{i < s.stars ? '⭐' : '☆'}</span>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeChildSkillProfile.games.length > 0 && (
                    <div className="char-game-performance-list">
                      {activeChildSkillProfile.games.map((g) => (
                        <div key={g.gameId} className="char-game-performance-row">
                          <span aria-hidden="true">{g.icon}</span>
                          <strong>{g.name}</strong>
                          <span className="char-game-performance-bar"><i style={{ width: `${g.avgAccuracy}%` }} /></span>
                          <b>{g.avgAccuracy}%</b>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <div className="child-report-list">
                {activeChildCompleted.length > 0 ? (
                  activeChildCompleted.map((actTitle, i) => (
                    <article key={i}>
                      <span className="complete">Done</span>
                      <div>
                        <strong>{actTitle}</strong>
                        <small>Completed in child space</small>
                      </div>
                      <b>Today</b>
                    </article>
                  ))
                ) : (
                  <article>
                    <span>Next</span>
                    <div>
                      <strong>David chooses courage</strong>
                      <small>Recommended starting story</small>
                    </div>
                    <b>Not started</b>
                  </article>
                )}
                {assignments
                  .filter((a) => a.childId === activeChild.id)
                  .map((asgn) => (
                    <article key={asgn.id}>
                      <span className="complete">Assigned</span>
                      <div>
                        <strong>{asgn.title}</strong>
                        <small>Due {asgn.due} · Assigned by parent</small>
                      </div>
                      <b>In progress</b>
                    </article>
                  ))}
              </div>
            </section>
          </div>
        )}

        {page === 'assignments' && (
          <div className="parent-dashboard-content">
            <div className="parent-page-title">
              <p className="parent-dash-kicker">Assignments</p>
              <h1>Direct what they explore next.</h1>
              <p>Assign specific stories or scripture builders to guide their learning pace.</p>
            </div>
            <section className="assignment-builder">
              <div>
                <label>
                  Child
                  <select value={selectedChild} onChange={(event) => setSelectedChild(Number(event.target.value))}>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Activity
                  <select value={lesson} onChange={(event) => setLesson(event.target.value)}>
                    {lessonOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Finish by
                  <select value={due} onChange={(event) => setDue(event.target.value)}>
                    <option>Friday</option>
                    <option>Sunday</option>
                    <option>Next Wednesday</option>
                    <option>No due date</option>
                  </select>
                </label>
                <button className="button button-primary" onClick={addAssignment}>Assign activity</button>
              </div>
              <aside>
                <p className="parent-dash-kicker">Current assignments</p>
                {assignments.length ? (
                  assignments.map((item) => (
                    <article key={item.id}>
                      <span>{children.find((child) => child.id === item.childId)?.name.slice(0, 1) || 'C'}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{children.find((child) => child.id === item.childId)?.name} · Due {item.due}</small>
                      </div>
                      <button onClick={() => {
                        const next = assignments.filter((assignment) => assignment.id !== item.id);
                        setAssignments(next);
                        localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(next));
                      }}>
                        Remove
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="empty-assignment">Nothing is assigned right now.</p>
                )}
              </aside>
            </section>
          </div>
        )}

        {page === 'messages' && (
          <div className="parent-dashboard-content">
            <div className="parent-page-title">
              <p className="parent-dash-kicker">Teacher messages</p>
              <h1>Keep the conversation with grown-ups.</h1>
              <p>Teachers can message you about assigned groups. Children never receive private teacher messages.</p>
            </div>
            <section className="message-layout">
              <aside>
                <button className="active">
                  <span>G</span>
                  <div><strong>Mrs Grace</strong><small>Children’s group · 1 new</small></div>
                </button>
                <button>
                  <span>D</span>
                  <div><strong>Mr Daniel</strong><small>Teen group</small></div>
                </button>
              </aside>
              <div className="message-thread">
                <header>
                  <span>G</span>
                  <div><strong>Mrs Grace</strong><small>Assigned teacher for {children[0].name}</small></div>
                </header>
                <div className="message-list">
                  {messages.map((item, index) => (
                    <article className={item.from === 'You' ? 'sent' : ''} key={`${item.time}-${index}`}>
                      <span>{item.from}</span>
                      <p>{index === 0 && item.from === 'Mrs Grace' ? `${children[0].name} asked a thoughtful question about courage today.` : item.body}</p>
                      <small>{item.time}</small>
                    </article>
                  ))}
                </div>
                <div className="message-compose">
                  <label className="sr-only" htmlFor="parent-message">Message Mrs Grace</label>
                  <textarea id="parent-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a short message to Mrs Grace" />
                  <button onClick={sendMessage}>Send message</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {page === 'settings' && (
          <div className="parent-dashboard-content">
            <div className="parent-page-title">
              <p className="parent-dash-kicker">Family settings</p>
              <h1>Privacy choices in one place.</h1>
              <p>These demo settings are saved on this device. Child-facing screens cannot change them.</p>
            </div>
            <section className="parent-settings-card">
              <div>
                <h2>Sharing and contact</h2>
                <p>Choose how work stays private and when you hear from the club.</p>
              </div>
              <div className="parent-setting-list">
                <label>
                  <div>
                    <strong>Keep creations inside the family</strong>
                    <small>Artwork and written answers stay private unless you share them.</small>
                  </div>
                  <input type="checkbox" checked={family.privateArtwork} onChange={(event) => saveSettings({ ...family, privateArtwork: event.target.checked })} />
                  <span></span>
                </label>
                <label>
                  <div>
                    <strong>Allow assigned teacher messages</strong>
                    <small>Teachers can contact this parent account, never the child privately.</small>
                  </div>
                  <input type="checkbox" checked={family.teacherMessages} onChange={(event) => saveSettings({ ...family, teacherMessages: event.target.checked })} />
                  <span></span>
                </label>
                <label>
                  <div>
                    <strong>Weekly progress email</strong>
                    <small>One summary each week. No daily reminders.</small>
                  </div>
                  <input type="checkbox" checked={family.progressEmails} onChange={(event) => saveSettings({ ...family, progressEmails: event.target.checked })} />
                  <span></span>
                </label>
              </div>

              <div className="parent-classroom-connect-section">
                <h3>Sunday School &amp; School Classroom</h3>
                <p>Enter your child’s group code to sync with approved teachers and Sunday School classes.</p>
                {connectedClass ? (
                  <div className="parent-code-box">
                    <span>Current Class Link:</span>
                    <strong>{connectedClass.name} (Code: {connectedClass.code}) · Teacher {connectedClass.teacher}</strong>
                  </div>
                ) : (
                  <div className="parent-code-box">
                    <span>No class connected yet.</span>
                    <strong>Ask your child to enter a class code from their dashboard.</strong>
                  </div>
                )}
              </div>

              <div className="parent-settings-links">
                <a href="/family-setup">Edit family and child profiles (Parent only)</a>
                <a href="/parent-access">Parent account details</a>
              </div>
            </section>
          </div>
        )}

        {savedNotice && (
          <div className="parent-dashboard-toast" role="status">
            <span>✓</span>
            <p>{savedNotice}</p>
            <button onClick={() => setSavedNotice('')}>Close</button>
          </div>
        )}
      </section>
    </main>
  );
}
