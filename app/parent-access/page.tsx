'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';

type Mode = 'signin' | 'signup';

const demoAccount = {
  name: 'Jordan Adeyemi',
  email: 'demo.parent@lanternandlion.test',
  password: 'LanternLion#2026',
  country: 'Nigeria',
};

export default function ParentAccessPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [signedInName, setSignedInName] = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
  }

  function fillDemo() {
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
    setError('');
    setNotice('Demo details added. You can sign in now.');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a complete email address.');
      return;
    }
    if (password.length < 10) {
      setError('Use at least 10 characters for your password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please add your name.');
        return;
      }
      if (!agreed) {
        setError('Please confirm that you are the parent or responsible grown-up.');
        return;
      }
      localStorage.setItem('lanternLionDemoParent', JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, country }));
      setSignedInName(name.trim());
      return;
    }

    let savedAccount: typeof demoAccount | null = null;
    try {
      const stored = localStorage.getItem('lanternLionDemoParent');
      savedAccount = stored ? JSON.parse(stored) : null;
    } catch {
      savedAccount = null;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const matchesDemo = normalizedEmail === demoAccount.email && password === demoAccount.password;
    const matchesSaved = savedAccount && normalizedEmail === savedAccount.email && password === savedAccount.password;

    if (!matchesDemo && !matchesSaved) {
      setError('Those details don’t match this demo. Check the email and password, then try again.');
      return;
    }
    setSignedInName(matchesDemo ? demoAccount.name : savedAccount?.name ?? 'Parent');
  }

  if (signedInName) {
    return <main className="parent-access-page"><section className="access-success-card">
      <div className="access-success-mark"><span></span></div>
      <p className="access-kicker">Parent access confirmed</p>
      <h1>Welcome, {signedInName.split(' ')[0]}.</h1>
      <p>Your demo parent account is ready. Family setup and child profiles will begin from here in the next build.</p>
      <div className="access-next-preview"><span>Next step</span><strong>Set up your family</strong><small>Add children, choose age groups and create their private ways to enter.</small></div>
      <a className="button button-primary" href="/onboarding">Preview child onboarding</a>
      <button className="access-signout" onClick={() => { setSignedInName(''); setPassword(''); }}>Sign out of the demo</button>
    </section></main>;
  }

  return (
    <main className="parent-access-page">
      <section className="access-story-panel">
        <a className="access-brand" href="/" aria-label="Lantern and Lion home"><Image src="/lantern-lion-logo.png" alt="" width={64} height={64} priority /><span><strong>Lantern &amp; Lion</strong><small>The Lantern Club</small></span></a>
        <div className="access-story-copy"><p className="access-kicker">The grown-up space</p><h1>Stay close while they grow.</h1><p>Your parent account keeps family details, progress and privacy controls in one place.</p><ul><li><span>01</span>Children don’t need their own email.</li><li><span>02</span>You decide who can join the family.</li><li><span>03</span>No payment is needed during this demo.</li></ul></div>
        <p className="access-story-note">Demo mode stores test details only on this device.</p>
      </section>

      <section className="access-form-panel">
        <div className="access-form-wrap">
          <div className="access-tabs" role="tablist" aria-label="Parent account access"><button role="tab" aria-selected={mode === 'signin'} onClick={() => switchMode('signin')}>Sign in</button><button role="tab" aria-selected={mode === 'signup'} onClick={() => switchMode('signup')}>Create account</button></div>

          <div className="access-heading"><p className="access-kicker">{mode === 'signin' ? 'Welcome back' : 'Start your family space'}</p><h2>{mode === 'signin' ? 'Sign in as a parent.' : 'Create your parent account.'}</h2><p>{mode === 'signin' ? 'Use the demo details below or an account you created on this device.' : 'This takes about a minute. You can add children later.'}</p></div>

          {mode === 'signin' && <aside className="demo-credentials" aria-label="Demo sign in details"><div><span>Demo email</span><strong>{demoAccount.email}</strong></div><div><span>Demo password</span><strong>{demoAccount.password}</strong></div><button type="button" onClick={fillDemo}>Use demo details</button></aside>}

          <form className="access-form" onSubmit={submit} noValidate>
            {mode === 'signup' && <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jordan Adeyemi" /></label>}
            <label>Email address<input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            {mode === 'signup' && <label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>United Kingdom</option><option>United States</option><option>Other</option></select></label>}
            <label>Password<span className="password-control"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'signup' ? 'At least 10 characters' : 'Enter your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></span>{mode === 'signup' && <small>Use 10 or more characters. A short phrase is easier to remember.</small>}</label>
            {mode === 'signup' && <label className="parent-confirm"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>I’m the parent or responsible grown-up creating this family space.</span></label>}
            {mode === 'signin' && <button className="forgot-button" type="button" onClick={() => { setError(''); setNotice('Password reset is paused in demo mode. Use the demo details above, or create a new test account.'); }}>Forgot your password?</button>}
            {error && <p className="access-error" role="alert">{error}</p>}{notice && <p className="access-notice" role="status">{notice}</p>}
            <button className="button button-primary access-submit" type="submit">{mode === 'signin' ? 'Sign in to parent space' : 'Create demo account'}</button>
          </form>
          <p className="access-switch">{mode === 'signin' ? 'New to Lantern & Lion?' : 'Already made an account?'} <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Create one' : 'Sign in'}</button></p>
          <a className="access-home-link" href="/">Back to the home page</a>
        </div>
      </section>
    </main>
  );
}
