'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StudentChallengeView } from './types';

export type ChallengesLoadState = 'loading' | 'error' | 'ready';

/** Single shared fetch for the student's class challenge list. */
export function useStudentChallenges() {
  const [challenges, setChallenges] = useState<StudentChallengeView[] | null>(null);
  const [state, setState] = useState<ChallengesLoadState>('loading');

  const load = useCallback(() => {
    setState('loading');
    fetch('/api/child/challenges')
      .then((res) => (res.ok ? (res.json() as Promise<{ challenges: StudentChallengeView[] }>) : Promise.reject()))
      .then((data) => {
        setChallenges(data.challenges);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, load() owns its own state
    load();
  }, [load]);

  return { challenges, state, reload: load };
}
