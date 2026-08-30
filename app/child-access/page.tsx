'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type Child = { id: number; name: string; username: string; age: number; avatar: string; pin: string };
type FamilyData = { familyName: string; children: Child[] };

const defaultDemoFamily: FamilyData = {
  familyName: 'The Adeyemi Family',
  children: [
    { id: 1, name: 'Amara', username: 'amara', age: 9, avatar: 'lion', pin: '2468' },
    { id: 2, name: 'Tobi', username: 'tobi', age: 14, avatar: 'lantern', pin: '1357' },
  ],
};

export default function ChildAccessPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successChild, setSuccessChild] = useState<Child | null>(null);
  const [family, setFamily] = useState<FamilyData>({
    ...defaultDemoFamily,
    children: defaultDemoFamily.children.filter((c) => c.age < 13),
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedFamily = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
        if (storedFamily?.children?.length) {
          const normalized = {
            ...storedFamily,
            children: storedFamily.children
              .map((c: Child) => ({
                ...c,
                username: c.username || c.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
              }))
              .filter((c: Child) => c.age < 13),
          };
          setFamily(normalized);
        }
      } catch {
        /* Use default */
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleKeypadPress(digit: string) {
    setError('');
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4 && username.trim()) {
        validateLogin(username.trim(), nextPin);
      }
    }
  }

  function handleKeypadDelete() {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }

  function handleKeypadClear() {
    setError('');
    setPin('');
  }

  function validateLogin(enteredUsername: string, enteredPin: string) {
    setError('');
    const cleanUser = enteredUsername.trim().toLowerCase();
    const foundChild = family.children.find(
      (c) => (c.username.toLowerCase() === cleanUser || c.name.toLowerCase() === cleanUser) && c.pin === enteredPin
    );

    if (foundChild) {
      setSuccessChild(foundChild);
      localStorage.setItem(
        'lanternLionChildSession',
        JSON.stringify({ childId: foundChild.id, username: foundChild.username, name: foundChild.name })
      );
      localStorage.setItem('lanternLionActiveChildId', String(foundChild.id));
      window.setTimeout(() => {
        let pending: string | null = null;
        try {
          pending = sessionStorage.getItem('lanternLionPendingModuleRedirect');
          if (pending) sessionStorage.removeItem('lanternLionPendingModuleRedirect');
        } catch { /* Storage unavailable; fall back to the dashboard. */ }
        router.push(pending || (foundChild.age >= 13 ? '/teen-dashboard' : '/child-dashboard'));
      }, 1200);
      return;
    }

    // Check if user exists but PIN was wrong
    const userExists = family.children.some(
      (c) => c.username.toLowerCase() === cleanUser || c.name.toLowerCase() === cleanUser
    );
    if (userExists) {
      setError('That 4-digit PIN is not quite right. Ask your grown-up if you forgot it!');
    } else {
      setError('We couldn’t find that login name in the Lantern Club. Check with your parent, or sign in to the Lion’s Den instead.');
    }
    setPin('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim()) {
      setError('Please type your login name first.');
      return;
    }
    if (pin.length !== 4) {
      setError('Please enter your 4-digit PIN.');
      return;
    }
    validateLogin(username, pin);
  }

  function fillDemoChild(child: Child) {
    setUsername(child.username);
    setPin(child.pin);
    setError('');
    validateLogin(child.username, child.pin);
  }

  if (!hydrated) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span />
        <p>Opening child sign-in…</p>
      </main>
    );
  }

  return (
    <main className="child-access-page">
      <header className="child-access-header">
        <Link className="child-access-brand" href="/" aria-label="Lantern and Lion home">
          <Image src="/lantern-lion-logo.png" alt="" width={56} height={56} priority />
          <span>
            <strong>Lantern &amp; Lion</strong>
            <small>Lantern Club · Child Access</small>
          </span>
        </Link>
        <Link className="child-access-exit" href="/">
          Back to home
        </Link>
      </header>

      <section className="child-access-card">
        {successChild ? (
          <div className="child-access-success">
            <div className="success-badge">
              <span>{successChild.avatar === 'lion' ? '🦁' : '🏮'}</span>
            </div>
            <p className="access-kicker">Welcome back!</p>
            <h1>Hi, {successChild.name}!</h1>
            <p>
              Opening your Lantern Club space now…
            </p>
            <div className="success-loader">
              <span />
            </div>
          </div>
        ) : (
          <>
            <div className="child-access-intro">
              <div className="child-mark-badge">
                <span>🏮</span>
              </div>
              <p className="access-kicker">Lantern Club Sign-in</p>
              <h1>Enter your Club</h1>
              <p>Type your login name and tap your 4-digit secret PIN.</p>
            </div>

            {/* Demo Quick Select */}
            {family.children.length > 0 && (
              <div className="child-demo-helpers">
                <span>Demo profiles:</span>
                <div className="demo-chip-group">
                  {family.children.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="demo-chip"
                      onClick={() => fillDemoChild(c)}
                    >
                      <b>{c.name}</b> (@{c.username} · PIN {c.pin})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="child-access-form">
              <label className="child-input-label">
                <span>Your login username</span>
                <input
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    setError('');
                  }}
                  placeholder="e.g. amara"
                  maxLength={18}
                />
              </label>

              {/* 4-digit PIN Dots display */}
              <div className="pin-container">
                <label className="pin-label">Your 4-digit PIN</label>
                <div className="pin-dots-row">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`}>
                      {pin.length > i ? '●' : ''}
                    </div>
                  ))}
                </div>

                {/* On-screen Keypad */}
                <div className="pin-keypad" role="group" aria-label="PIN Keypad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      className="keypad-btn"
                      onClick={() => handleKeypadPress(digit)}
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="keypad-btn keypad-util"
                    onClick={handleKeypadClear}
                    title="Clear"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="keypad-btn"
                    onClick={() => handleKeypadPress('0')}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="keypad-btn keypad-util"
                    onClick={handleKeypadDelete}
                    title="Delete"
                  >
                    ⌫
                  </button>
                </div>
              </div>

              {error && (
                <p className="access-error child-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="button button-primary child-submit-btn"
                disabled={!username.trim() || pin.length !== 4}
              >
                Sign in to my dashboard →
              </button>
            </form>

            <div className="child-access-footer">
              <p>
                13 or older?{' '}
                <Link href="/teen-access">Sign in to the Lion’s Den</Link>
              </p>
              <p>
                Are you a parent or teacher?{' '}
                <Link href="/parent-access">Sign in as grown-up</Link>
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
