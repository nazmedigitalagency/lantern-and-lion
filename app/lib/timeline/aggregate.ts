import type { SupabaseClient } from '@supabase/supabase-js';
import { activityDateKey } from '../activity/server';
import { getConcept } from '../adaptive/concepts';
import type { ConceptMasteryRow } from '../adaptive/server';
import { computeStudentRecommendation } from '../insights/server';
import { getStory } from '../../stories/catalog';
import type { StudentCard } from '../classrooms/types';
import type { CurriculumModule } from '../../curriculum-data';
import type { AssignmentType } from '../assignments/types';
import {
  bucketAssignmentsByDueDate,
  buildDailySummary,
  buildTimelineEvents,
  computeProgressTrends,
  resolveRangeBounds,
  type DailyRowInput,
  type SubmissionTimelineInput,
} from './server';
import { resolveTeacherScope } from '../insights/aggregate';
import type { ClassActivityAssignmentRow, ClassActivityResponse, StudentTimelineResponse, TimelineAction, TimelineRange } from './types';

/**
 * Builds the full per-student Activity & Progress Timeline: a real,
 * chronological feed plus a range summary and fixed-lookback trends — all
 * sourced from tables Features 1-6 already populate (daily_activity_summary,
 * story_progress, assignment_submissions, concept_mastery, activity_events,
 * streak_state). No new tracking table, no fabricated history.
 */
