'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';

type Child = { id: number; name: string; age: number; avatar: string; pin: string };
type FamilyData = { familyName: string; country: string; children: Child[]; privateArtwork: boolean; teacherMessages: boolean; progressEmails: boolean };

const avatarOptions = [
  { id: 'lion', label: 'Lion', mark: 'L', tone: 'gold' },
  { id: 'lantern', label: 'Lantern', mark: 'B', tone: 'coral' },
  { id: 'dove', label: 'Dove', mark: 'P', tone: 'sky' },
  { id: 'olive', label: 'Olive branch', mark: 'G', tone: 'teal' },
];

export default function FamilySetupPage() {
  const [step, setStep] = useState(1);
  const [parentName, setParentName] = useState('Parent');
  const [familyName, setFamilyName] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [children, setChildren] = useState<Child[]>([]);
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('8');
  const [avatar, setAvatar] = useState('lion');
  const [pin, setPin] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [privateArtwork, setPrivateArtwork] = useState(true);
  const [teacherMessages, setTeacherMessages] = useState(true);
  const [progressEmails, setProgressEmails] = useState(false);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null');
      const saved = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null') as FamilyData | null;
      if (session?.name) setParentName(session.name);
      if (saved) {
        setFamilyName(saved.familyName); setCountry(saved.country); setChildren(saved.children || []);
        setPrivateArtwork(saved.privateArtwork); setTeacherMessages(saved.teacherMessages); setProgressEmails(saved.progressEmails);
      }
    } catch { /* Continue with a fresh demo family. */ }
  }, []);

  function resetChildForm() { setChildName(''); setAge('8'); setAvatar('lion'); setPin(''); setEditingId(null); setError(''); }

  function saveChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAge = Number(age);
    if (!childName.trim()) return setError('Add a first name or nickname.');
    if (numericAge < 5 || numericAge > 17) return setError('This demo is set up for ages 5 to 17.');
    if (!/^\d{4}$/.test(pin)) return setError('Choose a four-digit PIN using numbers only.');
    if (children.some((child) => child.pin === pin && child.id !== editingId)) return setError('Each child needs a different PIN.');
    if (!editingId && children.length >= 5) return setError('This demo supports up to five child profiles.');
    const nextChild = { id: editingId ?? Date.now(), name: childName.trim(), age: numericAge, avatar, pin };
    setChildren((current) => editingId ? current.map((child) => child.id === editingId ? nextChild : child) : [...current, nextChild]);
    resetChildForm();
  }

  function editChild(child: Child) {
    setChildName(child.name); setAge(String(child.age)); setAvatar(child.avatar); setPin(child.pin); setEditingId(child.id); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function finishSetup() {
    const family: FamilyData = { familyName: familyName.trim(), country, children, privateArtwork, teacherMessages, progressEmails };
    localStorage.setItem('lanternLionDemoFamily', JSON.stringify(family));
    setStep(4);
  }

  return <main className="family-setup-page">
    <header className="family-header"><a href="/" className="family-brand"><Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority /><span><strong>Lantern &amp; Lion</strong><small>Parent space</small></span></a>{step < 4 && <div className="family-progress"><span>Family setup · {step} of 3</span><div><i style={{ width: `${step * 33.33}%` }} /></div></div>}<a href="/parent-access" className="family-exit">Parent account</a></header>

    {step === 1 && <section className="family-step-card family-basics"><p className="family-kicker">Hello, {parentName.split(' ')[0]}</p><h1>Let’s name your family space.</h1><p className="family-intro">This name stays inside your parent account. It helps children know they have entered the right place.</p><div className="family-basics-form"><label>Family space name<input autoFocus maxLength={32} value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="For example, The Adeyemi Family" /></label><label>Home country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>United Kingdom</option><option>United States</option><option>Other</option></select></label></div><aside className="family-privacy-note"><span>Private by default</span><p>Children won’t see your email, billing details or other grown-up settings.</p></aside><button className="button button-primary family-main-button" disabled={!familyName.trim()} onClick={() => setStep(2)}>Add child profiles</button></section>}

    {step === 2 && <section className="family-children-layout"><div className="child-form-card"><p className="family-kicker">{editingId ? 'Edit this profile' : children.length ? 'Add another child' : 'First child profile'}</p><h1>{editingId ? `Update ${childName}.` : 'Who is joining the club?'}</h1><p className="family-intro">Use a first name or nickname. Their age chooses the right club automatically.</p><form onSubmit={saveChild} className="child-profile-form"><div className="child-field-row"><label>Name or nickname<input value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="Amara" maxLength={18} /></label><label>Age<input type="number" inputMode="numeric" min="5" max="17" value={age} onChange={(event) => setAge(event.target.value)} /></label></div><fieldset className="family-avatar-picker"><legend>Choose a profile picture</legend><div>{avatarOptions.map((item) => <button key={item.id} type="button" className={`${item.tone} ${avatar === item.id ? 'chosen' : ''}`} aria-pressed={avatar === item.id} onClick={() => setAvatar(item.id)}><span>{item.mark}</span><small>{item.label}</small></button>)}</div></fieldset><label>Four-digit child PIN<input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="••••" /><small>Use a PIN your child can remember. Don’t use a birthday.</small></label><div className="club-placement"><span>{Number(age) >= 13 ? 'Lantern After Dark' : 'The Lantern Club'}</span><p>{Number(age) >= 13 ? 'Teen experience for ages 13 to 17' : 'Child experience for ages 5 to 12'}</p></div>{error && <p className="family-error" role="alert">{error}</p>}<div className="child-form-actions">{editingId && <button type="button" className="family-text-button" onClick={resetChildForm}>Cancel edit</button>}<button className="button button-primary" type="submit">{editingId ? 'Save changes' : 'Add this child'}</button></div></form></div>
      <aside className="child-list-panel"><div><p className="family-kicker">Your family</p><h2>{children.length ? `${children.length} ${children.length === 1 ? 'child' : 'children'} added` : 'No profiles yet'}</h2></div>{children.length ? <div className="saved-child-list">{children.map((child) => { const item = avatarOptions.find((option) => option.id === child.avatar) || avatarOptions[0]; return <article key={child.id}><span className={`saved-avatar ${item.tone}`}>{item.mark}</span><div><strong>{child.name}</strong><small>Age {child.age} · {child.age >= 13 ? 'Teen space' : 'Child space'} · PIN ••••</small></div><button onClick={() => editChild(child)}>Edit</button><button className="remove-child" onClick={() => setChildren((current) => current.filter((item) => item.id !== child.id))}>Remove</button></article>})}</div> : <div className="child-empty"><span>+</span><p>Add the first child using the form. You can create up to five demo profiles.</p></div>}<div className="child-list-actions"><button className="family-text-button" onClick={() => setStep(1)}>Back</button><button className="button button-primary" disabled={!children.length} onClick={() => setStep(3)}>Review family safety</button></div></aside></section>}

    {step === 3 && <section className="family-step-card family-safety-step"><p className="family-kicker">Family safety choices</p><h1>You stay in charge.</h1><p className="family-intro">These settings apply to every child for now. You’ll be able to change them from the parent dashboard later.</p><div className="family-settings"><label><div><strong>Keep creations inside the family</strong><p>Artwork and written answers remain private unless you choose to share them with an assigned teacher.</p></div><input type="checkbox" checked={privateArtwork} onChange={(event) => setPrivateArtwork(event.target.checked)} /><span aria-hidden="true"></span></label><label><div><strong>Allow assigned teacher messages</strong><p>Teachers can message you. They cannot message a child privately.</p></div><input type="checkbox" checked={teacherMessages} onChange={(event) => setTeacherMessages(event.target.checked)} /><span aria-hidden="true"></span></label><label><div><strong>Send a weekly progress email</strong><p>Receive one short summary of finished lessons and places where help may be useful.</p></div><input type="checkbox" checked={progressEmails} onChange={(event) => setProgressEmails(event.target.checked)} /><span aria-hidden="true"></span></label></div><div className="family-summary"><div><span>Family space</span><strong>{familyName}</strong></div><div><span>Children</span><strong>{children.length}</strong></div><div><span>Country</span><strong>{country}</strong></div></div><div className="family-final-actions"><button className="family-text-button" onClick={() => setStep(2)}>Back to profiles</button><button className="button button-primary" onClick={finishSetup}>Finish family setup</button></div></section>}

    {step === 4 && <section className="family-step-card family-finished"><div className="family-check"><span></span></div><p className="family-kicker">Family ready</p><h1>{familyName} is set up.</h1><p className="family-intro">{children.map((child) => child.name).join(', ')} {children.length === 1 ? 'has' : 'have'} a private profile and the right club for their age.</p><div className="family-ready-list">{children.map((child) => <article key={child.id}><span>{child.name.slice(0,1).toUpperCase()}</span><div><strong>{child.name}</strong><small>{child.age >= 13 ? 'Lantern After Dark' : 'The Lantern Club'} · Ready to begin</small></div></article>)}</div><a className="button button-primary family-main-button" href="/onboarding">Preview a child’s first visit</a><button className="family-text-button family-edit-again" onClick={() => setStep(2)}>Edit child profiles</button></section>}
  </main>;
}
