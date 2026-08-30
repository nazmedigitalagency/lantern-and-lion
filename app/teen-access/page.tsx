'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type Teen = { id: number; name: string; username: string; age: number; avatar: string; pin: string };
type FamilyData = { familyName: string; children: Teen[] };

const defaultDemoFamily: FamilyData = {
  familyName: 'The Adeyemi Family',
  children: [
    { id: 1, name: 'Amara', username: 'amara', age: 9, avatar: 'lion', pin: '2468' },
    { id: 2, name: 'Tobi', username: 'tobi', age: 14, avatar: 'lantern', pin: '1357' },
  ],
};

export default function TeenAccessPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successTeen, setSuccessTeen] = useState<Teen | null>(null);
  const [teens, setTeens] = useState<Teen[]>(defaultDemoFamily.children.filter((c) => c.age >= 13));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedFamily = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
        if (storedFamily?.children?.length) {
          const normalized: Teen[] = storedFamily.children
            .map((c: Teen) => ({ ...c, username: c.username || c.name.toLowerCase().replace(/[^a-z0-9]/g, '') }))
            .filter((c: Teen) => c.age >= 13);
          if (normalized.length) setTeens(normalized);
        }
      } catch { /* Use default */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleKeypadPress(digit: string) {
    setError('');
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4 && username.trim()) validateLogin(username.trim(), nextPin);
    }
  }
  function handleKeypadDelete() { setError(''); setPin((prev) => prev.slice(0, -1)); }
  function handleKeypadClear() { setError(''); setPin(''); }

  function validateLogin(enteredUsername: string, enteredPin: string) {
    setError('');
    const cleanUser = enteredUsername.trim().toLowerCase();
    const found = teens.find((t) => (t.username.toLowerCase() === cleanUser || t.name.toLowerCase() === cleanUser) && t.pin === enteredPin);

    if (found) {
      setSuccessTeen(found);
      localStorage.setItem('lanternLionTeenSession', JSON.stringify({ teenId: found.id, username: found.username, name: found.name, age: found.age }));
      localStorage.setItem('lanternLionActiveChildId', String(found.id));
      window.setTimeout(() => {
        let pending: string | null = null;
        try {
          pending = sessionStorage.getItem('lanternLionPendingModuleRedirect');
          if (pending) sessionStorage.removeItem('lanternLionPendingModuleRedirect');
        } catch { /* Storage unavailable; fall back to the dashboard. */ }
        router.push(pending || '/teen-dashboard');
      }, 1200);
      return;
    }

    const exists = teens.some((t) => t.username.toLowerCase() === cleanUser || t.name.toLowerCase() === cleanUser);
    if (exists) setError('That 4-digit PIN is not quite right. Ask your grown-up if you forgot it.');
    else setError('We couldn’t find that login name in the Lion’s Den. Check with your parent, or sign in to the Lantern Club instead.');
    setPin('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim()) { setError('Please type your login name first.'); return; }
    if (pin.length !== 4) { setError('Please enter your 4-digit PIN.'); return; }
    validateLogin(username, pin);
  }

  function fillDemoTeen(teen: Teen) { setUsername(teen.username); setPin(teen.pin); setError(''); validateLogin(teen.username, teen.pin); }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span /><p>Opening the Lion’s Den…</p></main>;

  return (
    <main className="teen-access-page">
      <header className="teen-access-topbar">
        <Link className="teen-access-brand" href="/" aria-label="Lantern and Lion home">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span><strong>Lantern &amp; Lion</strong><small>Lion’s Den · Teen Access</small></span>
        </Link>
        <Link className="teen-access-exit" href="/">Back to home</Link>
      </header>

      <section className="teen-access-card">
        {successTeen ? (
          <div className="teen-access-success">
            <div className="teen-success-badge"><span>🔥</span></div>
            <p className="teen-access-kicker">Welcome back</p>
            <h1>Hey, {successTeen.name}.</h1>
            <p>Opening your Lion’s Den space now…</p>
            <div className="teen-success-loader"><span /></div>
          </div>
        ) : (
          <>
            <div className="teen-access-intro">
              <div className="teen-mark-badge"><span>🦁</span></div>
              <p className="teen-access-kicker">Teen Sign-in · Ages 13–17</p>
              <h1>Enter the Lion’s Den</h1>
              <p>Type your login name and your 4-digit PIN. Tougher lessons, real questions, no shortcuts.</p>
            </div>

            {teens.length > 0 && (
              <div className="teen-demo-helpers">
                <span>Demo profile:</span>
                <div className="teen-demo-chip-group">
                  {teens.map((t) => (
                    <button key={t.id} type="button" className="teen-demo-chip" onClick={() => fillDemoTeen(t)}>
                      <b>{t.name}</b> (@{t.username} · PIN {t.pin})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="teen-access-form">
              <label className="teen-input-label">
                <span>Your login username</span>
                <input autoFocus autoComplete="username" autoCapitalize="none" value={username}
                  onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')); setError(''); }}
                  placeholder="e.g. tobi" maxLength={18} />
              </label>

              <div className="teen-pin-container">
                <label className="teen-pin-label">Your 4-digit PIN</label>
                <div className="teen-pin-dots-row">
                  {[0, 1, 2, 3].map((i) => <div key={i} className={`teen-pin-dot ${pin.length > i ? 'filled' : ''}`}>{pin.length > i ? '●' : ''}</div>)}
                </div>
                <div className="teen-pin-keypad" role="group" aria-label="PIN Keypad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button key={digit} type="button" className="teen-keypad-btn" onClick={() => handleKeypadPress(digit)}>{digit}</button>
                  ))}
                  <button type="button" className="teen-keypad-btn teen-keypad-util" onClick={handleKeypadClear} title="Clear">Clear</button>
                  <button type="button" className="teen-keypad-btn" onClick={() => handleKeypadPress('0')}>0</button>
                  <button type="button" className="teen-keypad-btn teen-keypad-util" onClick={handleKeypadDelete} title="Delete">⌫</button>
                </div>
              </div>

              {error && <p className="teen-access-error" role="alert">{error}</p>}

              <button type="submit" className="teen-submit-btn" disabled={!username.trim() || pin.length !== 4}>Enter the Lion’s Den →</button>
            </form>

            <div className="teen-access-footer">
              <p>Under 13? <Link href="/child-access">Sign in to the Lantern Club</Link></p>
              <p>Are you a parent or teacher? <Link href="/parent-access">Sign in as grown-up</Link></p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