export async function computeStudentTimeline(
  admin: SupabaseClient,
  childId: string,
  name: string,
  tz: string,
  track: CurriculumModule['track'],
  card: StudentCard,
  masteryRows: ConceptMasteryRow[],
  strengths: { label: string }[],
  currentStreak: number,
  range: TimelineRange,
  customStart?: string | null,
  customEnd?: string | null
): Promise<StudentTimelineResponse> {
  const { startKey, endKey } = resolveRangeBounds(range, tz, customStart, customEnd);

  const [dailyRes, storyRes, eventRes, subRes] = await Promise.all([
    admin
      .from('daily_activity_summary')
      .select('activity_date, games_completed, lessons_completed, quests_completed, session_count, xp_earned')
      .eq('child_id', childId)
      .order('activity_date', { ascending: false })
      .limit(120),
    admin.from('story_progress').select('story_id, completed_at').eq('child_id', childId).eq('status', 'completed'),
    admin
      .from('activity_events')
      .select('event_type, occurred_at, metadata')
      .eq('child_id', childId)
      .in('event_type', ['ACHIEVEMENT_EARNED', 'STREAK_EXTENDED'])
      .order('occurred_at', { ascending: false })
      .limit(60),
    admin.from('assignment_submissions').select('id, assignment_id, status, score, submitted_at, graded_at').eq('child_id', childId),
  ]);

  const dailyRows: DailyRowInput[] = (dailyRes.data || []).map((r) => ({
    activityDate: r.activity_date,
    gamesCompleted: r.games_completed || 0,
    lessonsCompleted: r.lessons_completed || 0,
    questsCompleted: r.quests_completed || 0,
    sessionCount: r.session_count || 0,
    xpEarned: r.xp_earned || 0,
  }));

  const submissionRows = subRes.data || [];
  const assignmentIds = Array.from(new Set(submissionRows.map((s) => s.assignment_id)));
  let assignmentMeta = new Map<string, { title: string; assignmentType: AssignmentType; dueDate: string | null }>();
  if (assignmentIds.length > 0) {
    const { data: assignmentRows } = await admin.from('assignments').select('id, title, assignment_type, due_date').in('id', assignmentIds);
    assignmentMeta = new Map((assignmentRows || []).map((a) => [a.id, { title: a.title, assignmentType: a.assignment_type as AssignmentType, dueDate: a.due_date as string | null }]));
  }

  const submissions: SubmissionTimelineInput[] = submissionRows
    .map((s) => {
      const meta = assignmentMeta.get(s.assignment_id);
      if (!meta) return null;
      return {
        id: s.id,
        title: meta.title,
        assignmentType: meta.assignmentType,
        status: s.status as SubmissionTimelineInput['status'],
        score: s.score,
        submittedAt: s.submitted_at,
        gradedAt: s.graded_at,
      };
    })
    .filter((s): s is SubmissionTimelineInput => s !== null);

  const stories = (storyRes.data || []).filter((s) => s.completed_at).map((s) => ({ storyId: s.story_id, title: getStory(s.story_id)?.title || s.story_id, completedAt: s.completed_at as string }));
  const events = (eventRes.data || []).map((e) => ({ eventType: e.event_type as 'ACHIEVEMENT_EARNED' | 'STREAK_EXTENDED', occurredAt: e.occurred_at, metadata: (e.metadata || {}) as { streakDay?: number } }));
  const conceptPractice = masteryRows.map((m) => ({ conceptId: m.concept_id, label: getConcept(m.concept_id)?.label || m.concept_id, lastPracticedAt: m.last_practiced_at }));

  const timeline = buildTimelineEvents(tz, { stories, submissions, conceptPractice, events, dailyRows }, startKey, endKey);
  const storiesInRangeCount = timeline.filter((t) => t.kind === 'story').length;

  const completedStatus = (status: SubmissionTimelineInput['status']) => status === 'submitted' || status === 'graded' || status === 'returned';
  const assignmentsInRange = submissions
    .filter((s) => {
      const meta = assignmentMeta.get(s.id) || null;
      const anchor = s.gradedAt || s.submittedAt || meta?.dueDate;
      const dayKey = anchor ? activityDateKey(tz, new Date(anchor)) : null;
      return dayKey ? dayKey >= startKey && dayKey <= endKey : false;
    })
    .map((s) => ({ completed: completedStatus(s.status) }));

  const quizScoresInRange = submissions
    .filter((s) => s.assignmentType === 'quiz' && s.score !== null && s.gradedAt && activityDateKey(tz, new Date(s.gradedAt)) >= startKey && activityDateKey(tz, new Date(s.gradedAt)) <= endKey)
    .map((s) => s.score as number);

  const summary = buildDailySummary(startKey, endKey, dailyRows, storiesInRangeCount, assignmentsInRange, quizScoresInRange, currentStreak);

  const now = new Date();
  const quizSubs = submissions.filter((s) => s.assignmentType === 'quiz' && s.score !== null && (s.gradedAt || s.submittedAt)).map((s) => ({ score: s.score as number, at: (s.gradedAt || s.submittedAt) as string }));
  const memorySubs = submissions.filter((s) => s.assignmentType === 'memory' && s.score !== null && (s.gradedAt || s.submittedAt)).map((s) => ({ score: s.score as number, at: (s.gradedAt || s.submittedAt) as string }));
  const assignmentsByBucket = bucketAssignmentsByDueDate(
    tz,
    now,
    submissions.map((s) => ({ dueDate: assignmentMeta.get(s.id)?.dueDate || null, completed: completedStatus(s.status) }))
  );
  const trends = computeProgressTrends(tz, now, quizSubs, memorySubs, assignmentsByBucket, dailyRows, stories.map((s) => s.completedAt));

  const actions: TimelineAction[] = [];
  if (timeline.length === 0 || card.activityStatus === 'inactive') {
    actions.push({ id: 'inactive', reason: `${name} has not been active recently.`, label: 'Assign Activity', suggestedAssignment: null });
  }
  const recommendation = computeStudentRecommendation(name, card, masteryRows, track, strengths);
  if (recommendation?.suggestedAssignment) {
    actions.push({ id: 'recommendation', reason: recommendation.headline, label: 'Create Assignment', suggestedAssignment: recommendation.suggestedAssignment });
  }

  return { range, startDate: startKey, endDate: endKey, summary, timeline, trends, actions: actions.slice(0, 3) };
}

/**
 * Class-level activity: aggregate counts only ("N students completed…",
 * "M currently working on it") — never a per-student breakdown here, so a
 * teacher scanning the class view never sees more about one student than
 * the roster view already shows. Authorization is enforced the same way as
 * every other classroom read: `resolveTeacherScope` returns null unless the
 * classroom belongs to this teacher.
 */
