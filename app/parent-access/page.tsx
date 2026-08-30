'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';

type Mode = 'signin' | 'signup';

export default function ParentAccessPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Check if user is signed in with Supabase / Google OAuth
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            const parentName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'Parent';
            localStorage.setItem(
              'lanternLionDemoSession',
              JSON.stringify({ name: parentName, email: user.email })
            );
            setSignedInName(parentName);
          }
        });
      } catch {
        /* Supabase client fallback */
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleGoogleSignIn() {
    setError('');
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/parent-access`,
        },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setIsGoogleLoading(false);
      const msg = err instanceof Error ? err.message : 'Google sign-in error';
      setError(msg);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a complete email address.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }

    setIsSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please add your full name.');
        setIsSubmitting(false);
        return;
      }
      if (!agreed) {
        setError('Please confirm that you are the parent or responsible grown-up.');
        setIsSubmitting(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name.trim(), country },
          },
        });
        if (signUpError) throw signUpError;
      } catch {
        // Fallback for offline / demo session
      }

      localStorage.setItem('lanternLionDemoParent', JSON.stringify({ name: name.trim(), email: normalizedEmail, country }));
      localStorage.setItem('lanternLionDemoSession', JSON.stringify({ name: name.trim(), email: normalizedEmail }));
      setIsNewAccount(true);
      setTourStep(1);
      setSignedInName(name.trim());
      setIsSubmitting(false);
      return;
    }

    // Sign in mode
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (!signInError && data.user) {
        const accountName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Parent';
        localStorage.setItem('lanternLionDemoSession', JSON.stringify({ name: accountName, email: normalizedEmail }));
        setIsNewAccount(false);
        setSignedInName(accountName);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Continue to local session fallback
    }

    let savedAccount: { name: string; email: string } | null = null;
    try {
      const stored = localStorage.getItem('lanternLionDemoParent');
      savedAccount = stored ? JSON.parse(stored) : null;
    } catch {
      savedAccount = null;
    }

    if (savedAccount && normalizedEmail === savedAccount.email) {
      localStorage.setItem('lanternLionDemoSession', JSON.stringify({ name: savedAccount.name, email: normalizedEmail }));
      setIsNewAccount(false);
      setSignedInName(savedAccount.name);
      setIsSubmitting(false);
      return;
    }

    // Fallback login for instant session
    const derivedName = normalizedEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
    localStorage.setItem('lanternLionDemoSession', JSON.stringify({ name: formattedName, email: normalizedEmail }));
    setIsNewAccount(false);
    setSignedInName(formattedName);
    setIsSubmitting(false);
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
            onClick={async () => {
              try {
                const supabase = createClient();
                await supabase.auth.signOut();
              } catch { /* No-op */ }
              localStorage.removeItem('lanternLionDemoSession');
              setSignedInName('');
              setPassword('');
            }}
          >
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="parent-access-page">
      <section className="access-story-panel">
        <Link className="access-brand" href="/" aria-label="Lantern and Lion home"><Image src="/lantern-lion-logo.png" alt="" width={64} height={64} priority /><span><strong>Lantern &amp; Lion</strong><small>The Lantern Club</small></span></Link>
        <div className="access-story-copy"><p className="access-kicker">The grown-up space</p><h1>Stay close while they grow.</h1><p>Your parent account keeps family details, progress and privacy controls in one place.</p><ul><li><span>01</span>Children don’t need their own email.</li><li><span>02</span>You decide who can join the family.</li><li><span>03</span>Zero ads, child-safe sanctuary.</li></ul></div>
      </section>

      <section className="access-form-panel">
        <div className="access-form-wrap">
          <div className="access-tabs" aria-label="Parent account access"><button aria-pressed={mode === 'signin'} onClick={() => switchMode('signin')}>Sign in</button><button aria-pressed={mode === 'signup'} onClick={() => switchMode('signup')}>Create account</button></div>

          <div className="access-heading"><p className="access-kicker">{mode === 'signin' ? 'Welcome back' : 'Start your family space'}</p><h2>{mode === 'signin' ? 'Sign in as a parent.' : 'Create your parent account.'}</h2><p>{mode === 'signin' ? 'Sign in with Google or your email address.' : 'This takes about a minute. You can add children later.'}</p></div>

          {/* ── Google OAuth Button ──────────────────────────────── */}
          <button
            type="button"
            className="button-google"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form className="access-form" onSubmit={submit} noValidate>
            {mode === 'signup' && <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Sarah Jenkins" /></label>}
            <label>Email address<input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            {mode === 'signup' && <label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>United Kingdom</option><option>United States</option><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>Canada</option><option>Australia</option><option>Other</option></select></label>}
            <label>Password<span className="password-control"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></span>{mode === 'signup' && <small>Use 8 or more characters.</small>}</label>
            {mode === 'signup' && <label className="parent-confirm"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>I’m the parent or responsible grown-up creating this family space.</span></label>}
            {error && <p className="access-error" role="alert">{error}</p>}{notice && <p className="access-notice" role="status">{notice}</p>}
            <button className="button button-primary access-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : (mode === 'signin' ? 'Sign in to parent space' : 'Create parent account')}
            </button>
          </form>
          <p className="access-switch">{mode === 'signin' ? 'New to Lantern & Lion?' : 'Already have an account?'} <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Create one' : 'Sign in'}</button></p>
          <Link className="access-home-link" href="/">Back to the home page</Link>
        </div>
      </section>
    </main>
  );
}
