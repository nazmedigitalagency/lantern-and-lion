import type { SupabaseClient } from '@supabase/supabase-js';
import { activityDateKey, bumpDailySummary, notifyChildOnce } from '../activity/server';
import { resolveTeacherScope } from '../insights/aggregate';
import { daysRemaining, percentComplete, resolveStatus, topContributors } from './server';
import type { ChallengeGoalType, ChallengeParticipant, ChallengeStatus, ClassChallengeSummary, StudentChallengeView } from './types';

const NEAR_COMPLETE_THRESHOLD = 90;

type ChallengeRow = {
  id: string; teacher_id: string; classroom_id: string; name: string; description: string | null;
  goal_type: ChallengeGoalType; goal_target: number; start_date: string; end_date: string;
  reward_type: 'xp' | 'none'; reward_amount: number; status: ChallengeStatus; completed_at: string | null;
  notified_started: boolean; notified_near_complete: boolean; notified_completed: boolean;
  updated_at: string;
};

/** Progress is always computed live from the same tables Insights/Timeline/leaderboards already read — never a second, persisted progress counter. */
async function computeContribution(admin: SupabaseClient, goalType: ChallengeGoalType, childIds: string[], startDate: string, endDate: string): Promise<Map<string, number>> {
  const byChild = new Map<string, number>();
  if (childIds.length === 0 || startDate > endDate) return byChild;

  if (goalType === 'stories') {
    const { data } = await admin
      .from('story_progress')
      .select('child_id, completed_at')
      .in('child_id', childIds)
      .eq('status', 'completed')
      .gte('completed_at', `${startDate}T00:00:00.000Z`)
      .lte('completed_at', `${endDate}T23:59:59.999Z`);
    for (const row of data || []) byChild.set(row.child_id, (byChild.get(row.child_id) || 0) + 1);
    return byChild;
  }

  const { data } = await admin
    .from('daily_activity_summary')
    .select('child_id, games_completed, lessons_completed, quests_completed, xp_earned')
    .in('child_id', childIds)
    .gte('activity_date', startDate)
    .lte('activity_date', endDate);

  for (const row of data || []) {
    const value = goalType === 'xp' ? row.xp_earned || 0 : goalType === 'lessons' ? row.lessons_completed || 0 : (row.games_completed || 0) + (row.lessons_completed || 0) + (row.quests_completed || 0);
    if (value === 0) continue;
    byChild.set(row.child_id, (byChild.get(row.child_id) || 0) + value);
  }
  return byChild;
}

/**
 * Reconciles one challenge against real activity: computes live progress,
 * advances status (active -> completed/expired) if due, awards the XP
 * reward once per participating child if newly completed, and sends the
 * started/near-complete/completed notifications at most once each. Safe to
 * call on every read, same "sync on read" convention as assignments.
 */
