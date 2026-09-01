'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { awardCoins, awardGems, awardXP, getWallet } from '../lib/economy/wallet-service';

// id is a number for a locally-created demo profile, or a UUID string for
// an account fetched from the real server (see /api/child-auth/login).
type Teen = { id: number | string; name: string; username: string; age: number; avatar: string; pin: string };

const fallbackTeens: Teen[] = [
  { id: 2, name: 'Tobi', username: 'tobi', age: 14, avatar: 'lantern', pin: '1357' },
];

export default function TeenAccessPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successTeen, setSuccessTeen] = useState<Teen | null>(null);
  const [teens, setTeens] = useState<Teen[]>(fallbackTeens);
  const [hydrated, setHydrated] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedFamily = JSON.parse(
          localStorage.getItem('lanternLionDemoFamily') ||
          localStorage.getItem('lanternLionFamilyData') ||
          'null'
        );
        if (storedFamily?.children?.length) {
          const normalized: Teen[] = storedFamily.children
            .map((c: Teen) => ({ ...c, username: c.username || c.name.toLowerCase().replace(/[^a-z0-9]/g, '') }))
            .filter((c: Teen) => c.age >= 13);
          if (normalized.length) setTeens(normalized);
          else setTeens(fallbackTeens);
        } else {
          setTeens(fallbackTeens);
        }
      } catch {
        setTeens(fallbackTeens);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleKeypadPress(digit: string) {
    if (checking) return;
    setError('');
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4 && username.trim()) void validateLogin(username.trim(), nextPin);
    }
  }
  function handleKeypadDelete() { setError(''); setPin((prev) => prev.slice(0, -1)); }
  function handleKeypadClear() { setError(''); setPin(''); }

  function completeLogin(found: Teen, verifiedByServer: boolean) {
    setSuccessTeen(found);
    localStorage.setItem('lanternLionTeenSession', JSON.stringify({ teenId: found.id, username: found.username, name: found.name, age: found.age }));
    localStorage.setItem('lanternLionActiveChildId', String(found.id));

    try {
      const w = getWallet(found.id);
      if (w.xp === 0 && w.coins === 0 && w.gems === 0) {
        awardXP(found.id, 220, 'quest-mastery', 'Initial account setup');
        awardCoins(found.id, 45, 'quest-mastery', 'Starter treasure');
        awardGems(found.id, 12, 'quest-mastery', 'Kingdom starter gems');
      }
    } catch { /* Non-blocking wallet init */ }

    // A teen whose account only exists on the server (created on another
    // device/browser) needs this browser's local family list updated too,
    // since the dashboard still reads that local copy to find its profile.
    if (verifiedByServer) {
      try {
        const stored = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null') as { familyName: string; children: Teen[] } | null;
        const base = stored?.children?.length ? stored : { familyName: 'The Adeyemi Family', children: teens };
        if (!base.children.some((c) => c.id === found.id)) {
          localStorage.setItem('lanternLionDemoFamily', JSON.stringify({ ...base, children: [...base.children, found] }));
        }
      } catch { /* Non-blocking. */ }
    } else {
      fetch('/api/child-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: found.username, pin: found.pin }),
      }).catch(() => { /* Offline/local-only session. */ });
    }

    window.setTimeout(() => {
      let pending: string | null = null;
      try {
        pending = sessionStorage.getItem('lanternLionPendingModuleRedirect');
        if (pending) sessionStorage.removeItem('lanternLionPendingModuleRedirect');
      } catch { /* Storage unavailable; fall back to the dashboard. */ }
      router.push(pending || '/teen-dashboard');
    }, 1200);
  }

  async function validateLogin(enteredUsername: string, enteredPin: string) {
    setError('');
    const cleanUser = enteredUsername.trim().toLowerCase();
    const found = teens.find((t) => (t.username.toLowerCase() === cleanUser || t.name.toLowerCase() === cleanUser) && t.pin === enteredPin);

    if (found) {
      completeLogin(found, false);
      return;
    }

    // Not found locally — this browser's family list may just be stale.
    // Ask the real server before giving up, so login works across devices.
    setChecking(true);
    try {
      const res = await fetch('/api/child-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: enteredUsername, pin: enteredPin }),
      });
      if (res.ok) {
        const data = (await res.json()) as { child: { id: string; name: string; username: string; age: number; avatar: string } };
        setChecking(false);
        completeLogin({ ...data.child, pin: enteredPin }, true);
        return;
      }
    } catch {
      // Offline, or the server check failed — fall through.
    }
    setChecking(false);

    const exists = teens.some((t) => t.username.toLowerCase() === cleanUser || t.name.toLowerCase() === cleanUser);
    if (exists) setError('That 4-digit PIN is not quite right. Ask your grown-up if you forgot it.');
    else setError('We couldn’t find that login name in the Lion’s Den. Check with your parent, or sign in to the Lantern Club instead.');
    setPin('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim()) { setError('Please type your login name first.'); return; }
    if (pin.length !== 4) { setError('Please enter your 4-digit PIN.'); return; }
    void validateLogin(username, pin);
  }

  if (!hydrated) return <main className="dashboard-loading dashboard-loading-teen" aria-live="polite"><span /><p>Opening the Lion’s Den…</p></main>;

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
              <p>Type your login name and your 4-digit PIN given by your parent. Tougher lessons, real questions, no shortcuts.</p>
            </div>

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

              <button type="submit" className="teen-submit-btn" disabled={!username.trim() || pin.length !== 4 || checking}>{checking ? 'Checking…' : 'Enter the Lion’s Den →'}</button>
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
