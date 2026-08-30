'use client';

import { useEffect, useRef } from 'react';

const HEARTBEAT_INTERVAL_MS = 30_000;
const INACTIVITY_THRESHOLD_MS = 5 * 60_000; // matches the server default; server also enforces its own threshold
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const;

/**
 * Tracks meaningful active usage (not "tab left open") for a logged-in
 * child/teen session, and reports it to the server so parents/teachers see
 * real active time rather than raw session duration. Mount once per
 * dashboard while a child session cookie is present.
 */
export function useActivityHeartbeat(enabled: boolean) {
  const lastActivityRef = useRef(0);
  const activeSinceLastTickRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    lastActivityRef.current = Date.now();

    function markActive() {
      lastActivityRef.current = Date.now();
    }
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive, { passive: true }));

    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor < INACTIVITY_THRESHOLD_MS) {
        activeSinceLastTickRef.current += HEARTBEAT_INTERVAL_MS / 1000;
      }
      const activeSeconds = activeSinceLastTickRef.current;
      activeSinceLastTickRef.current = 0;
      if (activeSeconds > 0) {
        fetch('/api/activity/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeSeconds }),
        }).catch(() => {
          // Offline/network failure — the next successful heartbeat catches up.
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    function endSession() {
      navigator.sendBeacon?.('/api/child-auth/logout', new Blob([JSON.stringify({})], { type: 'application/json' }));
    }
    window.addEventListener('pagehide', endSession);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
      window.clearInterval(tick);
      window.removeEventListener('pagehide', endSession);
    };
  }, [enabled]);
}
