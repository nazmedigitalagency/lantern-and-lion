'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Child = { id: number; name: string; age: number; avatar: string; pin: string };
type View = 'today' | 'library' | 'progress';

const fallbackChildren: Child[] = [
  { id: 1, name: 'Amara', age: 9, avatar: 'lion', pin: '2468' },
  { id: 2, name: 'Tobi', age: 14, avatar: 'lantern', pin: '1357' },
];

const activities = [
  { slug:'david-chooses-courage', mark: 'S', title: 'David chooses courage', type: 'Story', time: '8 min', tone: 'gold' },
  { slug:'build-psalm-119-105', mark: 'W', title: 'Build Psalm 119:105', type: 'Word game', time: '4 min', tone: 'sky' },
  { slug:'kind-choice-at-lunch', mark: 'C', title: 'A kind choice at lunch', type: 'Decision', time: '6 min', tone: 'coral' },
  { slug:'make-a-courage-card', mark: 'M', title: 'Make a courage card', type: 'Create', time: '10 min', tone: 'teal' },
  { slug:'samuel-listens', mark: 'T', title: 'Samuel listens', type: 'Trail', time: '7 min', tone: 'cream' },
  { slug:'what-did-ruth-notice', mark: 'Q', title: 'What did Ruth notice?', type: 'Quick quiz', time: '3 min', tone: 'navy' },
];

