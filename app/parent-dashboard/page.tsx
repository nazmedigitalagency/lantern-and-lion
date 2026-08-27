'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Child = { id: number; name: string; age: number; avatar: string; pin: string };
type Family = { familyName: string; country: string; children: Child[]; privateArtwork: boolean; teacherMessages: boolean; progressEmails: boolean };
type Assignment = { id: number; childId: number; title: string; due: string };
type Page = 'overview' | 'children' | 'assignments' | 'messages' | 'settings';

const fallbackFamily: Family = { familyName: 'The Adeyemi Family', country: 'Nigeria', children: [{ id: 1, name: 'Amara', age: 9, avatar: 'lion', pin: '2468' }, { id: 2, name: 'Tobi', age: 14, avatar: 'lantern', pin: '1357' }], privateArtwork: true, teacherMessages: true, progressEmails: false };
const lessonOptions = ['David chooses courage', 'Build Psalm 119:105', 'Samuel listens', 'A kind choice at lunch'];

export default function ParentDashboardPage() {
  const [page, setPage] = useState<Page>('overview');
  const [family, setFamily] = useState<Family>(fallbackFamily);
  const [parentName, setParentName] = useState('Jordan Adeyemi');
  const [selectedChild, setSelectedChild] = useState<number>(fallbackFamily.children[0].id);
  const [assignments, setAssignments] = useState<Assignment[]>([{ id: 1, childId: 1, title: 'David chooses courage', due: 'Friday' }]);
  const [lesson, setLesson] = useState(lessonOptions[0]);
  const [due, setDue] = useState('Friday');
  const [savedNotice, setSavedNotice] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([{ from: 'Mrs Grace', body: 'Amara asked a thoughtful question about courage today.', time: 'Today, 10:24' }]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedFamily = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
      const session = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null');
      const storedAssignments = JSON.parse(localStorage.getItem('lanternLionDemoAssignments') || 'null');
      if (storedFamily?.children?.length) {
        setFamily(storedFamily); setSelectedChild(storedFamily.children[0].id);
        if (!Array.isArray(storedAssignments)) {
          const seeded = [{ id: Date.now(), childId: storedFamily.children[0].id, title: 'David chooses courage', due: 'Friday' }];
          setAssignments(seeded); localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(seeded));
        } else {
          const validIds = new Set(storedFamily.children.map((child: Child) => child.id));
          const seen = new Set<string>();
          const normalized = storedAssignments.filter((item: Assignment) => {
            const key = `${item.childId}:${item.title}`;
            if (!validIds.has(item.childId) || seen.has(key)) return false;
            seen.add(key); return true;
          });
          setAssignments(normalized); localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(normalized));
        }
      }
      if (session?.name) setParentName(session.name);
      else if (Array.isArray(storedAssignments)) setAssignments(storedAssignments);
    } catch { /* Keep the demo family available. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!savedNotice) return;
    const timer = window.setTimeout(() => setSavedNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [savedNotice]);

  const children = family.children.length ? family.children : fallbackFamily.children;
  const activeChild = children.find((child) => child.id === selectedChild) || children[0];

  function addAssignment() {
    const existing = assignments.find((item) => item.childId === selectedChild && item.title === lesson);
    const next = existing ? assignments.map((item) => item.id === existing.id ? { ...item, due } : item) : [...assignments, { id: Date.now(), childId: selectedChild, title: lesson, due }];
    setAssignments(next); localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(next)); setSavedNotice(existing ? `${lesson} was already assigned. The due date is now ${due}.` : `${lesson} was assigned to ${activeChild.name}.`);
  }

  function saveSettings(next: Family) {
    setFamily(next); localStorage.setItem('lanternLionDemoFamily', JSON.stringify(next)); setSavedNotice('Family settings saved on this device.');
  }

  function sendMessage() {
    if (!message.trim()) return;
    setMessages((current) => [...current, { from: 'You', body: message.trim(), time: 'Just now' }]); setMessage(''); setSavedNotice('Your demo message was added.');
  }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span></span><p>Opening the parent space…</p></main>;

  return <main className="parent-dashboard-page">
    <aside className="parent-sidebar"><a className="parent-dashboard-brand" href="/"><Image src="/lantern-lion-logo.png" alt="" width={58} height={58} priority /><span><strong>Lantern &amp; Lion</strong><small>Parent space</small></span></a><nav aria-label="Parent dashboard"><button aria-pressed={page === 'overview'} className={page === 'overview' ? 'active' : ''} onClick={() => setPage('overview')}><span>H</span>Home</button><button aria-pressed={page === 'children'} className={page === 'children' ? 'active' : ''} onClick={() => setPage('children')}><span>C</span>Children</button><button aria-pressed={page === 'assignments'} className={page === 'assignments' ? 'active' : ''} onClick={() => setPage('assignments')}><span>A</span>Assignments</button><button aria-pressed={page === 'messages'} className={page === 'messages' ? 'active' : ''} onClick={() => setPage('messages')}><span>M</span>Messages <b>1</b></button><button aria-pressed={page === 'settings'} className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}><span>S</span>Settings</button></nav><div className="parent-sidebar-bottom"><a href="/child-dashboard">Preview child space</a><a href="/family-setup">Manage family setup</a><a href="/parent-access">Sign out</a></div></aside>

    <section className="parent-dashboard-main"><header className="parent-dashboard-top"><div><p>{family.familyName}</p><span>Demo parent dashboard</span></div><button className="parent-account-button"><span>{parentName.slice(0,1)}</span><div><strong>{parentName}</strong><small>Family owner</small></div></button></header>

      {page === 'overview' && <div className="parent-dashboard-content"><div className="parent-page-title"><p className="parent-dash-kicker">This week at home</p><h1>Good morning, {parentName.split(' ')[0]}.</h1><p>Here’s what your children have been learning and where a little help may be useful.</p></div><div className="parent-metric-grid"><article><span>Finished</span><strong>7</strong><small>activities this week</small></article><article><span>Returned</span><strong>3 days</strong><small>across the family</small></article><article><span>Practised</span><strong>2</strong><small>Bible verses</small></article><article className="attention"><span>Needs you</span><strong>1</strong><small>activity to look at</small></article></div>
        <div className="parent-overview-grid"><section className="family-progress-panel"><div className="panel-heading"><div><p className="parent-dash-kicker">Children</p><h2>Learning this week</h2></div><button onClick={() => setPage('children')}>View every profile</button></div><div className="parent-child-rows">{children.map((child,index) => <article key={child.id}><span className={index % 2 ? 'teen' : ''}>{child.name.slice(0,1)}</span><div><strong>{child.name}</strong><small>{child.age >= 13 ? 'Lantern After Dark' : 'The Lantern Club'} · {index ? 'Decision lab' : 'Growing in courage'}</small><div><i style={{ width: index ? '48%' : '72%' }} /></div></div><b>{index ? '3/6' : '5/7'}</b><button onClick={() => { setSelectedChild(child.id); setPage('children'); }}>Open</button></article>)}</div></section><aside className="parent-attention-panel"><p className="parent-dash-kicker">Needs a little help</p><h2>One game was flagged.</h2><div className="flagged-activity"><span>W</span><div><strong>Build Psalm 119:105</strong><small>{children[0].name} tried three times and asked for help.</small></div></div><p>This does not mean they failed. It gives you a good place to start a conversation.</p><button onClick={() => setSavedNotice('This item is marked as reviewed in the demo.')}>Mark as reviewed</button></aside></div>
        <section className="recent-learning"><div className="panel-heading"><div><p className="parent-dash-kicker">Recent learning</p><h2>What they worked on</h2></div></div><div><article><span>S</span><div><strong>David chooses courage</strong><small>{children[0].name} · Story finished</small></div><b>Today</b></article><article><span>D</span><div><strong>A kind choice at lunch</strong><small>{children[1]?.name || children[0].name} · Decision lab</small></div><b>Yesterday</b></article><article><span>V</span><div><strong>Psalm 119:105</strong><small>{children[0].name} · Verse practised</small></div><b>Tuesday</b></article></div></section></div>}

      {page === 'children' && <div className="parent-dashboard-content"><div className="parent-page-title"><p className="parent-dash-kicker">Child profiles</p><h1>See each learning journey.</h1><p>Choose a child to see current work, recent activity and any place where they asked for help.</p></div><div className="child-profile-tabs">{children.map((child) => <button key={child.id} className={selectedChild === child.id ? 'active' : ''} onClick={() => setSelectedChild(child.id)}><span>{child.name.slice(0,1)}</span><div><strong>{child.name}</strong><small>Age {child.age}</small></div></button>)}<a href="/family-setup">Manage profiles</a></div><section className="single-child-report"><div className="single-child-head"><span>{activeChild.name.slice(0,1)}</span><div><p className="parent-dash-kicker">{activeChild.age >= 13 ? 'Teen space' : 'Child space'}</p><h2>{activeChild.name}’s week</h2><small>{activeChild.age >= 13 ? 'Lantern After Dark' : 'The Lantern Club'}</small></div><a href="/child-dashboard">Preview their space</a></div><div className="child-report-metrics"><article><strong>5</strong><span>Activities finished</span></article><article><strong>42</strong><span>Light points</span></article><article><strong>3 days</strong><span>Returned this week</span></article></div><div className="child-report-list"><article><span className="complete">Done</span><div><strong>David chooses courage</strong><small>Story · 8 minutes</small></div><b>Today</b></article><article><span className="help">Help</span><div><strong>Build Psalm 119:105</strong><small>Three tries · Asked for help</small></div><b>Today</b></article><article><span>Next</span><div><strong>Samuel listens</strong><small>Assigned for Friday</small></div><b>Not started</b></article></div></section></div>}

      {page === 'assignments' && <div className="parent-dashboard-content"><div className="parent-page-title"><p className="parent-dash-kicker">Assignments</p><h1>Choose what comes next.</h1><p>Assign one useful activity at a time. Children can still explore the rest of the club.</p></div><section className="assignment-builder"><div><label>Child<select value={selectedChild} onChange={(event) => setSelectedChild(Number(event.target.value))}>{children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label><label>Activity<select value={lesson} onChange={(event) => setLesson(event.target.value)}>{lessonOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>Finish by<select value={due} onChange={(event) => setDue(event.target.value)}><option>Friday</option><option>Sunday</option><option>Next Wednesday</option><option>No due date</option></select></label><button className="button button-primary" onClick={addAssignment}>Assign activity</button></div><aside><p className="parent-dash-kicker">Current assignments</p>{assignments.length ? assignments.map((item) => <article key={item.id}><span>{children.find((child) => child.id === item.childId)?.name.slice(0,1) || 'C'}</span><div><strong>{item.title}</strong><small>{children.find((child) => child.id === item.childId)?.name} · Due {item.due}</small></div><button onClick={() => { const next = assignments.filter((assignment) => assignment.id !== item.id); setAssignments(next); localStorage.setItem('lanternLionDemoAssignments', JSON.stringify(next)); }}>Remove</button></article>) : <p className="empty-assignment">Nothing is assigned right now.</p>}</aside></section></div>}

      {page === 'messages' && <div className="parent-dashboard-content"><div className="parent-page-title"><p className="parent-dash-kicker">Teacher messages</p><h1>Keep the conversation with grown-ups.</h1><p>Teachers can message you about assigned groups. Children never receive private teacher messages.</p></div><section className="message-layout"><aside><button className="active"><span>G</span><div><strong>Mrs Grace</strong><small>Children’s group · 1 new</small></div></button><button><span>D</span><div><strong>Mr Daniel</strong><small>Teen group</small></div></button></aside><div className="message-thread"><header><span>G</span><div><strong>Mrs Grace</strong><small>Assigned teacher for {children[0].name}</small></div></header><div className="message-list">{messages.map((item,index) => <article className={item.from === 'You' ? 'sent' : ''} key={`${item.time}-${index}`}><span>{item.from}</span><p>{index === 0 && item.from === 'Mrs Grace' ? `${children[0].name} asked a thoughtful question about courage today.` : item.body}</p><small>{item.time}</small></article>)}</div><div className="message-compose"><label className="sr-only" htmlFor="parent-message">Message Mrs Grace</label><textarea id="parent-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a short message to Mrs Grace" /><button onClick={sendMessage}>Send message</button></div></div></section></div>}

      {page === 'settings' && <div className="parent-dashboard-content"><div className="parent-page-title"><p className="parent-dash-kicker">Family settings</p><h1>Privacy choices in one place.</h1><p>These demo settings are saved on this device. Child-facing screens cannot change them.</p></div><section className="parent-settings-card"><div><h2>Sharing and contact</h2><p>Choose how work stays private and when you hear from the club.</p></div><div className="parent-setting-list"><label><div><strong>Keep creations inside the family</strong><small>Artwork and written answers stay private unless you share them.</small></div><input type="checkbox" checked={family.privateArtwork} onChange={(event) => saveSettings({ ...family, privateArtwork: event.target.checked })} /><span></span></label><label><div><strong>Allow assigned teacher messages</strong><small>Teachers can contact this parent account, never the child privately.</small></div><input type="checkbox" checked={family.teacherMessages} onChange={(event) => saveSettings({ ...family, teacherMessages: event.target.checked })} /><span></span></label><label><div><strong>Weekly progress email</strong><small>One summary each week. No daily reminders.</small></div><input type="checkbox" checked={family.progressEmails} onChange={(event) => saveSettings({ ...family, progressEmails: event.target.checked })} /><span></span></label></div><div className="parent-settings-links"><a href="/family-setup">Edit family and child profiles</a><a href="/parent-access">Parent account details</a></div></section></div>}
      {savedNotice && <div className="parent-dashboard-toast" role="status"><span>✓</span><p>{savedNotice}</p><button onClick={() => setSavedNotice('')}>Close</button></div>}
    </section>
  </main>;
}
