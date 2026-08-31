'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatAssistant from '../chat-assistant';
import { curriculumModules, type CurriculumModule } from '../curriculum-data';
import { getModuleLessons } from '../curriculum-lessons';
import StudioAudioPlayer from '../components/StudioAudioPlayer';
import { computeStreak, getCompletedCount } from '../daily-quests/progression';
import { getOrCreateTodaySet, readHistory } from '../daily-quests/storage';
import { CharacterAvatar } from '../character/components';
import { ItemIllustration } from '../character/item-icons';
import { getItem } from '../character/catalog';
import { readAppearance, readEquipment, readCharacterName } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { useActivityHeartbeat } from '../lib/activity/idle-tracker';
import { StreakCard } from '../lib/streak/StreakCard';
import { claimStreakMilestoneIfNew } from '../lib/streak/client';
import type { StreakStatus } from '../lib/streak/server';
import { LeagueCard } from '../lib/leagues/LeagueCard';
import { getLeaguePod } from '../lib/leagues/storage';
import { getNextMissionRecommendation } from '../adventure/progression';
import { loadWorldContext } from '../adventure/storage';
import { getStoryDashboardSummary } from '../stories/engine';
import { STORY_CATALOG } from '../stories/catalog';
import { LearningJourneyCard, type LearningPlanResponse } from '../lib/adaptive/LearningJourneyCard';

type Child = { id: number; name: string; username?: string; age: number; avatar: string; pin: string };
type View = 'today' | 'library' | 'progress';
type ModuleFilter = 'All lessons' | 'Not started' | 'In progress' | 'Completed';
type ModuleProgressEntry = { completedIndices: number[]; lastCompletedIndex: number };

const fallbackChildren: Child[] = [
  { id: 1, name: 'Amara', age: 9, avatar: 'lion', pin: '2468' },
  { id: 2, name: 'Tobi', age: 14, avatar: 'lantern', pin: '1357' },
];

function trackForAge(age: number): CurriculumModule['track'] {
  if (age <= 5) return 'early';
  if (age <= 10) return 'pathfinder';
  return 'teen';
}

const trackLabel: Record<CurriculumModule['track'], string> = {
  early: 'Lantern Explorers',
  pathfinder: 'Brave Pathfinders',
  teen: 'The Lion’s Den',
  family: 'All-Age Family Quest',
};

const toneForTrack: Record<CurriculumModule['track'], string> = {
  early: 'gold',
  pathfinder: 'teal',
  teen: 'coral',
  family: 'sky',
};

const trackEmoji: Record<CurriculumModule['track'], string> = {
  early: '🏮',
  pathfinder: '🧭',
  teen: '🦁',
  family: '🌟',
};

function readModuleProgressForChild(childId: number): Record<string, ModuleProgressEntry> {
  try {
    const progressMap = JSON.parse(localStorage.getItem('lanternLionModuleProgress') || '{}');
    return progressMap?.[childId] || {};
  } catch {
    return {};
  }
}

