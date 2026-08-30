'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type Child = { id: number; name: string; username: string; age: number; avatar: string; pin: string; gender?: 'male' | 'female' };
type FamilyData = { familyName: string; country: string; children: Child[]; privateArtwork: boolean; teacherMessages: boolean; progressEmails: boolean };

const avatarOptions = [
  { id: 'lion', label: 'Lion', mark: 'L', tone: 'gold' },
  { id: 'lantern', label: 'Lantern', mark: 'B', tone: 'coral' },
  { id: 'dove', label: 'Dove', mark: 'P', tone: 'sky' },
  { id: 'star', label: 'Morning Star', mark: 'S', tone: 'teal' },
];

export default function FamilySetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [parentName, setParentName] = useState('Parent');
  const [familyName, setFamilyName] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [children, setChildren] = useState<Child[]>([]);
  const [childName, setChildName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('8');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatar, setAvatar] = useState('lion');
  const [pin, setPin] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [privateArtwork, setPrivateArtwork] = useState(true);
  const [teacherMessages, setTeacherMessages] = useState(true);
  const [progressEmails, setProgressEmails] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let session: { name?: string } | null = null;
      try { session = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null'); } catch { /* Treat as no session. */ }
      if (!session) {
        try { sessionStorage.setItem('lanternLionPendingModuleRedirect', '/family-setup'); } catch { /* Storage unavailable. */ }
        router.replace('/parent-access');
        return;
      }
      try {
        const saved = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null') as FamilyData | null;
        if (session?.name) setParentName(session.name);
        if (saved) {
          setFamilyName(saved.familyName); setCountry(saved.country);
          const normalizedChildren = (saved.children || []).map((c) => ({
            ...c,
            username: c.username || c.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
            gender: c.gender || 'male',
          }));
          setChildren(normalizedChildren);
          setPrivateArtwork(saved.privateArtwork); setTeacherMessages(saved.teacherMessages); setProgressEmails(saved.progressEmails);
        }
      } catch { /* Continue with a fresh demo family. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  function handleNameChange(val: string) {
    setChildName(val);
    if (!editingId) {
      const slug = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      setUsername(slug);
    }
  }

  function resetChildForm() {
    setChildName('');
    setUsername('');
    setAge('8');
    setGender('male');
    setAvatar('lion');
    setPin('');
    setEditingId(null);
    setError('');
  }

  function saveChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAge = Number(age);
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!childName.trim()) return setError('Please add the child’s name or nickname.');
    if (!cleanUsername || cleanUsername.length < 2) return setError('Please choose a single login username (at least 2 letters/numbers).');
    if (numericAge < 5 || numericAge > 17) return setError('This platform is designed for ages 5 to 17.');
    if (!/^\d{4}$/.test(pin)) return setError('Choose a 4-digit PIN (numbers only).');
    if (children.some((c) => c.username === cleanUsername && c.id !== editingId)) {
      return setError('That login username is already in use by another child in your family.');
    }
    if (children.some((c) => c.pin === pin && c.id !== editingId)) {
      return setError('Each child needs a unique 4-digit PIN.');
    }
    if (!editingId && children.length >= 5) return setError('This demo supports up to five child profiles.');

    const childId = editingId ?? Date.now();
    const nextChild: Child = {
      id: childId,
      name: childName.trim(),
      username: cleanUsername,
      age: numericAge,
      avatar,
      pin,
      gender,
    };

    // Initialize Default Character Appearance & Equipment
    try {
      const storedApp = JSON.parse(localStorage.getItem('lanternLionCharacterAppearance') || '{}');
      if (!storedApp[childId]) {
        storedApp[childId] = {
          skinTone: 'honey',
          hairStyle: gender === 'female' ? 'curls' : 'short',
          face: 'smile',
          gender,
        };
        localStorage.setItem('lanternLionCharacterAppearance', JSON.stringify(storedApp));
      }

      const storedEq = JSON.parse(localStorage.getItem('lanternLionCharacterEquipment') || '{}');
      if (!storedEq[childId]) {
        storedEq[childId] = {
          clothing: 'starter-tunic',
          shoes: 'starter-sandals',
          backpack: 'starter-satchel',
          lantern: 'starter-lantern',
          accessory: 'scripture-band',
        };
        localStorage.setItem('lanternLionCharacterEquipment', JSON.stringify(storedEq));
      }
    } catch {
      // Non-blocking
    }

    setChildren((current) =>
      editingId ? current.map((c) => (c.id === editingId ? nextChild : c)) : [...current, nextChild]
    );
    resetChildForm();
  }

  function editChild(child: Child) {
    setChildName(child.name);
    setUsername(child.username || child.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    setAge(String(child.age));
    setAvatar(child.avatar);
    setPin(child.pin);
    setEditingId(child.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function finishSetup() {
    const family: FamilyData = { familyName: familyName.trim(), country, children, privateArtwork, teacherMessages, progressEmails };
    localStorage.setItem('lanternLionDemoFamily', JSON.stringify(family));
    if (children.length > 0) {
      localStorage.setItem('lanternLionActiveChildId', String(children[0].id));
    }

    // Persist real records so a parent/teacher can see this family's activity
    // from any device. Best-effort: the local family space still works
    // offline even if this call fails.
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: family.familyName,
          country: family.country,
          timezone,
          children: children.map((c) => ({ name: c.name, username: c.username, age: c.age, avatar: c.avatar, pin: c.pin, gender: c.gender })),
        }),
      })
        .then((res) => res.json() as Promise<{ error?: string }>)
        .then((data) => { if (data?.error) setError(data.error); })
        .catch(() => { /* Offline/local-only family. */ });
    } catch { /* Non-blocking. */ }

    setStep(4);
  }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span></span><p>Opening family setup…</p></main>;

  return <main className="family-setup-page">
    <header className="family-header"><Link href="/" className="family-brand"><Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority /><span><strong>Lantern &amp; Lion</strong><small>Parent space</small></span></Link>{step < 4 && <div className="family-progress"><span>Family setup · {step} of 3</span><div><i style={{ width: `${step * 33.33}%` }} /></div></div>}<a href="/parent-access" className="family-exit">Parent account</a></header>

    {step === 1 && <section className="family-step-card family-basics"><p className="family-kicker">Hello, {parentName.split(' ')[0]}</p><h1>Let’s name your family space.</h1><p className="family-intro">This name stays inside your parent account. It helps children know they have entered the right place.</p><div className="family-basics-form"><label>Family space name<input autoFocus maxLength={32} value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="For example, The Adeyemi Family" /></label><label>Home country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>United Kingdom</option><option>United States</option><option>Other</option></select></label></div><aside className="family-privacy-note"><span>Private by default</span><p>Children won’t see your email, billing details or other grown-up settings.</p></aside><button className="button button-primary family-main-button" disabled={!familyName.trim()} onClick={() => setStep(2)}>Add child profiles</button></section>}

    {step === 2 && <section className="family-children-layout"><div className="child-form-card"><p className="family-kicker">{editingId ? 'Edit this profile' : children.length ? 'Add another child' : 'First child profile'}</p><h1>{editingId ? `Update ${childName}.` : 'Create a child account'}</h1><p className="family-intro">Children use their unique username and 4-digit PIN to sign in on their own devices.</p><form onSubmit={saveChild} className="child-profile-form"><div className="child-field-row"><label>Full name or nickname<input value={childName} onChange={(event) => handleNameChange(event.target.value)} placeholder="e.g. Amara Adeyemi" maxLength={24} /></label><label>Age<input type="number" inputMode="numeric" min="5" max="17" value={age} onChange={(event) => setAge(event.target.value)} /></label></div><label>Login Username (single word)<input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} placeholder="e.g. amara" maxLength={15} /><small>The child will type this single name to sign in.</small></label><fieldset className="family-avatar-picker"><legend>Choose your child’s character presentation</legend><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}><button type="button" className={`button ${gender === 'male' ? 'button-primary' : 'button-secondary'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }} onClick={() => setGender('male')}><span>👦</span><strong>Boy (Male)</strong></button><button type="button" className={`button ${gender === 'female' ? 'button-primary' : 'button-secondary'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }} onClick={() => setGender('female')}><span>👧</span><strong>Girl (Female)</strong></button></div><small style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.75rem' }}>Determines default starting presentation. Your child can customize their hair, outfits, lanterns, and pets anytime!</small></fieldset><fieldset className="family-avatar-picker"><legend>Choose a profile badge emblem</legend><div>{avatarOptions.map((item) => <button key={item.id} type="button" className={`${item.tone} ${avatar === item.id ? 'chosen' : ''}`} aria-pressed={avatar === item.id} onClick={() => setAvatar(item.id)}><span>{item.mark}</span><small>{item.label}</small></button>)}</div></fieldset><label>Four-digit child PIN<input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="••••" /><small>Use a simple 4-digit code the child can remember.</small></label><div className="club-placement"><span>{Number(age) >= 13 ? '🦁 Lion’s Den (Teen)' : '🏮 The Lantern Club (Child)'}</span><p>{Number(age) >= 13 ? 'Teen experience for ages 13 to 17 · Deeper studies & real-life cases' : 'Child experience for ages 5 to 12 · Story trails & games'}</p></div>{error && <p className="family-error" role="alert">{error}</p>}<div className="child-form-actions">{editingId && <button type="button" className="family-text-button" onClick={resetChildForm}>Cancel edit</button>}<button className="button button-primary" type="submit">{editingId ? 'Save changes' : 'Add this child'}</button></div></form></div>
      <aside className="child-list-panel"><div><p className="family-kicker">Your family profiles</p><h2>{children.length ? `${children.length} ${children.length === 1 ? 'child' : 'children'} added` : 'No profiles yet'}</h2></div>{children.length ? <div className="saved-child-list">{children.map((child) => { const item = avatarOptions.find((option) => option.id === child.avatar) || avatarOptions[0]; return <article key={child.id}><span className={`saved-avatar ${item.tone}`}>{item.mark}</span><div><strong>{child.name} <em>(@{child.username})</em></strong><small>Age {child.age} · {child.age >= 13 ? 'Lion’s Den' : 'Lantern Club'} · PIN {child.pin}</small></div><button onClick={() => editChild(child)}>Edit</button><button className="remove-child" onClick={() => setChildren((current) => current.filter((item) => item.id !== child.id))}>Remove</button></article>})}</div> : <div className="child-empty"><span>+</span><p>Add the first child profile using the form. You can create up to 5 profiles.</p></div>}<div className="child-list-actions"><button className="family-text-button" onClick={() => setStep(1)}>Back</button><button className="button button-primary" disabled={!children.length} onClick={() => setStep(3)}>Review family safety</button></div></aside></section>}

    {step === 3 && <section className="family-step-card family-safety-step"><p className="family-kicker">Family safety choices</p><h1>You stay in charge.</h1><p className="family-intro">These settings apply to every child in your family. You can change them anytime from your parent dashboard.</p><div className="family-settings"><label><div><strong>Keep creations inside the family</strong><p>Artwork and written answers remain private unless you choose to share them with an assigned teacher.</p></div><input type="checkbox" checked={privateArtwork} onChange={(event) => setPrivateArtwork(event.target.checked)} /><span aria-hidden="true"></span></label><label><div><strong>Allow assigned teacher messages</strong><p>Teachers can message you. They cannot message a child privately.</p></div><input type="checkbox" checked={teacherMessages} onChange={(event) => setTeacherMessages(event.target.checked)} /><span aria-hidden="true"></span></label><label><div><strong>Send a weekly progress email</strong><p>Receive one short summary of finished lessons and places where help may be useful.</p></div><input type="checkbox" checked={progressEmails} onChange={(event) => setProgressEmails(event.target.checked)} /><span aria-hidden="true"></span></label></div><div className="family-summary"><div><span>Family space</span><strong>{familyName}</strong></div><div><span>Children</span><strong>{children.length}</strong></div><div><span>Country</span><strong>{country}</strong></div></div><div className="family-final-actions"><button className="family-text-button" onClick={() => setStep(2)}>Back to profiles</button><button className="button button-primary" onClick={finishSetup}>Finish family setup</button></div></section>}

    {step === 4 && <section className="family-step-card family-finished"><div className="family-check"><span></span></div><p className="family-kicker">Family ready</p><h1>{familyName} is set up!</h1><p className="family-intro">{children.map((child) => child.name).join(', ')} {children.length === 1 ? 'has' : 'have'} their login credentials ready.</p><div className="family-ready-list">{children.map((child) => <article key={child.id}><span>{child.name.slice(0,1).toUpperCase()}</span><div><strong>{child.name}</strong><small>Username: <b>{child.username}</b> · PIN: <b>{child.pin}</b> · {child.age >= 13 ? 'Lion’s Den' : 'The Lantern Club'}</small></div></article>)}</div><div className="family-finished-actions"><a className="button button-primary family-main-button" href="/parent-dashboard">Open parent dashboard</a><a className="button button-secondary" href="/child-access">Try child sign-in now</a></div><div className="family-finished-links"><a className="family-onboarding-link" href="/child-dashboard">Preview child dashboard directly</a><button className="family-text-button family-edit-again" onClick={() => setStep(2)}>Edit child profiles</button></div></section>}
  </main>;
}
