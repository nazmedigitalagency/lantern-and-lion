'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Codes = { teacherCode: string; gameCode: string };
type ToastMessage = { id: number; text: string };

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * "My Lantern & Lion Codes" — shown on both Child and Teen dashboards.
 * Two visually distinct codes: a long-lived Teacher Code for classroom
 * connection requests, and a rotatable Game Code for multiplayer. Backed by
 * GET/POST /api/child/codes* (real DB columns on `children`, generated
 * server-side) — never a frontend-only placeholder.
 */
export default function LanternCodesPanel({ variant }: { variant: 'child' | 'teen' }) {
  const [codes, setCodes] = useState<Codes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((text: string) => {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const loadCodes = useCallback(() => {
    setLoading(true);
    setError('');
    fetch('/api/child/codes')
      .then((res) => (res.ok ? (res.json() as Promise<Codes>) : Promise.reject()))
      .then((data) => setCodes(data))
      .catch(() => setError('We could not load your codes. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, loadCodes owns its own loading/error state
    loadCodes();
  }, [loadCodes]);

  async function handleCopy(kind: 'teacher' | 'game', value: string) {
    const ok = await copyText(value);
    pushToast(ok ? `${kind === 'teacher' ? 'Teacher' : 'Game'} Code copied.` : 'Could not copy — please select and copy manually.');
  }

  async function handleShare(kind: 'teacher' | 'game', value: string) {
    const text =
      kind === 'teacher'
        ? `My Lantern & Lion Teacher Code is ${value}. Use it to send me a classroom connection request.`
        : `Join my Lantern & Lion game with this code: ${value}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled the share sheet, or it failed silently — fall back to copy.
      }
    }
    const ok = await copyText(text);
    pushToast(ok ? `${kind === 'teacher' ? 'Teacher' : 'Game'} Code share text copied.` : 'Sharing is not available on this device.');
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setConfirmingRegenerate(false);
    try {
      const res = await fetch('/api/child/codes/regenerate-game-code', { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        pushToast(data?.error || 'Could not generate a new Game Code. Please try again.');
        return;
      }
      const data = (await res.json()) as { gameCode: string };
      setCodes((current) => (current ? { ...current, gameCode: data.gameCode } : current));
      pushToast('New Game Code generated. Your old code no longer works.');
    } catch {
      pushToast('Could not generate a new Game Code. Please try again.');
    } finally {
      setRegenerating(false);
    }
  }

  const prefix = variant === 'teen' ? 'teen-codes' : 'kid-codes';

  return (
    <section className={`ll-codes-panel ${prefix}`} aria-label="My Lantern & Lion Codes">
      <div className="ll-codes-intro">
        <h2>My Lantern &amp; Lion Codes</h2>
        <p>
          Use these codes for different things. Your <strong>Teacher Code</strong> helps your teacher connect you to their
          classroom. Your <strong>Game Code</strong> lets you play with friends.
        </p>
      </div>

      {loading && (
        <div className="ll-codes-loading" role="status" aria-live="polite">
          <span aria-hidden="true" />
          <p>Loading your codes…</p>
        </div>
      )}

      {!loading && error && (
        <div className="ll-codes-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadCodes}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && codes && (
        <div className="ll-codes-grid">
          <article className="ll-code-card ll-code-teacher">
            <header>
              <span className="ll-code-icon" aria-hidden="true">
                🍎
              </span>
              <div>
                <h3>Teacher Code</h3>
                <p className="ll-code-tagline">For your teacher</p>
              </div>
            </header>
            <p className="ll-code-desc">Share this code with your teacher so they can send you a classroom connection request.</p>
            <div className="ll-code-value" aria-live="off">
              <span>{codes.teacherCode}</span>
            </div>
            <div className="ll-code-actions">
              <button type="button" onClick={() => handleCopy('teacher', codes.teacherCode)}>
                Copy
              </button>
              <button type="button" onClick={() => handleShare('teacher', codes.teacherCode)}>
                Share
              </button>
            </div>
            <p className="ll-code-helper">🔒 Only share this with your teacher or a trusted adult.</p>
          </article>

          <article className="ll-code-card ll-code-game">
            <header>
              <span className="ll-code-icon" aria-hidden="true">
                🎮
              </span>
              <div>
                <h3>Game Code</h3>
                <p className="ll-code-tagline">For your friends</p>
              </div>
            </header>
            <p className="ll-code-desc">Share this with friends when you want to play a multiplayer game together.</p>
            <div className="ll-code-value" aria-live="off">
              <span>{codes.gameCode}</span>
            </div>
            <div className="ll-code-actions">
              <button type="button" onClick={() => handleCopy('game', codes.gameCode)}>
                Copy
              </button>
              <button type="button" onClick={() => handleShare('game', codes.gameCode)}>
                Share
              </button>
              <button type="button" onClick={() => setConfirmingRegenerate(true)} disabled={regenerating}>
                {regenerating ? 'Working…' : 'New Code'}
              </button>
            </div>
            <p className="ll-code-helper">This code does not show your name, email, or any private information.</p>
          </article>
        </div>
      )}

      {confirmingRegenerate && (
        <div className="ll-codes-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm new Game Code">
          <div className="ll-codes-confirm">
            <p>
              Getting a new Game Code means your old code <strong>stops working</strong>. Anyone with the old code will not be
              able to join you anymore.
            </p>
            <div className="ll-codes-confirm-actions">
              <button type="button" className="ll-codes-confirm-cancel" onClick={() => setConfirmingRegenerate(false)}>
                Cancel
              </button>
              <button type="button" className="ll-codes-confirm-go" onClick={handleRegenerate}>
                Get New Code
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ll-codes-toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="ll-codes-toast">
            {t.text}
          </div>
        ))}
      </div>
    </section>
  );
}
