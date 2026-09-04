import type { SupabaseClient } from '@supabase/supabase-js';
import { computeStudentCards, type ChildRow } from '../classrooms/roster';
import type { StudentCard } from '../classrooms/types';
import type { CurriculumModule } from '../../curriculum-data';
import type { ConceptMasteryRow } from '../adaptive/server';
import type { AssignmentType } from '../assignments/types';
import { ATTENTION_THRESHOLDS, comparePriorityDesc } from '../attention/config';
import {
  buildAttentionEntry,
  buildClassInsightCards,
  buildImprovingEntry,
  computeAssignmentCompletion,
  computeAssignmentTypeMetrics,
  computeBibleKnowledgeMetric,
  computeConsistencyMetric,
  computeStudentRecommendation,
  computeStudentTrend,
  computeTopicInsights,
  type AssignmentRow,
  type SubmissionRow,
  type TopicMasteryInput,
} from './server';
import type { AttentionEntry, ClassInsightsResponse, ClassMetric, ImprovingEntry, StudentInsightsResponse } from './types';

type RosterRow = { classroom_id: string; child_id: string; approved: boolean; needs_help: boolean; children: ChildRow | null };

const MASTERY_COLUMNS = 'child_id, concept_id, mastery_score, status, correct_count, incorrect_count, consecutive_correct, consecutive_incorrect, review_interval_days, last_practiced_at, next_review_at';

/** Every approved student across this teacher's classrooms (or one, if `classroomId` is given) — the same shape /api/teacher/students builds its roster from. Exported for reuse by the class-activity aggregation (Feature 7), which needs the identical authorized roster. */
export async function resolveTeacherScope(admin: SupabaseClient, teacherId: string, classroomId?: string | null) {
  const { data: classroomRows } = await admin.from('classrooms').select('id, name').eq('teacher_id', teacherId);
  const allClassrooms = classroomRows || [];
  if (classroomId && !allClassrooms.some((c) => c.id === classroomId)) return null;

  const classroomIds = classroomId ? [classroomId] : allClassrooms.map((c) => c.id);
  if (classroomIds.length === 0) return { allClassrooms, children: [] as ChildRow[], needsHelpByChild: new Map<string, boolean>() };

  const { data: rosterRaw } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id, approved, needs_help, children(id, name, age, family_id, last_login_at)')
    .in('classroom_id', classroomIds)
    .eq('approved', true);

  const roster = ((rosterRaw || []) as unknown as RosterRow[]).filter((r) => r.children);
  const byChild = new Map<string, ChildRow>();
  const needsHelpByChild = new Map<string, boolean>();
  for (const r of roster) {
    byChild.set(r.child_id, r.children as ChildRow);
    needsHelpByChild.set(r.child_id, needsHelpByChild.get(r.child_id) || r.needs_help);
  }

  return { allClassrooms, children: Array.from(byChild.values()), needsHelpByChild };
}

function trackForAge(age: number): CurriculumModule['track'] {
  if (age >= 13) return 'teen';
  if (age <= 7) return 'early';
  return 'pathfinder';
}

/**
 * The single entry point for the teacher Insights page: resolves the
 * roster, pulls assignments/submissions/concept-mastery once, and hands
 * everything to the pure functions in ./server for scoring. One request,
 * three batched queries regardless of class size — no per-student
 * round-trips, no polling.
 */