async function syncChallenge(admin: SupabaseClient, challenge: ChallengeRow, childIds: string[], names: Map<string, string>): Promise<{ summary: Omit<ClassChallengeSummary, 'classroomName'>; byChild: Map<string, number> }> {
  const todayKey = activityDateKey('UTC');
  const clampedEnd = challenge.end_date < todayKey ? challenge.end_date : todayKey;
  const byChild = challenge.start_date > todayKey ? new Map<string, number>() : await computeContribution(admin, challenge.goal_type, childIds, challenge.start_date, clampedEnd);
  const progress = Array.from(byChild.values()).reduce((sum, v) => sum + v, 0);

  const nextStatus = resolveStatus(challenge.status, progress, challenge.goal_target, challenge.end_date);
  const pct = percentComplete(progress, challenge.goal_target);
  const nowIso = new Date().toISOString();

  const updates: Record<string, unknown> = {};
  if (nextStatus !== challenge.status) {
    updates.status = nextStatus;
    if (nextStatus === 'completed') updates.completed_at = nowIso;
  }

  const participantIds = Array.from(byChild.keys());

  // Notifications — each flag fires at most once, guarded by a persisted column so re-reading the same challenge never re-notifies.
  if (!challenge.notified_started) {
    for (const childId of childIds) {
      await notifyChildOnce(admin, {
        childId,
        type: 'TEACHER_ANNOUNCEMENT',
        title: 'Your class started a challenge!',
        body: `“${challenge.name}” — work together to reach the goal.`,
        payload: { challengeId: challenge.id },
        dedupeKey: `challenge_started_child:${challenge.id}:${childId}`,
      }).catch(() => {});
    }
    updates.notified_started = true;
  }

  if (!challenge.notified_near_complete && nextStatus === 'active' && pct >= NEAR_COMPLETE_THRESHOLD) {
    for (const childId of participantIds) {
      await notifyChildOnce(admin, {
        childId,
        type: 'ACHIEVEMENT',
        title: 'Almost there!',
        body: `Your class is ${pct}% of the way to “${challenge.name}” — so close!`,
        payload: { challengeId: challenge.id },
        dedupeKey: `challenge_near_complete_child:${challenge.id}:${childId}`,
      }).catch(() => {});
    }
    updates.notified_near_complete = true;
  }

  if (!challenge.notified_completed && nextStatus === 'completed') {
    for (const childId of participantIds) {
      await notifyChildOnce(admin, {
        childId,
        type: 'ACHIEVEMENT',
        title: 'Class Challenge Complete! 🎉',
        body: `Your class finished “${challenge.name}” together!`,
        payload: { challengeId: challenge.id },
        dedupeKey: `challenge_completed_child:${challenge.id}:${childId}`,
      }).catch(() => {});
    }

    try {
      const { notifyTeacherChallengeCompleted } = await import('../teacher-notifications/server');
      await notifyTeacherChallengeCompleted(admin, {
        teacherId: challenge.teacher_id,
        challengeId: challenge.id,
        challengeName: challenge.name,
        classroomId: challenge.classroom_id,
      }).catch(() => {});
    } catch {
      /* Best effort */
    }

    updates.notified_completed = true;
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = nowIso;
    await admin.from('class_challenges').update(updates).eq('id', challenge.id);
  }

  // XP reward — awarded once per participating child, through the exact
  // same server-authoritative path assignments.xp_reward already uses.
  if (nextStatus === 'completed' && challenge.reward_type === 'xp' && challenge.reward_amount > 0 && participantIds.length > 0) {
    const { data: alreadyAwarded } = await admin.from('class_challenge_rewards').select('child_id').eq('challenge_id', challenge.id);
    const awardedSet = new Set((alreadyAwarded || []).map((r) => r.child_id));
    for (const childId of participantIds) {
      if (awardedSet.has(childId)) continue;
      const { error: claimError } = await admin.from('class_challenge_rewards').insert({ challenge_id: challenge.id, child_id: childId });
      if (claimError) continue; // unique-constraint race — another read already claimed it
      const { data: child } = await admin.from('children').select('family_id').eq('id', childId).maybeSingle();
      if (!child) continue;
      const { data: family } = await admin.from('families').select('timezone').eq('id', child.family_id).maybeSingle();
      await bumpDailySummary(admin, childId, family?.timezone || 'UTC', { xp_earned: challenge.reward_amount }, { last_activity_at: nowIso });
    }
  }

  const participants: ChallengeParticipant[] = Array.from(byChild.entries()).map(([childId, contribution]) => ({ studentId: childId, name: names.get(childId) || 'Student', contribution }));

  return {
    summary: {
      id: challenge.id,
      classroomId: challenge.classroom_id,
      name: challenge.name,
      description: challenge.description,
      goalType: challenge.goal_type,
      goalTarget: challenge.goal_target,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      rewardType: challenge.reward_type,
      rewardAmount: challenge.reward_amount,
      status: nextStatus,
      progress,
      percentComplete: pct,
      remaining: Math.max(0, challenge.goal_target - progress),
      daysRemaining: nextStatus === 'active' ? daysRemaining(challenge.end_date) : null,
      participantsCount: participantIds.length,
      totalStudents: childIds.length,
      topParticipants: topContributors(participants),
    },
    byChild,
  };
}

/** Every challenge across this teacher's classrooms (or one, if `classroomId` is given), newest first. */
export async function computeTeacherChallenges(admin: SupabaseClient, teacherId: string, classroomId?: string | null): Promise<ClassChallengeSummary[] | null> {
  const scope = await resolveTeacherScope(admin, teacherId, classroomId);
  if (!scope) return null;

  let query = admin.from('class_challenges').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false });
  if (classroomId) query = query.eq('classroom_id', classroomId);
  const { data: rows } = await query;
  const challenges = (rows || []) as ChallengeRow[];
  if (challenges.length === 0) return [];

  const classroomNameById = new Map(scope.allClassrooms.map((c) => [c.id, c.name]));

  // Roster per classroom (a teacher's challenges can span several classes).
  const classroomIds = Array.from(new Set(challenges.map((c) => c.classroom_id)));
  const { data: rosterRaw } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id, approved, children(name)')
    .in('classroom_id', classroomIds)
    .eq('approved', true);
  const rosterByClassroom = new Map<string, { childId: string; name: string }[]>();
  for (const r of (rosterRaw || []) as unknown as { classroom_id: string; child_id: string; children: { name: string } | null }[]) {
    const list = rosterByClassroom.get(r.classroom_id) || [];
    list.push({ childId: r.child_id, name: r.children?.name || 'Student' });
    rosterByClassroom.set(r.classroom_id, list);
  }

  const results: ClassChallengeSummary[] = [];
  for (const challenge of challenges) {
    const roster = rosterByClassroom.get(challenge.classroom_id) || [];
    const childIds = roster.map((r) => r.childId);
    const names = new Map(roster.map((r) => [r.childId, r.name]));
    const { summary } = await syncChallenge(admin, challenge, childIds, names);
    results.push({ ...summary, classroomName: classroomNameById.get(challenge.classroom_id) || 'Class' });
  }
  return results;
}

