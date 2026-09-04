import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { referenceLabel } from '../../../lib/assignments/content';
import { syncAssignmentSubmissions } from '../../../lib/assignments/server';
import {
  computeParentAssignmentStatus,
  type AssignmentType,
  type ParentAssignmentItem,
  type ParentChildAssignmentsPayload,
  type ParentTimelineEvent,
  type ParentWeeklyProgress,
  type SubmissionStatus,
} from '../../../lib/assignments/types';

type RawSubmissionJoin = {
  id: string;
  child_id: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  response_text: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  created_at: string;
  assignments: {
    id: string;
    title: string;
    instructions: string | null;
    assignment_type: AssignmentType;
    reference_id: string | null;
    due_date: string | null;
    required_score: number | null;
    xp_reward: number | null;
    status: 'draft' | 'assigned';
    assigned_at: string | null;
    created_at: string;
    classrooms: {
      id: string;
      name: string;
      teacher_id: string;
    } | null;
  } | null;
};

/**
 * FEATURE 12 — PARENT ASSIGNMENT & LEARNING PROGRESS VISIBILITY
 *
 * Connects the Parent Dashboard to the single teacher assignment record:
 * Teacher → Student → Parent.
 *
 * Strictly scoped to this parent's authenticated family.
 * Never exposes other children, private teacher notes, private journals, or peer chat.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetChildId = searchParams.get('childId');

  const admin = createServerAdminClient();

  // Find parent's family
  const { data: family } = await admin
    .from('families')
    .select('id, timezone')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!family) {
    return NextResponse.json({ children: [], overallWeekly: emptyWeeklyProgress() });
  }

  // Find all children belonging to this family
  let childrenQuery = admin
    .from('children')
    .select('id, name')
    .eq('family_id', family.id);

  if (targetChildId) {
    childrenQuery = childrenQuery.eq('id', targetChildId);
  }

  const { data: childrenRows } = await childrenQuery;
  const children = childrenRows || [];
  if (children.length === 0) {
    return NextResponse.json({ children: [], overallWeekly: emptyWeeklyProgress() });
  }

  const childIds = children.map((c) => c.id);

  // Load submissions joined with assignment and classroom metadata
  const { data: rawSubmissionsData } = await admin
    .from('assignment_submissions')
    .select(`
      id,
      child_id,
      status,
      score,
      feedback,
      response_text,
      submitted_at,
      graded_at,
      created_at,
      assignments (
        id,
        title,
        instructions,
        assignment_type,
        reference_id,
        due_date,
        required_score,
        xp_reward,
        status,
        assigned_at,
        created_at,
        classrooms (
          id,
          name,
          teacher_id
        )
      )
    `)
    .in('child_id', childIds);

  const rawSubmissions = ((rawSubmissionsData || []) as unknown as RawSubmissionJoin[])
    .filter((s) => s.assignments && s.assignments.status === 'assigned');

  // Synchronize auto-scored types against real completion data
  const byAssignment = new Map<string, { assignment: RawSubmissionJoin['assignments']; rows: RawSubmissionJoin[] }>();
  for (const s of rawSubmissions) {
    if (!s.assignments) continue;
    const bucket = byAssignment.get(s.assignments.id) || { assignment: s.assignments, rows: [] };
    bucket.rows.push(s);
    byAssignment.set(s.assignments.id, bucket);
  }

  for (const { assignment, rows: group } of byAssignment.values()) {
    if (!assignment) continue;
    const subRows = group.map((g) => ({
      id: g.id,
      child_id: g.child_id,
      status: g.status,
      score: g.score,
      xp_awarded: false,
    }));
    await syncAssignmentSubmissions(admin, assignment as never, subRows).catch(() => {});
  }

  // Resolve teacher names
  const teacherIds = new Set<string>();
  for (const s of rawSubmissions) {
    const tId = s.assignments?.classrooms?.teacher_id;
    if (tId) teacherIds.add(tId);
  }

  const teacherNames = new Map<string, string>();
  for (const tId of teacherIds) {
    try {
      const { data: teacherUser } = await admin.auth.admin.getUserById(tId);
      const name = (teacherUser?.user?.user_metadata?.name || teacherUser?.user?.user_metadata?.full_name || 'Teacher') as string;
      teacherNames.set(tId, name);
    } catch {
      teacherNames.set(tId, 'Teacher');
    }
  }

  // Query actual learning activity sessions over the past 7 days (do not invent metrics)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoDateKey = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: activityRows } = await admin
    .from('daily_activity_summary')
    .select('child_id, session_count, active_seconds')
    .in('child_id', childIds)
    .gte('activity_date', sevenDaysAgoDateKey);

  const sessionsByChild = new Map<string, number>();
  for (const act of activityRows || []) {
    const current = sessionsByChild.get(act.child_id) || 0;
    sessionsByChild.set(act.child_id, current + (act.session_count || 0));
  }

  // Build per-child payload
  const childPayloads: ParentChildAssignmentsPayload[] = children.map((child) => {
    const childSubs = rawSubmissions.filter((s) => s.child_id === child.id && s.assignments);

    const items: ParentAssignmentItem[] = childSubs.map((s) => {
      const a = s.assignments!;
      const teacherId = a.classrooms?.teacher_id;
      const teacherName = teacherId ? teacherNames.get(teacherId) || 'Teacher' : null;

      return {
        id: s.id,
        assignmentId: a.id,
        childId: child.id,
        childName: child.name,
        title: a.title,
        instructions: a.instructions,
        assignmentType: a.assignment_type,
        referenceLabel: referenceLabel(a.assignment_type, a.reference_id),
        classroomName: a.classrooms?.name || null,
        teacherName,
        dueDate: a.due_date,
        status: computeParentAssignmentStatus(s.status, a.due_date),
        rawStatus: s.status,
        score: s.score,
        requiredScore: a.required_score,
        feedback: s.feedback,
        xpReward: a.xp_reward,
        submittedAt: s.submitted_at,
        gradedAt: s.graded_at,
        assignedAt: a.assigned_at || a.created_at,
      };
    });

    // Sort items by priority: overdue first, then in_progress, assigned, submitted, graded
    items.sort((a, b) => {
      const rank = (status: ParentAssignmentItem['status']) => {
        if (status === 'overdue') return 0;
        if (status === 'in_progress') return 1;
        if (status === 'assigned') return 2;
        if (status === 'submitted') return 3;
        if (status === 'graded') return 4;
        return 5;
      };
      return rank(a.status) - rank(b.status);
    });

    // "This Week" Progress Summary
    const totalCount = items.length;
    const completedCount = items.filter((i) => i.status === 'graded' || i.status === 'submitted' || i.rawStatus === 'returned').length;
    const scoredItems = items.filter((i) => i.score !== null && typeof i.score === 'number');
    const averageScore = scoredItems.length > 0
      ? Math.round(scoredItems.reduce((acc, curr) => acc + (curr.score || 0), 0) / scoredItems.length)
      : null;
    const sessionCount = sessionsByChild.get(child.id) || 0;

    const weeklyProgress: ParentWeeklyProgress = {
      completedCount,
      totalCount,
      completedFraction: totalCount > 0 ? `${completedCount}/${totalCount} completed` : '0/0 completed',
      averageScore,
      sessionCount,
      sessionLabel: `${sessionCount} session${sessionCount === 1 ? '' : 's'}`,
    };

    // Milestone Timeline (Meaningful milestone events only — no noisy interaction tracking)
    const timeline: ParentTimelineEvent[] = [];

    for (const item of items) {
      // 1. Teacher assigned milestone
      if (item.assignedAt) {
        timeline.push({
          id: `assign_${item.id}`,
          childId: child.id,
          childName: child.name,
          eventType: 'assigned',
          title: 'Assignment assigned',
          description: item.teacherName
            ? `${item.teacherName} assigned “${item.title}”.`
            : `Teacher assigned “${item.title}”.`,
          timestamp: item.assignedAt,
          assignmentId: item.assignmentId,
        });
      }

      // 2. Child completed milestone
      if (item.submittedAt) {
        timeline.push({
          id: `comp_${item.id}`,
          childId: child.id,
          childName: child.name,
          eventType: 'completed',
          title: 'Assignment completed',
          description: `${child.name} completed “${item.title}”.`,
          timestamp: item.submittedAt,
          assignmentId: item.assignmentId,
        });
      }

      // 3. Teacher graded milestone
      if (item.gradedAt && item.score !== null) {
        timeline.push({
          id: `grade_${item.id}`,
          childId: child.id,
          childName: child.name,
          eventType: 'graded',
          title: 'Assignment graded',
          description: `Teacher graded “${item.title}” — ${item.score}%.`,
          timestamp: item.gradedAt,
          score: item.score,
          assignmentId: item.assignmentId,
        });
      }

      // 4. Teacher feedback milestone
      if (item.feedback && item.feedback.trim()) {
        timeline.push({
          id: `feed_${item.id}`,
          childId: child.id,
          childName: child.name,
          eventType: 'feedback',
          title: 'Teacher feedback',
          description: `Teacher left feedback on “${item.title}”: “${item.feedback.trim()}”`,
          timestamp: item.gradedAt || item.submittedAt || item.assignedAt || new Date().toISOString(),
          feedback: item.feedback.trim(),
          assignmentId: item.assignmentId,
        });
      }
    }

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      childId: child.id,
      childName: child.name,
      weeklyProgress,
      assignments: items,
      timeline,
    };
  });

  // Calculate overall family weekly summary
  const allItems = childPayloads.flatMap((c) => c.assignments);
  const overallTotal = allItems.length;
  const overallCompleted = allItems.filter((i) => i.status === 'graded' || i.status === 'submitted' || i.rawStatus === 'returned').length;
  const allScored = allItems.filter((i) => i.score !== null && typeof i.score === 'number');
  const overallAvg = allScored.length > 0
    ? Math.round(allScored.reduce((acc, curr) => acc + (curr.score || 0), 0) / allScored.length)
    : null;
  let totalSessions = 0;
  for (const count of sessionsByChild.values()) totalSessions += count;

  const overallWeekly: ParentWeeklyProgress = {
    completedCount: overallCompleted,
    totalCount: overallTotal,
    completedFraction: overallTotal > 0 ? `${overallCompleted}/${overallTotal} completed` : '0/0 completed',
    averageScore: overallAvg,
    sessionCount: totalSessions,
    sessionLabel: `${totalSessions} session${totalSessions === 1 ? '' : 's'}`,
  };

  return NextResponse.json({
    children: childPayloads,
    overallWeekly,
  });
}

function emptyWeeklyProgress(): ParentWeeklyProgress {
  return {
    completedCount: 0,
    totalCount: 0,
    completedFraction: '0/0 completed',
    averageScore: null,
    sessionCount: 0,
    sessionLabel: '0 sessions',
  };
}