export async function computeClassInsights(admin: SupabaseClient, teacherId: string, classroomId?: string | null): Promise<ClassInsightsResponse | null> {
  const scope = await resolveTeacherScope(admin, teacherId, classroomId);
  if (!scope) return null;
  const { allClassrooms, children, needsHelpByChild } = scope;
  const childIds = children.map((c) => c.id);

  if (childIds.length === 0) {
    return {
      classrooms: allClassrooms,
      scope: { classroomId: classroomId || null, studentCount: 0 },
      overview: [],
      strengths: [],
      areasToPractice: [],
      topics: { strong: [], needsPractice: [], mostPracticed: [], recentlyImproved: [] },
      needsAttention: [],
      improving: [],
    };
  }

  const cardsByChild = await computeStudentCards(admin, children, needsHelpByChild);
  const cards: StudentCard[] = children.map((c) => ({ ...cardsByChild.get(c.id)!, classrooms: [] }));

  let assignmentQuery = admin.from('assignments').select('id, assignment_type, due_date, status').eq('teacher_id', teacherId).eq('status', 'assigned');
  if (classroomId) assignmentQuery = assignmentQuery.eq('classroom_id', classroomId);
  const { data: assignmentRowsRaw } = await assignmentQuery;
  const assignments: AssignmentRow[] = (assignmentRowsRaw || []).map((a) => ({ id: a.id, assignmentType: a.assignment_type as AssignmentType, dueDate: a.due_date, status: a.status as 'assigned' }));
  const assignmentIds = assignments.map((a) => a.id);

  let submissions: SubmissionRow[] = [];
  if (assignmentIds.length > 0) {
    const { data: subRows } = await admin
      .from('assignment_submissions')
      .select('assignment_id, child_id, status, score, submitted_at, graded_at')
      .in('assignment_id', assignmentIds);
    submissions = (subRows || [])
      .filter((s) => childIds.includes(s.child_id))
      .map((s) => ({ assignmentId: s.assignment_id, childId: s.child_id, status: s.status, score: s.score, submittedAt: s.submitted_at, gradedAt: s.graded_at }));
  }

  const { data: masteryRaw } = await admin.from('concept_mastery').select(MASTERY_COLUMNS).in('child_id', childIds);
  const masteryRows = (masteryRaw || []) as unknown as ConceptMasteryRow[];
  const masteryByChild = new Map<string, ConceptMasteryRow[]>();
  for (const row of masteryRows) {
    const list = masteryByChild.get(row.child_id) || [];
    list.push(row);
    masteryByChild.set(row.child_id, list);
  }

  const overview: ClassMetric[] = [
    computeAssignmentCompletion(submissions),
    computeBibleKnowledgeMetric(cards),
    computeConsistencyMetric(cards),
    ...computeAssignmentTypeMetrics(assignments, submissions),
  ].filter((m): m is ClassMetric => m !== null);

  const topicInput: TopicMasteryInput[] = masteryRows.map((r) => ({
    childId: r.child_id,
    conceptId: r.concept_id,
    masteryScore: r.mastery_score,
    correctCount: r.correct_count,
    incorrectCount: r.incorrect_count,
    consecutiveCorrect: r.consecutive_correct,
    lastPracticedAt: r.last_practiced_at,
  }));
  const topics = computeTopicInsights(topicInput);
  const weakestTopic = topics.needsPractice[0] || null;

  const { strengths, areasToPractice } = buildClassInsightCards(overview, weakestTopic);

  const submissionsByChild = new Map<string, SubmissionRow[]>();
  for (const s of submissions) {
    const list = submissionsByChild.get(s.childId) || [];
    list.push(s);
    submissionsByChild.set(s.childId, list);
  }
  const overdueByChild = new Map<string, number>();
  const now = Date.now();
  for (const a of assignments) {
    if (!a.dueDate || new Date(`${a.dueDate}T00:00:00`).getTime() >= now) continue;
    for (const s of submissions) {
      if (s.assignmentId !== a.id) continue;
      if (s.status === 'assigned' || s.status === 'in_progress') {
        overdueByChild.set(s.childId, (overdueByChild.get(s.childId) || 0) + 1);
      }
    }
  }

  const needsAttention: AttentionEntry[] = [];
  const improving: ImprovingEntry[] = [];
  for (const card of cards) {
    const childSubs = (submissionsByChild.get(card.id) || [])
      .filter((s) => (s.status === 'graded' || s.status === 'returned') && s.score !== null)
      .sort((a, b) => new Date(a.gradedAt || a.submittedAt || 0).getTime() - new Date(b.gradedAt || b.submittedAt || 0).getTime())
      .map((s) => s.score as number);
    const childMastery = masteryByChild.get(card.id) || [];
    const trend = computeStudentTrend(card.name, childSubs, childMastery);
    const attention = buildAttentionEntry(card, overdueByChild.get(card.id) || 0, trend);
    if (attention) needsAttention.push(attention);
    const progressEntry = buildImprovingEntry(card, trend);
    if (progressEntry) improving.push(progressEntry);
  }

  return {
    classrooms: allClassrooms,
    scope: { classroomId: classroomId || null, studentCount: cards.length },
    overview,
    strengths,
    areasToPractice,
    topics,
    needsAttention: needsAttention.sort((a, b) => comparePriorityDesc(a.priority, b.priority)).slice(0, ATTENTION_THRESHOLDS.MAX_ATTENTION_ENTRIES),
    improving: improving.slice(0, 8),
  };
}

/**
 * Extends the teacher's existing per-student detail view with trend + a
 * "what should I do next?" recommendation — same masteryRows the route
 * already fetches for `learning.strengths`/`needsPractice`, plus this
 * student's own assignment submission history for the trend calculation.
 */
export async function computeStudentInsightsPayload(
  admin: SupabaseClient,
  childId: string,
  name: string,
  age: number,
  masteryRows: ConceptMasteryRow[],
  card: StudentCard,
  strengths: { conceptId: string; label: string; masteryScore: number }[],
  needsPractice: { conceptId: string; label: string; masteryScore: number }[]
): Promise<StudentInsightsResponse> {
  const { data: subRows } = await admin
    .from('assignment_submissions')
    .select('score, submitted_at, graded_at')
    .eq('child_id', childId)
    .in('status', ['graded', 'returned']);

  const scoredChronological = (subRows || [])
    .filter((s) => s.score !== null)
    .sort((a, b) => new Date(a.graded_at || a.submitted_at || 0).getTime() - new Date(b.graded_at || b.submitted_at || 0).getTime())
    .map((s) => s.score as number);

  const trend = computeStudentTrend(name, scoredChronological, masteryRows);
  const track = trackForAge(age);
  const recommendation = computeStudentRecommendation(name, card, masteryRows, track, strengths);

  return { strengths, needsPractice, trend, recommendation };
}
