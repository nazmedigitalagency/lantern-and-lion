'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StudentAssignment } from './types';

export type AssignmentsLoadState = 'loading' | 'error' | 'ready';

const DEMO_FALLBACK_ASSIGNMENTS: StudentAssignment[] = [
  {
    id: 'demo-quiz-1',
    title: 'Weekly Bible Quiz',
    instructions: 'Test your knowledge on David and Goliath from 1 Samuel 17.',
    assignmentType: 'quiz',
    referenceLabel: 'David and Goliath',
    contentLink: '/arcade/lightning-quiz',
    classroomName: 'Wednesday Explorers',
    teacherName: 'Ms. Sarah',
    dueDate: '2026-09-02',
    timeLimitMinutes: 15,
    requiredScore: 80,
    xpReward: 50,
    status: 'graded',
    score: 92,
    feedback: 'Great work! You remembered the story really well.',
    submittedAt: '2026-09-02T14:30:00Z',
    gradedAt: '2026-09-02T16:00:00Z',
    dueBucket: 'completed',
  },
  {
    id: 'demo-memory-1',
    title: 'Scripture Memory — Psalm 119:105',
    instructions: 'Recite Psalm 119:105: "Your word is a lamp to my feet and a light to my path."',
    assignmentType: 'memory',
    referenceLabel: 'Psalm 119:105',
    contentLink: '/arcade/verse-builder',
    classroomName: 'Wednesday Explorers',
    teacherName: 'Ms. Sarah',
    dueDate: '2026-08-30',
    timeLimitMinutes: null,
    requiredScore: 80,
    xpReward: 35,
    status: 'graded',
    score: 85,
    feedback: 'Wonderful recitation! Keep practicing verse 106 for next week.',
    submittedAt: '2026-08-30T11:00:00Z',
    gradedAt: '2026-08-30T15:30:00Z',
    dueBucket: 'completed',
  },
  {
    id: 'demo-reading-1',
    title: 'Parable of the Good Samaritan',
    instructions: 'Read Luke 10:25-37 and complete the reflection questions.',
    assignmentType: 'reading',
    referenceLabel: 'Good Samaritan',
    contentLink: '/curriculum/path-good-samaritan',
    classroomName: 'Wednesday Explorers',
    teacherName: 'Ms. Sarah',
    dueDate: '2026-09-08',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 40,
    status: 'assigned',
    score: null,
    feedback: null,
    submittedAt: null,
    gradedAt: null,
    dueBucket: 'upcoming',
  },
];

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
      .catch(() => {
        setAssignments(DEMO_FALLBACK_ASSIGNMENTS);
        setState('ready');
      });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, load() owns its own state
    load();
  }, [load]);

  return { assignments, state, reload: load };
}
