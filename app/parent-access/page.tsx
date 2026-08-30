'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

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
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  const tourSteps = [
    {
      kicker: 'Step 1: Your monitoring hub',
      title: 'See what they learn without hovering.',
      body: 'Your parent dashboard gives you real-time visibility into your children’s stories, memorised verses, quizzes, and reflection choices. You can track their weekly progress at a glance.',
      tag: 'Parent Dashboard',
      icon: '📊',
    },
    {
      kicker: 'Step 2: Safe & child-friendly',
      title: 'Distraction-free, zero ads, no strangers.',
      body: 'Children enter a safe sanctuary. There is no open public chat, no external links, and no advertising. Shared artwork and prayers stay private to your family and approved teachers.',
      tag: 'Safety by Design',
      icon: '🛡️',
    },
    {
      kicker: 'Step 3: Age-tailored clubs',
      title: 'Lantern Club (5-12) & Lion’s Den (13-17).',
      body: 'Younger children get visual story trails and word puzzles. Teens get deeper case studies, decision labs, and faith discussions tailored to their world.',
      tag: 'Two Distinct Spaces',
      icon: '🦁',
    },
    {
      kicker: 'Step 4: Next step — Child profiles',
      title: 'Create their username & 4-digit PIN.',
      body: 'Children don’t need an email! You will give each child a simple login name and a 4-digit PIN. They can easily sign in from any phone, tablet, or computer.',
      tag: 'Ready to Begin',
      icon: '🔑',
    },
  ];

  const [signedInName, setSignedInName] = useState('');
  const [pendingModuleRedirect, setPendingModuleRedirect] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setPendingModuleRedirect(sessionStorage.getItem('lanternLionPendingModuleRedirect') || '');
      } catch { /* Storage unavailable; no resume link shown. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
      ['lanternLionDemoFamily','lanternLionDemoAssignments','lanternLionDemoProgress','lanternLionDemoHelpRequest','lanternLionActiveChildId','lanternLionChildSession','lanternLionTeenSession','lanternLionTeacherSession'].forEach((key) => localStorage.removeItem(key));
      localStorage.setItem('lanternLionDemoParent', JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, country }));
      localStorage.setItem('lanternLionDemoSession', JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }));
      setIsNewAccount(true);
      setTourStep(1);
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
    const accountName = matchesDemo ? demoAccount.name : savedAccount?.name ?? 'Parent';
    localStorage.setItem('lanternLionDemoSession', JSON.stringify({ name: accountName, email: normalizedEmail }));
    setIsNewAccount(false);
    setSignedInName(accountName);
  }

  if (signedInName) {
    if (isNewAccount) {
      const step = tourSteps[tourStep - 1];
      return (
        <main className="parent-access-page">
          <section className="access-tour-card">
            <div className="tour-header">
              <div className="tour-badge">
                <span>{step.icon}</span>
                <small>{step.tag}</small>
              </div>
              <div className="tour-progress" aria-label={`Step ${tourStep} of ${tourSteps.length}`}>
                <span>Step {tourStep} of {tourSteps.length}</span>
                <div className="tour-dots">
                  {tourSteps.map((_, i) => (
                    <span key={i} className={i + 1 <= tourStep ? 'active' : ''} />
                  ))}
                </div>
              </div>
            </div>

            <p className="access-kicker">{step.kicker}</p>
            <h1>{step.title}</h1>
            <p className="tour-body">{step.body}</p>

            <div className="tour-preview-box">
              {tourStep === 1 && (
                <div className="tour-widget widget-dashboard">
                  <div className="widget-row">
                    <span className="w-avatar">A</span>
                    <div><strong>Amara · Age 9</strong><small>3 stories · 2 verses memorised</small></div>
                    <span className="w-status">Active today</span>
                  </div>
                  <div className="widget-bar"><i style={{ width: '60%' }} /></div>
                </div>
              )}
              {tourStep === 2 && (
                <div className="tour-widget widget-safety">
                  <div className="safe-pill">🔒 Private family sanctuary</div>
                  <div className="safe-pill">🚫 No open public chats</div>
                  <div className="safe-pill">👀 Parent monitors anytime</div>
                </div>
              )}
              {tourStep === 3 && (
                <div className="tour-widget widget-clubs">
                  <div className="club-card lantern-card">
                    <strong>The Lantern Club</strong>
                    <small>Ages 5–12 · Stories, puzzles, badges</small>
                  </div>
                  <div className="club-card lion-card">
                    <strong>Lion’s Den</strong>
                    <small>Ages 13–17 · Case files, real life</small>
                  </div>
                </div>
              )}
              {tourStep === 4 && (
                <div className="tour-widget widget-pin">
                  <div className="pin-demo-box">
                    <span>Child Login:</span>
                    <strong>amara</strong> + <b>PIN [ • • • • ]</b>
                  </div>
                  <small>No email needed for children!</small>
                </div>
              )}
            </div>

            <div className="tour-actions">
              {tourStep > 1 && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setTourStep(tourStep - 1)}
                >
                  Back
                </button>
              )}
              {tourStep < tourSteps.length ? (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setTourStep(tourStep + 1)}
                >
                  Next: {tourSteps[tourStep].tag} →
                </button>
              ) : (
                <a className="button button-primary" href="/family-setup">
                  Create child profiles now →
                </a>
              )}
            </div>
            <button
              type="button"
              className="tour-skip"
              onClick={() => setIsNewAccount(false)}
            >
              Skip tour &amp; go to family setup
            </button>
          </section>
        </main>
      );
    }

    return (
      <main className="parent-access-page">
        <section className="access-success-card">
          <div className="access-success-mark"><span></span></div>
          <p className="access-kicker">Parent access confirmed</p>
          <h1>Welcome, {signedInName.split(' ')[0]}.</h1>
          <p>Your parent account is active. Manage your family, set child usernames and PINs, and view activity reports.</p>
          {pendingModuleRedirect && (
            <div className="access-next-preview">
              <span>Picking up where you left off</span>
              <strong>Continue the lesson you were previewing</strong>
              <small>You clicked into a curriculum lesson before signing in. Jump straight back in, or set up your family first.</small>
              <a
                className="button button-primary"
                href={pendingModuleRedirect}
                onClick={() => {
                  try { sessionStorage.removeItem('lanternLionPendingModuleRedirect'); } catch { /* No-op */ }
                }}
                style={{ marginTop: 12 }}
              >
                Continue to the lesson →
              </a>
            </div>
          )}
          <div className="access-next-preview">
            <span>Next step</span>
            <strong>Set up your family &amp; child logins</strong>
            <small>Add child profiles, generate login usernames, and assign 4-digit PINs.</small>
          </div>
          <a className="button button-primary" href="/family-setup">Set up child profiles</a>
          <a className="access-secondary-link" href="/parent-dashboard">Open parent dashboard</a>
          <button
            type="button"
            className="access-secondary-link tour-review-btn"
            onClick={() => { setIsNewAccount(true); setTourStep(1); }}
          >
            Review platform tour
          </button>
          <button
            className="access-signout"
            onClick={() => {
              localStorage.removeItem('lanternLionDemoSession');
              setSignedInName('');
              setPassword('');
            }}
          >
            Sign out of demo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="parent-access-page">
      <section className="access-story-panel">
        <Link className="access-brand" href="/" aria-label="Lantern and Lion home"><Image src="/lantern-lion-logo.png" alt="" width={64} height={64} priority /><span><strong>Lantern &amp; Lion</strong><small>The Lantern Club</small></span></Link>
        <div className="access-story-copy"><p className="access-kicker">The grown-up space</p><h1>Stay close while they grow.</h1><p>Your parent account keeps family details, progress and privacy controls in one place.</p><ul><li><span>01</span>Children don’t need their own email.</li><li><span>02</span>You decide who can join the family.</li><li><span>03</span>No payment is needed during this demo.</li></ul></div>
        <p className="access-story-note">Demo mode stores test details only on this device.</p>
      </section>

      <section className="access-form-panel">
        <div className="access-form-wrap">
          <div className="access-tabs" aria-label="Parent account access"><button aria-pressed={mode === 'signin'} onClick={() => switchMode('signin')}>Sign in</button><button aria-pressed={mode === 'signup'} onClick={() => switchMode('signup')}>Create account</button></div>

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
          <Link className="access-home-link" href="/">Back to the home page</Link>
        </div>
      </section>
    </main>
  );
}