export default function ChildDashboardPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>(fallbackChildren);
  const [activeId, setActiveId] = useState<number>(fallbackChildren[0].id);
  const [view, setView] = useState<View>('today');
  const [familyData, setFamilyData] = useState({ familyName: 'The Adeyemi Family', parentName: 'Jordan Adeyemi', country: 'Nigeria' });
  const [showHelp, setShowHelp] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [helpNotice, setHelpNotice] = useState('');
  const [filter, setFilter] = useState<ModuleFilter>('All lessons');
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgressEntry>>({});
  const [dailySummary, setDailySummary] = useState({ completed: 0, total: 4, streak: 0 });
  const [charAppearance, setCharAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [charEquipment, setCharEquipment] = useState<CharacterEquipment>({});
  const [charDisplayName, setCharDisplayName] = useState<string>('Amara');
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const closeHelpRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [classError, setClassError] = useState('');
  const [connectedClass, setConnectedClass] = useState<{ id: number; name: string; ageBand: string; code: string; teacher: string } | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [todaySummary, setTodaySummary] = useState<{ active_seconds: number; games_played: number; quests_completed: number; xp_earned: number; achievements_earned: number } | null>(null);
  const [learningStreak, setLearningStreak] = useState<StreakStatus | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<{ label: string; coins: number; gems: number } | null>(null);
  const [learningPlan, setLearningPlan] = useState<LearningPlanResponse | null>(null);

  useActivityHeartbeat(hydrated && !isPreview);

  useEffect(() => {
    if (!hydrated || isPreview) return;
    fetch('/api/child/learning-plan')
      .then((res) => (res.ok ? (res.json() as Promise<LearningPlanResponse>) : null))
      .then((data) => { if (data) setLearningPlan(data); })
      .catch(() => { /* Offline — widget just stays hidden. */ });
  }, [hydrated, isPreview]);

  useEffect(() => {
    if (!hydrated || isPreview) return;
    fetch('/api/child/today')
      .then((res) => (res.ok ? (res.json() as Promise<{ summary: typeof todaySummary; streak: StreakStatus }>) : null))
      .then((data) => {
        if (data?.summary) setTodaySummary(data.summary);
        if (data?.streak) {
          setLearningStreak(data.streak);
          const milestone = claimStreakMilestoneIfNew(activeId, data.streak.currentStreak);
          if (milestone) {
            setMilestoneToast(milestone);
            window.setTimeout(() => setMilestoneToast(null), 5000);
          }
        }
      })
      .catch(() => { /* Offline — widget just stays hidden. */ });
  }, [hydrated, isPreview, activeId]);

  async function fetchStreakCalendar() {
    try {
      const res = await fetch('/api/child/streak-calendar?days=7');
      if (!res.ok) return [];
      const data = (await res.json()) as { calendar: { date: string; state: 'complete' | 'grace' | 'pending' | 'none' }[] };
      return data.calendar || [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const parentSession = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null');
        // Preview mode only exists for a signed-in parent looking at their own
        // child's dashboard — without the parentSession check, anyone could
        // view any child's dashboard by adding `?preview=1&child=<id>` to the URL.
        const previewMode = params.get('preview') === '1' && Boolean(parentSession);
        const previewChildId = Number(params.get('child'));
        setIsPreview(previewMode);

        const family = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
        const childSession = JSON.parse(localStorage.getItem('lanternLionChildSession') || 'null');
        const savedClass = JSON.parse(localStorage.getItem('lanternLionConnectedClass') || 'null');

        if (savedClass) setConnectedClass(savedClass);

        if (family) {
          setFamilyData({
            familyName: family.familyName || 'The Adeyemi Family',
            parentName: parentSession?.name || 'Jordan Adeyemi',
            country: family.country || 'Nigeria',
          });
        }

        let currentId: number | null = null;
        if (previewMode && previewChildId) {
          // Parent preview — the id comes from a trusted, parent-only link
          // (parent-dashboard), not from the signed-in child's own session.
          if (family?.children?.length) {
            setChildren(family.children);
            currentId = family.children.some((item: Child) => item.id === previewChildId) ? previewChildId : family.children[0].id;
          }
        } else if (childSession?.childId && family?.children?.some((item: Child) => item.id === childSession.childId)) {
          // The signed-in session is the ONLY trustworthy source of "who is this."
          // Never fall back to family.children[0] when the session doesn't match —
          // that would silently show this child a different sibling's dashboard.
          setChildren(family.children);
          currentId = childSession.childId;
        }

        if (currentId === null) {
          router.replace('/child-access');
          return;
        }

        const progressForCurrent = readModuleProgressForChild(currentId);
        setActiveId(currentId);
        setModuleProgress(progressForCurrent);
        setCharAppearance(readAppearance(currentId));
        setCharEquipment(readEquipment(currentId));
        const matchedChild = (family?.children || fallbackChildren).find((c: Child) => c.id === currentId);
        setCharDisplayName(readCharacterName(currentId, matchedChild?.name || 'Adventurer'));

        const todaySet = getOrCreateTodaySet(currentId, { moduleProgress: progressForCurrent, masteredQuestIds: [], kind: 'child' });
        setDailySummary({
          completed: getCompletedCount(todaySet),
          total: todaySet.quests.length,
          streak: computeStreak(readHistory(currentId)).current,
        });
      } catch { /* Keep demo content available. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!showHelp) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeHelpRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowHelp(false); return; }
      if (event.key !== 'Tab') return;
      const dialog = closeHelpRef.current?.closest<HTMLElement>('.help-dialog');
      const focusable: HTMLElement[] = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')) : [];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    const triggerEl = helpTriggerRef.current;
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); triggerEl?.focus(); };
  }, [showHelp]);

  useEffect(() => {
    if (!showProfiles) return;
    const close = (event: Event) => {
      if ((event as KeyboardEvent).key && (event as KeyboardEvent).key !== 'Escape') return;
      if (event.type === 'pointerdown' && (event.target as HTMLElement).closest('.profile-switch')) return;
      setShowProfiles(false); window.setTimeout(() => profileButtonRef.current?.focus(), 0);
    };
    document.addEventListener('keydown', close); document.addEventListener('pointerdown', close);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close); };
  }, [showProfiles]);

  const child = children.find((item) => item.id === activeId) || children[0];
  const teen = child.age >= 13;
  const childTrack = trackForAge(child.age);
  const trackModules = curriculumModules.filter((m) => m.track === childTrack);

  function lessonCountFor(moduleId: string) {
    const mod = curriculumModules.find((m) => m.id === moduleId);
    return mod ? getModuleLessons(mod).length : 0;
  }
  function doneCountFor(moduleId: string) {
    return moduleProgress[moduleId]?.completedIndices.length || 0;
  }
  function isModuleStarted(moduleId: string) {
    return doneCountFor(moduleId) > 0;
  }
  function isModuleComplete(moduleId: string) {
    const total = lessonCountFor(moduleId);
    return total > 0 && doneCountFor(moduleId) >= total;
  }

  const totalSubLessonsCompleted = trackModules.reduce((sum, m) => sum + doneCountFor(m.id), 0);
  const completedModulesCount = trackModules.filter((m) => isModuleComplete(m.id)).length;
  const goalDone = Math.min(5, completedModulesCount);
  const points = totalSubLessonsCompleted * 8;

  const continueModule = trackModules.find((m) => !isModuleComplete(m.id)) || trackModules[0];
  const continueLessons = continueModule ? getModuleLessons(continueModule) : [];
  const continueDoneCount = continueModule ? doneCountFor(continueModule.id) : 0;
  const continueModuleComplete = continueModule ? isModuleComplete(continueModule.id) : false;

  function statsForChild(c: Child) {
    const track = trackForAge(c.age);
    const modules = curriculumModules.filter((m) => m.track === track);
    const progress = c.id === activeId ? moduleProgress : readModuleProgressForChild(c.id);
    const done = modules.reduce((sum, m) => sum + (progress[m.id]?.completedIndices.length || 0), 0);
    return { track, done, points: done * 8 };
  }

  const filteredModules = trackModules.filter((m) => {
    if (filter === 'Not started') return !isModuleStarted(m.id);
    if (filter === 'In progress') return isModuleStarted(m.id) && !isModuleComplete(m.id);
    if (filter === 'Completed') return isModuleComplete(m.id);
    return true;
  });


  function submitHelp(kind: string) {
    const report = { child: child.name, kind, time: new Date().toISOString() };
    localStorage.setItem('lanternLionDemoHelpRequest', JSON.stringify(report));
    setShowHelp(false);
    setHelpNotice('Your grown-up has been told. You did the right thing by asking.');
  }

  function handleChatSafetyFlag(message: string) {
    const report = { child: child.name, kind: 'Chat: please check in', message, time: new Date().toISOString() };
    localStorage.setItem('lanternLionDemoHelpRequest', JSON.stringify(report));
    setHelpNotice('Your grown-up has been quietly told about your chat, so they can check in with you.');
  }

  // ── Classroom Connection ──────────────────────────────────────
  function connectClassroom() {
    setClassError('');
    const cleanCode = classCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setClassError('Please enter the code provided by your teacher.');
      return;
    }

    // Best-effort real join — requires parent approval before the teacher
    // sees any activity data, tracked server-side alongside the existing
    // local demo class connection below.
    fetch('/api/classrooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode }),
    }).catch(() => { /* Offline/local-only class connection. */ });
    // Matches teacher-dashboard's own DEMO_TEACHER_EMAIL/starterClasses exactly —
    // this fallback is only used for matching a code before any real teacher
    // data exists, and must never be the thing that WRITES `lanternLionTeacherClasses`
    // (see `hasStoredClasses` below), or it would silently overwrite the
    // teacher's real seeded roster with this drifted local copy.
    type TeacherClassroom = { id: number; name: string; ageBand: string; code: string; teacherEmail?: string; teacherName?: string; students?: Array<{ id: number; name: string; age: number; progress: number; needsHelp: boolean; parent: string; approved: boolean }> };
    const starterClasses: TeacherClassroom[] = [
      { id: 1, name: 'Wednesday Explorers', ageBand: 'Ages 8–11', code: 'LION-482', teacherEmail: 'grace@lantern.demo', teacherName: 'Grace Okafor', students: [] },
      { id: 2, name: 'Friday Teen Circle', ageBand: 'Ages 13–16', code: 'LAMP-731', teacherEmail: 'grace@lantern.demo', teacherName: 'Grace Okafor', students: [] },
    ];
    let classList = starterClasses;
    let hasStoredClasses = false;
    try {
      const stored = JSON.parse(localStorage.getItem('lanternLionTeacherClasses') || 'null');
      if (Array.isArray(stored) && stored.length) {
        classList = stored;
        hasStoredClasses = true;
      }
    } catch { /* use starter */ }

    const match = classList.find((c) => c.code.toUpperCase() === cleanCode);
    if (match) {
      const teacherName = match.teacherName || 'the teacher';
      // Register the child into the teacher's actual roster (two-way join) —
      // previously a "connected" child never appeared on the teacher's side.
      // Only write back when a real, teacher-saved class list already exists;
      // writing the local fallback would poison `lanternLionTeacherClasses`
      // with entries that have no `teacherEmail`, hiding every teacher's
      // roster behind the per-teacher isolation filter.
      if (hasStoredClasses) {
        try {
          const nextClassList = classList.map((item) => {
            if (item.id !== match.id) return item;
            const roster = item.students || [];
            if (roster.some((s) => s.id === child.id)) return item;
            return { ...item, students: [...roster, { id: child.id, name: child.name, age: child.age, progress: 0, needsHelp: false, parent: familyData.parentName, approved: true }] };
          });
          localStorage.setItem('lanternLionTeacherClasses', JSON.stringify(nextClassList));
        } catch { /* Roster registration is best-effort in this demo. */ }
      }

      setConnectedClass({ id: match.id, name: match.name, ageBand: match.ageBand, code: match.code, teacher: teacherName });
      localStorage.setItem('lanternLionConnectedClass', JSON.stringify({ id: match.id, name: match.name, ageBand: match.ageBand, code: match.code, teacher: teacherName }));
      setShowClassModal(false);
      setClassCodeInput('');
      setHelpNotice(`Connected to ${match.name} (Teacher ${teacherName})!`);
    } else {
      setClassError('That code didn’t match any open classroom. Check with your teacher or try LION-482.');
    }
  }

  function disconnectClassroom() {
    setConnectedClass(null);
    localStorage.removeItem('lanternLionConnectedClass');
    setHelpNotice('Disconnected from classroom.');
  }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span></span><p>Opening the child space…</p></main>;

  return <main className={`child-dashboard ${teen ? 'child-dashboard-teen' : ''}`}>
    {isPreview && (
      <div className="preview-mode-banner" role="status">
        <span aria-hidden="true">👁️</span>
        <p>You’re viewing a read-only preview of {child.name}’s space. Nothing you do here is saved or sent as {child.name}.</p>
        <Link href="/parent-dashboard" className="button button-secondary">Exit preview</Link>
      </div>
    )}
    {milestoneToast && (
      <div className="streak-milestone-toast" role="status" aria-live="polite">
        <strong>🔥 {milestoneToast.label}!</strong>
        <span>+{milestoneToast.coins} 🪙{milestoneToast.gems > 0 ? ` +${milestoneToast.gems} 💎` : ''}</span>
      </div>
    )}
    <header className="child-topbar"><Link href="/" className="child-logo"><Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority /><span><strong>{teen ? 'Lion’s Den' : 'The Lantern Club'}</strong><small>Lantern &amp; Lion</small></span></Link><nav className="child-nav" aria-label="Child dashboard"><button aria-pressed={view === 'today'} className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>Today</button><Link href="/adventure">🗺️ Adventure</Link><Link href="/stories">📖 Stories</Link><Link href="/character">🧑 Character</Link><Link href="/leagues">🏆 Leagues</Link><Link href="/arcade">🎮 Arcade</Link><button aria-pressed={view === 'library'} className={view === 'library' ? 'active' : ''} onClick={() => setView('library')}>Explore</button><button aria-pressed={view === 'progress'} className={view === 'progress' ? 'active' : ''} onClick={() => setView('progress')}>My progress</button></nav><div className="child-header-actions">{!isPreview && <button ref={helpTriggerRef} className="help-button" onClick={() => setShowHelp(true)}>Ask for help</button>}<div className="profile-switch"><button ref={profileButtonRef} className="profile-button" aria-expanded={showProfiles} aria-controls="child-profile-menu" onClick={() => setShowProfiles(!showProfiles)}><span>{child.name.slice(0,1)}</span><b>{child.name}</b></button>{showProfiles && <div className="profile-menu" id="child-profile-menu"><button type="button" className="child-family-summary-btn" onClick={() => { setShowFamilyModal(true); setShowProfiles(false); }}>🌟 Our family summary</button>{!isPreview && <Link href="/child-access" onClick={() => { fetch('/api/child-auth/logout', { method: 'POST' }).catch(() => {}); localStorage.removeItem('lanternLionChildSession'); localStorage.removeItem('lanternLionActiveChildId'); }} className="child-signout-link">Sign out of {child.name}</Link>}</div>}</div></div></header>

    {view === 'today' && <div className="child-dashboard-body"><section className="child-welcome"><div><p className="child-kicker">{teen ? 'Your weekly practice' : 'Your next light'}</p><h1>Hi, {child.name}. Ready for one good step?</h1><p>{teen ? 'Pick up your courage study, then choose what you want to explore.' : 'Today, David faces something enormous. See what courage looks like before the battle begins.'}</p><div className="daily-stats"><span><b>{goalDone}/5</b> weekly lights</span><span><b>{points}</b> light points</span><span><b>3</b> day return</span></div></div><div className="welcome-lantern" aria-hidden="true"><span></span><i></i><b>{points}</b></div></section>
    {learningStreak && !isPreview && (
      <StreakCard streak={learningStreak} tone={teen ? 'teen' : 'child'} onFetchCalendar={fetchStreakCalendar} />
    )}
    {!isPreview && (
      <LeagueCard
        pod={getLeaguePod(child.id, child.name, child.age, child.avatar, charAppearance)}
        isTeen={teen}
      />
    )}
    {!isPreview && learningPlan && (
      <LearningJourneyCard plan={learningPlan} isTeen={teen} />
    )}
    {todaySummary && (todaySummary.games_played > 0 || todaySummary.quests_completed > 0 || todaySummary.xp_earned > 0 || todaySummary.achievements_earned > 0) && (
      <section className="child-your-day" aria-label="Your day so far">
        <h2>Your day</h2>
        <div className="your-day-stats">
          <span>🔥 {todaySummary.quests_completed} quest{todaySummary.quests_completed === 1 ? '' : 's'} completed</span>
          <span>⭐ {todaySummary.xp_earned} XP earned</span>
          <span>🎮 {todaySummary.games_played} game{todaySummary.games_played === 1 ? '' : 's'} played</span>
          <span>🏆 {todaySummary.achievements_earned} achievement{todaySummary.achievements_earned === 1 ? '' : 's'}</span>
        </div>
      </section>
    )}

      <section className="child-daily-banner">
        <div className="child-daily-banner-head">
          <span className="child-daily-banner-icon" aria-hidden="true">📅</span>
          <div>
            <strong>Today’s Quests</strong>
            <small>{dailySummary.completed}/{dailySummary.total} complete{dailySummary.streak > 0 ? ` · 🔥 ${dailySummary.streak} day streak` : ''}</small>
          </div>
        </div>
        <div className="child-daily-banner-dots" aria-hidden="true">
          {Array.from({ length: dailySummary.total }).map((_, i) => (
            <span key={i} className={i < dailySummary.completed ? 'filled' : ''} />
          ))}
        </div>
        <Link className="button button-primary" href="/daily-quests">
          {dailySummary.completed >= dailySummary.total ? 'View today’s rewards →' : 'Start today’s quests →'}
        </Link>
      </section>

      {(() => {
        const advCtx = loadWorldContext(child.id, teen ? 'teen' : 'child');
        const next = getNextMissionRecommendation(advCtx);
        return (
          <section className="child-adventure-banner">
            <span className="child-adventure-banner-icon" aria-hidden="true">{next.region.icon}</span>
            <div className="child-adventure-banner-copy">
              <span style={{ fontSize: '0.72rem', background: '#1D4ED8', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase' }}>
                Next Expedition
              </span>
              <strong>{next.title}</strong>
              <small>{next.subtitle} — explore the 8 biblical lands and defeat Knowledge Bosses.</small>
            </div>
            <Link className="button button-primary" href={next.actionHref}>
              ▶ Continue Adventure →
            </Link>
          </section>
        );
      })()}

      {(() => {
        const storySummary = getStoryDashboardSummary(child.id, STORY_CATALOG);
        if (!storySummary) return null;
        return (
          <section className="child-adventure-banner" style={{ border: '2.5px solid #FBBF24', background: '#FFFBEB', boxShadow: '4px 4px 0 #8b5cf6' }}>
            <span className="child-adventure-banner-icon" aria-hidden="true">{storySummary.story.heroEmoji}</span>
            <div className="child-adventure-banner-copy">
              <span style={{ fontSize: '0.72rem', background: '#7C3AED', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase' }}>
                {storySummary.resuming ? 'Continue your story' : 'New interactive story'}
              </span>
              <strong>{storySummary.story.title}</strong>
              <small>📖 {storySummary.story.scriptureRange} · ~{storySummary.story.estimatedMinutes} min</small>
            </div>
            <Link className="button button-primary" href={`/stories/${storySummary.story.id}`}>
              {storySummary.resuming ? '▶ Continue Story →' : '▶ Start Story →'}
            </Link>
          </section>
        );
      })()}

      {/* ── Illustrated Adventurer & Gear Showcase ── */}
      <section className="child-character-showcase">
        <div className="child-char-avatar-frame">
          <CharacterAvatar appearance={charAppearance} equipment={charEquipment} size="large" showPedestal={true} />
        </div>
        <div className="child-char-info-col">
          <div className="child-char-badge-row">
            <span className="child-char-tag">🧑 Adventurer Profile</span>
            <span className="child-char-xp-pill">✨ {points} Light XP</span>
          </div>
          <h2>{charDisplayName}</h2>
          <p className="child-char-blurb">
            Equipped and ready for biblical adventure. Complete quests across Eden and Galilee to unlock legendary robes, crowns, and faithful companions.
          </p>

          <div className="child-char-slots-preview">
            <div className="child-char-slot-bubble" title="Headwear">
              <ItemIllustration itemId={charEquipment.headwear || 'starter-cap'} size={32} />
              <span>{charEquipment.headwear ? getItem(charEquipment.headwear)?.name : 'Traveler’s Cap'}</span>
            </div>
            <div className="child-char-slot-bubble" title="Tunic / Cloak">
              <ItemIllustration itemId={charEquipment.clothing || 'starter-tunic'} size={32} />
              <span>{charEquipment.clothing ? getItem(charEquipment.clothing)?.name : 'Traveler’s Tunic'}</span>
            </div>
            <div className="child-char-slot-bubble" title="Footwear">
              <ItemIllustration itemId={charEquipment.shoes || 'starter-sandals'} size={32} />
              <span>{charEquipment.shoes ? getItem(charEquipment.shoes)?.name : 'Simple Sandals'}</span>
            </div>
            {charEquipment.accessory && (
              <div className="child-char-slot-bubble" title="Accessory">
                <ItemIllustration itemId={charEquipment.accessory} size={32} />
                <span>{getItem(charEquipment.accessory)?.name}</span>
              </div>
            )}
            {charEquipment.special && (
              <div className="child-char-slot-bubble child-char-slot-special" title="Special / Companion">
                <ItemIllustration itemId={charEquipment.special} size={32} />
                <span>{getItem(charEquipment.special)?.name}</span>
              </div>
            )}
          </div>

          <div className="child-char-actions">
            <Link href="/character" className="button button-primary child-char-btn">
              Customize Character &amp; Inventory 🎨 →
            </Link>
            <Link href="/adventure" className="button button-secondary child-char-btn">
              Take Into Adventure World 🗺️
            </Link>
          </div>
        </div>
      </section>

      {/* Classroom Connection Banner */}
      <section className="child-classroom-strip">
        <span className="classroom-strip-icon">🏫</span>
        {connectedClass ? (
          <div className="classroom-strip-info">
            <strong>Connected to {connectedClass.name}</strong>
            <small>Teacher: {connectedClass.teacher} · Join code: <b>{connectedClass.code}</b></small>
          </div>
        ) : (
          <div className="classroom-strip-info">
            <strong>Have a Sunday School or School class code?</strong>
            <small>Connect with your teacher to see classroom assignments.</small>
          </div>
        )}
        <button
          type="button"
          className="classroom-strip-btn"
          onClick={() => setShowClassModal(true)}
        >
          {connectedClass ? 'Class details →' : 'Enter join code →'}
        </button>
      </section>

      <section className="continue-layout">
        {continueModule ? (
          <article className="continue-card"><div className="continue-art"><span>01</span><div className="hill hill-one"></div><div className="hill hill-two"></div><i></i></div><div className="continue-copy"><p className="child-kicker">{trackLabel[childTrack]} · Continue your lesson</p><h2>{continueModule.title}</h2><p>{continueModule.description}</p><div className="lesson-progress"><span><i style={{ width: `${(continueDoneCount / Math.max(continueLessons.length, 1)) * 100}%` }} /></span><small>{continueModuleComplete ? 'Finished' : `Lesson ${Math.min(continueDoneCount + 1, continueLessons.length)} of ${continueLessons.length}`}</small></div><Link className="button button-primary" href={`/learn?module=${continueModule.id}`}>{continueModuleComplete ? 'Review this module' : continueDoneCount > 0 ? 'Continue the lesson' : 'Start the lesson'}</Link></div></article>
        ) : (
          <article className="continue-card"><div className="continue-copy"><p className="child-kicker">{trackLabel[childTrack]}</p><h2>New lessons coming soon</h2><p>Check back soon for more in your age group.</p></div></article>
        )}
        <aside className="today-plan"><div className="today-plan-head"><span>{continueModule ? continueModule.title : 'Today’s plan'}</span><b>{continueDoneCount} of {continueLessons.length} done</b></div>{continueLessons.map((lesson, index) => { const done = index < continueDoneCount; const isNext = index === continueDoneCount; return <Link key={lesson.title} className={done ? 'done' : ''} href={`/learn?module=${continueModule?.id}&lesson=${index}`}><span>{done ? '✓' : index + 1}</span><div><strong>{lesson.title}</strong><small>{done ? 'Finished' : isNext ? `${lesson.minutes} minutes` : 'Up next'}</small></div></Link>; })}<p>You can stop after any lesson. Your place is saved on this device.</p></aside></section>

      <section className="child-section"><div className="child-section-head"><div><p className="child-kicker">Lessons for {trackLabel[childTrack]}</p><h2>Made just for your age.</h2></div><button onClick={() => setView('library')}>See all {trackModules.length} lessons →</button></div><div className="dashboard-activity-grid">{trackModules.slice(0, 8).map((mod) => { const total = lessonCountFor(mod.id); const done = doneCountFor(mod.id); return <article className={toneForTrack[mod.track]} key={mod.id}><span className="activity-mark">{mod.title[0]}</span><small>{mod.theme} · {total} lessons</small><h3>{mod.title}</h3><Link href={`/learn?module=${mod.id}`}>{done >= total && total > 0 ? 'Review again' : done > 0 ? 'Continue' : 'Start lesson'}</Link></article>; })}</div></section>

      <section className="verse-strip">
        <span className="verse-mark">V</span>
        <div>
          <p className="child-kicker">Verse on the path</p>
          <blockquote>“{continueModule?.corePassage || 'Your word is a lamp to my feet, and a light for my path.'}”</blockquote>
          <small>{continueModule?.coreVerse || 'Psalm 119:105'}, WEB</small>
          
          <StudioAudioPlayer
            text={`Verse on the path. ${continueModule?.coreVerse || 'Psalm 119:105'}. ${continueModule?.corePassage || 'Your word is a lamp to my feet, and a light for my path.'}`}
            title="Daily Scripture Audio"
            compact={true}
            defaultVoiceId={childTrack === 'teen' ? 'en-GB-Journey-D' : 'en-GB-Journey-F'}
          />
        </div>
        {continueModule && <Link className="button button-secondary" href={`/learn?module=${continueModule.id}`}>Practise this lesson</Link>}
      </section>
    </div>}

    {view === 'library' && <div className="child-dashboard-body dashboard-view"><div className="dashboard-title"><p className="child-kicker">Explore {trackLabel[childTrack]}</p><h1>What do you feel like learning?</h1><p>Every lesson here is made for your age. There’s no endless scroll here.</p></div><div className="dashboard-filters">{(['All lessons','Not started','In progress','Completed'] as ModuleFilter[]).map((item) => <button key={item} aria-pressed={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="dashboard-activity-grid library-grid">{filteredModules.map((mod) => { const total = lessonCountFor(mod.id); const done = doneCountFor(mod.id); return <article className={toneForTrack[mod.track]} key={mod.id}><span className="activity-mark">{mod.title[0]}</span><small>{mod.theme} · {total} lessons</small><h3>{mod.title}</h3><Link href={`/learn?module=${mod.id}`}>{done >= total && total > 0 ? 'Review again' : done > 0 ? 'Continue' : 'Start lesson'}</Link></article>; })}</div>{filteredModules.length === 0 && <p className="dashboard-empty-note">No lessons match this filter yet — try a different one.</p>}</div>}

    {view === 'progress' && <div className="child-dashboard-body dashboard-view"><div className="dashboard-title"><p className="child-kicker">My progress</p><h1>Look how far you’ve come.</h1><p>Small steps count. You never lose points for taking a break or getting an answer wrong.</p></div><div className="progress-overview"><article><span>★</span><strong>{points}</strong><small>Light points</small></article><article><span>M</span><strong>{completedModulesCount}</strong><small>Modules completed</small></article><article><span>D</span><strong>3</strong><small>Days back this week</small></article><article><span>S</span><strong>{totalSubLessonsCompleted}</strong><small>Lessons finished</small></article></div><section className="progress-path"><div><p className="child-kicker">This week</p><h2>Growing in {trackLabel[childTrack]}</h2></div><div className="path-line">{[1,2,3,4,5].map((day) => <span className={day <= goalDone ? 'lit' : ''} key={day}>{day <= goalDone ? '✓' : day}</span>)}</div><p>{goalDone === 5 ? 'Every light is on. Take a rest or explore something new.' : `${5 - goalDone} more ${5 - goalDone === 1 ? 'light' : 'lights'} to finish this path.`}</p></section></div>}
    {helpNotice && <div className="child-help-confirmation" role="status"><span>✓</span><p>{helpNotice}</p><button onClick={() => setHelpNotice('')}>Close</button></div>}
    {showHelp && <div className="help-overlay" role="presentation" onClick={() => setShowHelp(false)}><section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}><button ref={closeHelpRef} className="close-help" aria-label="Close help" onClick={() => setShowHelp(false)}>×</button><p className="child-kicker">You did the right thing</p><h2 id="help-title">What kind of help do you need?</h2><p>A trusted grown-up will see your message. You won’t get in trouble for asking.</p><div><button onClick={() => submitHelp('Something feels wrong')}>Something feels wrong</button><button onClick={() => submitHelp('Stuck in an activity')}>I’m stuck in an activity</button><button onClick={() => submitHelp('Wants their parent')}>I want my parent</button></div><small>If you feel unsafe right now, leave the device and find a trusted grown-up near you.</small></section></div>}

    {/* ── Classroom Code Modal ────────────────────────────── */}
    {showClassModal && (
      <div className="help-overlay" role="presentation" onClick={() => setShowClassModal(false)}>
        <section className="help-dialog classroom-connect-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button className="close-help" aria-label="Close" onClick={() => setShowClassModal(false)}>×</button>
          <div className="classroom-modal-badge"><span>🏫</span></div>
          <p className="child-kicker">Sunday School &amp; Classroom</p>
          <h2>Connect with your Teacher</h2>
          <p className="classroom-modal-lead">
            Enter the join code given to you by your Sunday School teacher or Christian school leader.
          </p>

          {connectedClass ? (
            <div className="classroom-active-box">
              <div className="active-class-meta">
                <span>Currently connected:</span>
                <strong>{connectedClass.name} ({connectedClass.ageBand})</strong>
                <small>Teacher: {connectedClass.teacher} · Code: {connectedClass.code}</small>
              </div>
              {!isPreview && (
                <button className="classroom-disconnect-btn" onClick={disconnectClassroom}>
                  Disconnect from this class
                </button>
              )}
            </div>
          ) : isPreview ? (
            <p className="classroom-error">Connecting to a classroom isn’t available in preview mode.</p>
          ) : (
            <div className="classroom-input-card">
              <label>
                Classroom Join Code
                <input
                  value={classCodeInput}
                  onChange={(e) => { setClassCodeInput(e.target.value.toUpperCase()); setClassError(''); }}
                  placeholder="e.g. LION-482 or LAMP-731"
                  maxLength={12}
                />
              </label>
              {classError && <p className="classroom-error" role="alert">{classError}</p>}
              <div className="classroom-code-hints">
                <span>Demo codes available to try:</span>
                <button type="button" onClick={() => setClassCodeInput('LION-482')}>LION-482 (Wed Explorers)</button>
                <button type="button" onClick={() => setClassCodeInput('LAMP-731')}>LAMP-731 (Teen Circle)</button>
              </div>
              <button className="button button-primary classroom-submit-btn" onClick={connectClassroom}>
                Connect to classroom
              </button>
            </div>
          )}

          <button className="family-text-button modal-cancel-link" onClick={() => setShowClassModal(false)}>
            Close
          </button>
        </section>
      </div>
    )}

    {/* ── Kid-Safe Family Profile Summary Modal ── */}
    {showFamilyModal && (
      <div className="help-overlay" role="presentation" onClick={() => setShowFamilyModal(false)}>
        <section className="help-dialog family-summary-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button className="close-help" aria-label="Close" onClick={() => setShowFamilyModal(false)}>×</button>
          <div className="family-modal-badge"><span>🦁</span></div>
          <p className="child-kicker">Our Family Squad</p>
          <h2>{familyData.familyName}</h2>
          <p className="family-modal-lead">
            Hello <b>{child.name}</b>! Here is how your family is shining in the Bible club together.
          </p>

          <div className="family-modal-meta">
            <div><span>Parent / Guardian:</span> <strong>{familyData.parentName}</strong></div>
            <div><span>Home Country:</span> <strong>{familyData.country}</strong></div>
            <div><span>Family Members:</span> <strong>{children.length} profiles</strong></div>
          </div>

          <div className="family-modal-scores">
            <p className="family-modal-scores-title">Family Member Scoreboard</p>
            <div className="family-modal-child-grid">
              {children.map((c) => {
                const stats = statsForChild(c);
                const isCurrent = c.id === activeId;
                return (
                  <article key={c.id} className={`family-score-card ${isCurrent ? 'current' : ''}`}>
                    <span className="fam-card-avatar">{c.name.slice(0, 1)}</span>
                    <div className="fam-card-info">
                      <strong>
                        {c.name} {isCurrent && <em className="you-tag">(You)</em>}
                      </strong>
                      <small>{trackEmoji[stats.track]} {trackLabel[stats.track]}</small>
                    </div>
                    <div className="fam-card-points">
                      <b>★ {stats.points}</b>
                      <small>{stats.done} lessons finished</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="family-modal-safety-note">
            <span>🛡️ Family Safety Summary</span>
            <p>
              Children have no open chat or public profiles. All progress stays private within your family and connected teachers.
            </p>
          </aside>

          <button className="button button-primary family-modal-close-btn" onClick={() => setShowFamilyModal(false)}>
            Back to my club →
          </button>
        </section>
      </div>
    )}
    {!isPreview && <ChatAssistant mode="child" name={child.name} onSafetyFlag={handleChatSafetyFlag} />}
  </main>;
}