/** The "Challenge Leader" leaderboard input for one classroom's current (or most recently completed) challenge — reused by the classroom detail leaderboard. */
export async function computeChallengeLeaderForClassroom(admin: SupabaseClient, classroomId: string, childIds: string[], names: Map<string, string>): Promise<ChallengeParticipant[]> {
  const { data: rows } = await admin
    .from('class_challenges')
    .select('*')
    .eq('classroom_id', classroomId)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1);
  const challenge = (rows || [])[0] as ChallengeRow | undefined;
  if (!challenge) return [];
  const { summary } = await syncChallenge(admin, challenge, childIds, names);
  return summary.topParticipants;
}

/** Student-facing view: challenges for every classroom this child is an approved member of. */
export async function computeStudentChallenges(admin: SupabaseClient, childId: string): Promise<StudentChallengeView[]> {
  const { data: memberships } = await admin.from('classroom_students').select('classroom_id, classrooms(name)').eq('child_id', childId).eq('approved', true);
  const classroomRows = ((memberships || []) as unknown as { classroom_id: string; classrooms: { name: string } | null }[]);
  if (classroomRows.length === 0) return [];
  const classroomIds = classroomRows.map((m) => m.classroom_id);
  const classroomNameById = new Map(classroomRows.map((m) => [m.classroom_id, m.classrooms?.name || 'Class']));

  const { data: rows } = await admin.from('class_challenges').select('*').in('classroom_id', classroomIds).in('status', ['active', 'completed']).order('created_at', { ascending: false });
  const challenges = (rows || []) as ChallengeRow[];
  if (challenges.length === 0) return [];

  const { data: rosterRaw } = await admin.from('classroom_students').select('classroom_id, child_id, children(name)').in('classroom_id', classroomIds).eq('approved', true);
  const rosterByClassroom = new Map<string, { childId: string; name: string }[]>();
  for (const r of (rosterRaw || []) as unknown as { classroom_id: string; child_id: string; children: { name: string } | null }[]) {
    const list = rosterByClassroom.get(r.classroom_id) || [];
    list.push({ childId: r.child_id, name: r.children?.name || 'Student' });
    rosterByClassroom.set(r.classroom_id, list);
  }

  const results: StudentChallengeView[] = [];
  for (const challenge of challenges) {
    const roster = rosterByClassroom.get(challenge.classroom_id) || [];
    const childIds = roster.map((r) => r.childId);
    const names = new Map(roster.map((r) => [r.childId, r.name]));
    const { summary, byChild } = await syncChallenge(admin, challenge, childIds, names);
    // A completed/expired challenge only stays visible to the student for a few days, so the widget doesn't clutter up with old history.
    if (summary.status === 'expired') continue;
    if (summary.status === 'completed' && summary.daysRemaining === null) {
      const completedDaysAgo = Math.floor((Date.now() - new Date(challenge.completed_at || challenge.updated_at || Date.now()).getTime()) / 86_400_000);
      if (completedDaysAgo > 5) continue;
    }
    results.push({
      id: summary.id,
      name: summary.name,
      description: summary.description,
      classroomName: classroomNameById.get(challenge.classroom_id) || 'Class',
      goalType: summary.goalType,
      goalTarget: summary.goalTarget,
      progress: summary.progress,
      percentComplete: summary.percentComplete,
      myContribution: byChild.get(childId) || 0,
      status: summary.status,
      endDate: summary.endDate,
      daysRemaining: summary.daysRemaining,
      rewardType: summary.rewardType,
      rewardAmount: summary.rewardAmount,
    });
  }
  return results;
}

export type CreateChallengeInput = {
  classroomId: string;
  name: string;
  description: string | null;
  goalType: ChallengeGoalType;
  goalTarget: number;
  startDate: string;
  endDate: string;
  rewardType: 'xp' | 'none';
  rewardAmount: number;
};

export async function createChallenge(admin: SupabaseClient, teacherId: string, input: CreateChallengeInput): Promise<{ id: string } | { error: string }> {
  const { data: classroom } = await admin.from('classrooms').select('id').eq('id', input.classroomId).eq('teacher_id', teacherId).maybeSingle();
  if (!classroom) return { error: 'Class not found.' };

  const { data, error } = await admin
    .from('class_challenges')
    .insert({
      teacher_id: teacherId,
      classroom_id: input.classroomId,
      name: input.name,
      description: input.description,
      goal_type: input.goalType,
      goal_target: input.goalTarget,
      start_date: input.startDate,
      end_date: input.endDate,
      reward_type: input.rewardType,
      reward_amount: input.rewardType === 'xp' ? input.rewardAmount : 0,
    })
    .select('id')
    .single();

  if (error || !data) return { error: 'Could not create this challenge.' };
  return { id: data.id };
}

export async function cancelChallenge(admin: SupabaseClient, teacherId: string, challengeId: string): Promise<boolean> {
  const { error } = await admin.from('class_challenges').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', challengeId).eq('teacher_id', teacherId).eq('status', 'active');
  return !error;
}