export async function computeClassActivity(admin: SupabaseClient, teacherId: string, classroomId: string, range: TimelineRange, customStart?: string | null, customEnd?: string | null): Promise<ClassActivityResponse | null> {
  const scope = await resolveTeacherScope(admin, teacherId, classroomId);
  if (!scope) return null;
  const childIds = scope.children.map((c) => c.id);
  const tz = 'UTC';
  const { startKey, endKey } = resolveRangeBounds(range, tz, customStart, customEnd);

  if (childIds.length === 0) {
    return { range, startDate: startKey, endDate: endKey, summary: { studentsActiveCount: 0, studentCount: 0, storiesCompletedCount: 0 }, assignments: [], activity: [] };
  }

  const [storyRes, dailyRes, assignmentRes] = await Promise.all([
    admin.from('story_progress').select('story_id, child_id, completed_at').eq('status', 'completed').in('child_id', childIds),
    admin.from('daily_activity_summary').select('child_id, activity_date, games_completed, lessons_completed, quests_completed, xp_earned').in('child_id', childIds).gte('activity_date', startKey).lte('activity_date', endKey),
    admin.from('assignments').select('id, title').eq('classroom_id', classroomId).eq('status', 'assigned'),
  ]);

  const storiesInRange = (storyRes.data || []).filter((s) => s.completed_at && activityDateKey(tz, new Date(s.completed_at)) >= startKey && activityDateKey(tz, new Date(s.completed_at)) <= endKey);

  const activeChildIds = new Set(
    (dailyRes.data || []).filter((r) => (r.games_completed || 0) > 0 || (r.lessons_completed || 0) > 0 || (r.quests_completed || 0) > 0 || (r.xp_earned || 0) > 0).map((r) => r.child_id)
  );
  for (const s of storiesInRange) activeChildIds.add(s.child_id);

  const assignmentRows = assignmentRes.data || [];
  const assignmentIds = assignmentRows.map((a) => a.id);
  let submissionsByAssignment = new Map<string, { child_id: string; status: string }[]>();
  if (assignmentIds.length > 0) {
    const { data: subRows } = await admin.from('assignment_submissions').select('assignment_id, child_id, status').in('assignment_id', assignmentIds);
    submissionsByAssignment = new Map();
    for (const s of subRows || []) {
      if (!childIds.includes(s.child_id)) continue;
      const list = submissionsByAssignment.get(s.assignment_id) || [];
      list.push({ child_id: s.child_id, status: s.status });
      submissionsByAssignment.set(s.assignment_id, list);
    }
  }

  const assignments: ClassActivityAssignmentRow[] = assignmentRows.map((a) => {
    const subs = submissionsByAssignment.get(a.id) || [];
    const completedCount = subs.filter((s) => s.status === 'submitted' || s.status === 'graded' || s.status === 'returned').length;
    const inProgressCount = subs.filter((s) => s.status === 'in_progress').length;
    const notStartedCount = subs.filter((s) => s.status === 'assigned').length;
    return { assignmentId: a.id, title: a.title, studentCount: subs.length, completedCount, inProgressCount, notStartedCount };
  });

  const storyTitleCounts = new Map<string, { storyId: string; title: string; count: number; latest: string }>();
  for (const s of storiesInRange) {
    const existing = storyTitleCounts.get(s.story_id);
    const title = getStory(s.story_id)?.title || s.story_id;
    if (existing) {
      existing.count += 1;
      if (s.completed_at > existing.latest) existing.latest = s.completed_at;
    } else {
      storyTitleCounts.set(s.story_id, { storyId: s.story_id, title, count: 1, latest: s.completed_at });
    }
  }
  const activity = Array.from(storyTitleCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((s) => ({ id: `story:${s.storyId}`, occurredAt: s.latest, label: `${s.count} student${s.count === 1 ? '' : 's'} completed “${s.title}”.` }));

  return {
    range,
    startDate: startKey,
    endDate: endKey,
    summary: { studentsActiveCount: activeChildIds.size, studentCount: childIds.length, storiesCompletedCount: storiesInRange.length },
    assignments,
    activity,
  };
}