export default function ChildDashboardPage() {
  const [children, setChildren] = useState<Child[]>(fallbackChildren);
  const [activeId, setActiveId] = useState<number>(fallbackChildren[0].id);
  const [view, setView] = useState<View>('today');
  const [completed, setCompleted] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [helpNotice, setHelpNotice] = useState('');
  const [filter, setFilter] = useState('All activities');
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const closeHelpRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const family = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
      if (family?.children?.length) { const savedId = Number(localStorage.getItem('lanternLionActiveChildId')); setChildren(family.children); setActiveId(family.children.some((item: Child) => item.id === savedId) ? savedId : family.children[0].id); }
      const saved = JSON.parse(localStorage.getItem('lanternLionDemoProgress') || '[]');
      if (Array.isArray(saved)) setCompleted(saved);
    } catch { /* Keep demo content available. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!showHelp) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeHelpRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowHelp(false); return; }
      if (event.key !== 'Tab') return;
      const dialog = closeHelpRef.current?.closest<HTMLElement>('.help-dialog');
      const focusable = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')) : [];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); helpTriggerRef.current?.focus(); };
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
  const goalDone = Math.min(5, 2 + completed.length);
  const points = 42 + completed.length * 8;
  const filteredActivities = activities.filter((item) => filter === 'All activities' || (filter === 'Stories' && item.type === 'Story') || (filter === 'Games' && item.type !== 'Story' && item.type !== 'Create') || (filter === 'Make something' && item.type === 'Create'));

  function finishActivity(title: string) {
    if (completed.includes(title)) return;
    const next = [...completed, title];
    setCompleted(next); localStorage.setItem('lanternLionDemoProgress', JSON.stringify(next)); setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2600);
  }

  function submitHelp(kind: string) {
    const report = { child: child.name, kind, time: new Date().toISOString() };
    localStorage.setItem('lanternLionDemoHelpRequest', JSON.stringify(report));
    setShowHelp(false); setHelpNotice('Your grown-up has been told. You did the right thing by asking.');
  }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span></span><p>Opening the child space…</p></main>;

  return <main className={`child-dashboard ${teen ? 'child-dashboard-teen' : ''}`}>
    <header className="child-topbar"><a href="/" className="child-logo"><Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority /><span><strong>{teen ? 'Lantern After Dark' : 'The Lantern Club'}</strong><small>Lantern &amp; Lion</small></span></a><nav className="child-nav" aria-label="Child dashboard"><button aria-pressed={view === 'today'} className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>Today</button><button aria-pressed={view === 'library'} className={view === 'library' ? 'active' : ''} onClick={() => setView('library')}>Explore</button><button aria-pressed={view === 'progress'} className={view === 'progress' ? 'active' : ''} onClick={() => setView('progress')}>My progress</button></nav><div className="child-header-actions"><button ref={helpTriggerRef} className="help-button" onClick={() => setShowHelp(true)}>Ask for help</button><div className="profile-switch"><button ref={profileButtonRef} className="profile-button" aria-expanded={showProfiles} aria-controls="child-profile-menu" onClick={() => setShowProfiles(!showProfiles)}><span>{child.name.slice(0,1)}</span><b>{child.name}</b></button>{showProfiles && <div className="profile-menu" id="child-profile-menu">{children.map((item) => <button key={item.id} onClick={() => { setActiveId(item.id); localStorage.setItem('lanternLionActiveChildId',String(item.id)); setShowProfiles(false); }}><span>{item.name.slice(0,1)}</span><div><strong>{item.name}</strong><small>{item.age >= 13 ? 'Teen space' : 'Child space'}</small></div></button>)}<a href="/family-setup">Parent manages profiles</a></div>}</div></div></header>

    {view === 'today' && <div className="child-dashboard-body"><section className="child-welcome"><div><p className="child-kicker">{teen ? 'Your weekly practice' : 'Your next light'}</p><h1>Hi, {child.name}. Ready for one good step?</h1><p>{teen ? 'Pick up your courage study, then choose what you want to explore.' : 'Today, David faces something enormous. See what courage looks like before the battle begins.'}</p><div className="daily-stats"><span><b>{goalDone}/5</b> weekly lights</span><span><b>{points}</b> light points</span><span><b>3</b> day return</span></div></div><div className="welcome-lantern" aria-hidden="true"><span></span><i></i><b>{points}</b></div></section>

      <section className="continue-layout"><article className="continue-card"><div className="continue-art"><span>01</span><div className="hill hill-one"></div><div className="hill hill-two"></div><i></i></div><div className="continue-copy"><p className="child-kicker">Continue your story</p><h2>{teen ? 'Courage before the crowd' : 'David chooses courage'}</h2><p>{teen ? 'David’s confidence did not come from the crowd. Trace what he remembered before he stepped forward.' : 'David remembers how God helped him before. Then he takes one brave step.'}</p><div className="lesson-progress"><span><i style={{ width: completed.includes('David chooses courage') ? '100%' : '42%' }} /></span><small>{completed.includes('David chooses courage') ? 'Finished' : 'Part 2 of 5'}</small></div><Link className="button button-primary" href="/learn?activity=david-chooses-courage">{completed.includes('David chooses courage') ? 'Read it again' : 'Continue the story'}</Link></div></article>
      <aside className="today-plan"><div className="today-plan-head"><span>Today’s plan</span><b>{completed.length ? '3' : '2'} of 4 done</b></div>{['Listen to the story','Make one brave choice','Build the memory verse','Write a short prayer'].map((item,index) => { const done = index < 2 || completed.length > index - 2; return <button key={item} className={done ? 'done' : ''} onClick={() => finishActivity(item)}><span>{done ? '✓' : index + 1}</span><div><strong>{item}</strong><small>{done ? 'Finished' : index === 2 ? '4 minutes' : 'Take your time'}</small></div></button>})}<p>You can stop after any activity. Your place is saved on this device.</p></aside></section>

      <section className="child-section"><div className="child-section-head"><div><p className="child-kicker">Choose your next activity</p><h2>Follow your curiosity.</h2></div><button onClick={() => setView('library')}>See everything</button></div><div className="dashboard-activity-grid">{activities.slice(0,4).map((item) => <article className={item.tone} key={item.title}><span className="activity-mark">{item.mark}</span><small>{item.type} · {item.time}</small><h3>{item.title}</h3><Link href={`/learn?activity=${item.slug}`}>{completed.includes(item.title) ? 'Do it again' : 'Open activity'}</Link></article>)}</div></section>

      <section className="verse-strip"><span className="verse-mark">V</span><div><p className="child-kicker">Verse on the path</p><blockquote>“Your word is a lamp to my feet, and a light for my path.”</blockquote><small>Psalm 119:105, WEB</small></div><button onClick={() => finishActivity('Build Psalm 119:105')}>{completed.includes('Build Psalm 119:105') ? 'Learned' : 'Practise this verse'}</button></section>
    </div>}

    {view === 'library' && <div className="child-dashboard-body dashboard-view"><div className="dashboard-title"><p className="child-kicker">Explore the club</p><h1>What do you feel like doing?</h1><p>Choose a story, a puzzle or something to make. There’s no endless scroll here.</p></div><div className="dashboard-filters">{['All activities','Stories','Games','Make something'].map((item) => <button key={item} aria-pressed={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="dashboard-activity-grid library-grid">{filteredActivities.map((item) => <article className={item.tone} key={item.title}><span className="activity-mark">{item.mark}</span><small>{item.type} · {item.time}</small><h3>{item.title}</h3><Link href={`/learn?activity=${item.slug}`}>{completed.includes(item.title) ? 'Do it again' : 'Open activity'}</Link></article>)}</div></div>}

    {view === 'progress' && <div className="child-dashboard-body dashboard-view"><div className="dashboard-title"><p className="child-kicker">My progress</p><h1>Look how far you’ve come.</h1><p>Small steps count. You never lose points for taking a break or getting an answer wrong.</p></div><div className="progress-overview"><article><span>★</span><strong>{points}</strong><small>Light points</small></article><article><span>V</span><strong>{2 + completed.filter((item) => item.includes('Psalm')).length}</strong><small>Verses practised</small></article><article><span>D</span><strong>3</strong><small>Days back this week</small></article><article><span>S</span><strong>{4 + completed.length}</strong><small>Activities finished</small></article></div><section className="progress-path"><div><p className="child-kicker">This week</p><h2>Growing in courage</h2></div><div className="path-line">{[1,2,3,4,5].map((day) => <span className={day <= goalDone ? 'lit' : ''} key={day}>{day <= goalDone ? '✓' : day}</span>)}</div><p>{goalDone === 5 ? 'Every light is on. Take a rest or explore something new.' : `${5 - goalDone} more ${5 - goalDone === 1 ? 'light' : 'lights'} to finish this path.`}</p></section></div>}

    {celebrate && <div className="dashboard-toast" role="status"><span>✓</span><div><strong>Light added</strong><small>Your progress is saved.</small></div></div>}
    {helpNotice && <div className="child-help-confirmation" role="status"><span>✓</span><p>{helpNotice}</p><button onClick={() => setHelpNotice('')}>Close</button></div>}
    {showHelp && <div className="help-overlay" role="presentation" onClick={() => setShowHelp(false)}><section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}><button ref={closeHelpRef} className="close-help" aria-label="Close help" onClick={() => setShowHelp(false)}>×</button><p className="child-kicker">You did the right thing</p><h2 id="help-title">What kind of help do you need?</h2><p>A trusted grown-up will see your message. You won’t get in trouble for asking.</p><div><button onClick={() => submitHelp('Something feels wrong')}>Something feels wrong</button><button onClick={() => submitHelp('Stuck in an activity')}>I’m stuck in an activity</button><button onClick={() => submitHelp('Wants their parent')}>I want my parent</button></div><small>If you feel unsafe right now, leave the device and find a trusted grown-up near you.</small></section></div>}
  </main>;
}
