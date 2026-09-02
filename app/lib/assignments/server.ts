import type { SupabaseClient } from '@supabase/supabase-js';
import { bumpDailySummary, notifyChildOnce } from '../activity/server';
import type { AssignmentBucket, AssignmentType } from './types';

// "Due soon" mirrors the same short-horizon window used for "needs
// attention" elsewhere in the teacher dashboard, just applied to a due date
// instead of an inactivity gap.
const DUE_SOON_DAYS = 3;

export function assignmentBucket(status: 'draft' | 'assigned', dueDate: string | null, completedCount: number, totalTargets: number): AssignmentBucket {
  if (status === 'draft') return 'draft';
  if (totalTargets > 0 && completedCount >= totalTargets) return 'completed';
  if (dueDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(`${dueDate}T00:00:00`);
    const daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= DUE_SOON_DAYS) return 'due_soon';
  }
  return 'active';
}

export function studentDueBucket(dueDate: string | null, status: string): 'upcoming' | 'due_today' | 'due_soon' | 'overdue' | 'completed' {
  if (status === 'graded' || status === 'returned') return 'completed';
  if (!dueDate) return 'upcoming';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'due_today';
  if (daysUntil <= DUE_SOON_DAYS) return 'due_soon';
  return 'upcoming';
}

type AssignmentRow = {
  id: string;
  title: string;
  assignment_type: AssignmentType;
  reference_id: string | null;
  required_score: number | null;
  xp_reward: number | null;
  assigned_at: string | null;
};

type SubmissionRow = {
  id: string;
  child_id: string;
  status: string;
  score: number | null;
  xp_awarded: boolean;
};

/** A game score is derived from the real `mistakes` count the game itself reported — not invented, but a heuristic, since raw accuracy isn't persisted server-side for arcade games today. */
function scoreFromMistakes(mistakes: number | null | undefined): number {
  return Math.max(0, 100 - (mistakes || 0) * 10);
}

async function awardXpIfDue(admin: SupabaseClient, childId: string, assignment: AssignmentRow, score: number | null): Promise<boolean> {
  if (!assignment.xp_reward || assignment.xp_reward <= 0) return false;
  if (assignment.required_score !== null && (score === null || score < assignment.required_score)) return false;
  const { data: child } = await admin.from('children').select('family_id').eq('id', childId).maybeSingle();
  if (!child) return false;
  const { data: family } = await admin.from('families').select('timezone').eq('id', child.family_id).maybeSingle();
  await bumpDailySummary(admin, childId, family?.timezone || 'UTC', { xp_earned: assignment.xp_reward }, { last_activity_at: new Date().toISOString() });
  return true;
}

/** Only children already approved into one of this teacher's own classrooms — never trusts client-supplied ids beyond that check. */
export async function resolveTargetChildIds(admin: SupabaseClient, teacherId: string, classroomId?: string, studentIds?: string[]): Promise<string[]> {
  const { data: teacherClassrooms } = await admin.from('classrooms').select('id').eq('teacher_id', teacherId);
  const teacherClassroomIds = (teacherClassrooms || []).map((c) => c.id);
  if (teacherClassroomIds.length === 0) return [];

  const ids = new Set<string>();

  if (classroomId && teacherClassroomIds.includes(classroomId)) {
    const { data: roster } = await admin.from('classroom_students').select('child_id').eq('classroom_id', classroomId).eq('approved', true);
    for (const r of roster || []) ids.add(r.child_id);
  }

  if (studentIds && studentIds.length > 0) {
    const { data: memberships } = await admin
      .from('classroom_students')
      .select('child_id')
      .in('classroom_id', teacherClassroomIds)
      .eq('approved', true)
      .in('child_id', studentIds);
    for (const m of memberships || []) ids.add(m.child_id);
  }

  return Array.from(ids);
}

/**
 * Reconciles every submission for one assignment against the real content-
 * completion source for its type (story_progress / concept_mastery /
 * GAME_COMPLETED activity_events) and persists any newly-detected
 * completions — auto-scored types go straight to 'graded' since there's
 * nothing for a teacher to manually review. Written/custom submissions are
 * left alone here; they only change via explicit student submit / teacher
 * grade actions. Safe to call on every read.
 */
export async function syncAssignmentSubmissions(admin: SupabaseClient, assignment: AssignmentRow, submissions: SubmissionRow[]): Promise<void> {
  if (submissions.length === 0) return;
  const pending = submissions.filter((s) => s.status === 'assigned' || s.status === 'in_progress');
  if (pending.length === 0 || !assignment.reference_id || !assignment.assigned_at) return;

  const childIds = pending.map((s) => s.child_id);
  const since = assignment.assigned_at;
  const completions = new Map<string, { score: number; occurredAt: string }>();

  if (assignment.assignment_type === 'story') {
    const { data } = await admin
      .from('story_progress')
      .select('child_id, completed_at')
      .in('child_id', childIds)
      .eq('story_id', assignment.reference_id)
      .eq('status', 'completed')
      .gte('completed_at', since);
    for (const row of data || []) completions.set(row.child_id, { score: 100, occurredAt: row.completed_at });
  } else if (assignment.assignment_type === 'reading' || assignment.assignment_type === 'quiz' || assignment.assignment_type === 'memory') {
    const { data } = await admin
      .from('concept_mastery')
      .select('child_id, mastery_score, last_practiced_at')
      .in('child_id', childIds)
      .eq('concept_id', assignment.reference_id)
      .gte('last_practiced_at', since);
    for (const row of data || []) completions.set(row.child_id, { score: Math.round(row.mastery_score), occurredAt: row.last_practiced_at });
  } else if (assignment.assignment_type === 'game') {
    const { data } = await admin
      .from('activity_events')
      .select('child_id, occurred_at, metadata')
      .in('child_id', childIds)
      .eq('event_type', 'GAME_COMPLETED')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false });
    for (const row of data || []) {
      if (completions.has(row.child_id)) continue; // keep the most recent (rows are already newest-first)
      const meta = (row.metadata || {}) as { gameId?: string; mistakes?: number };
      if (meta.gameId !== assignment.reference_id) continue;
      completions.set(row.child_id, { score: scoreFromMistakes(meta.mistakes), occurredAt: row.occurred_at });
    }
  } else {
    return; // written/custom — no auto source.
  }

  const nowIso = new Date().toISOString();
  for (const submission of pending) {
    const found = completions.get(submission.child_id);
    if (!found) continue;
    const xpAwarded = submission.xp_awarded || await awardXpIfDue(admin, submission.child_id, assignment, found.score);
    await admin.from('assignment_submissions').update({
      status: 'graded',
      score: found.score,
      submitted_at: found.occurredAt,
      graded_at: nowIso,
      xp_awarded: xpAwarded,
      updated_at: nowIso,
    }).eq('id', submission.id);
    submission.status = 'graded';
    submission.score = found.score;

    // Auto-scored types (story/reading/quiz/memory/game) never go through a
    // teacher "return" action — this is the only signal the student gets
    // that their work was scored, so it fires here rather than in a route.
    await notifyChildOnce(admin, {
      childId: submission.child_id,
      type: 'ASSIGNMENT_GRADED',
      title: 'Your assignment was graded',
      body: `“${assignment.title}” — ${found.score}%`,
      payload: { assignmentId: assignment.id, score: found.score },
      dedupeKey: `assignment_graded_child:${assignment.id}:${submission.child_id}`,
    }).catch(() => {});
  }
}
