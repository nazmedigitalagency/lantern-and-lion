'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StudentAssignment } from './types';

export type AssignmentsLoadState = 'loading' | 'error' | 'ready';

/** Single shared fetch for the student assignment list — used by both the compact widget and the full page. */
export function useStudentAssignments() {
  const [assignments, setAssignments] = useState<StudentAssignment[] | null>(null);
  const [state, setState] = useState<AssignmentsLoadState>('loading');

  const load = useCallback(() => {
    setState('loading');
    fetch('/api/child/assignments')
      .then((res) => (res.ok ? (res.json() as Promise<{ assignments: StudentAssignment[] }>) : Promise.reject()))
      .then((data) => {
        setAssignments(data.assignments);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, load() owns its own state
    load();
  }, [load]);

  return { assignments, state, reload: load };
}
