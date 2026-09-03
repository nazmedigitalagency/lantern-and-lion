import type { SupabaseClient } from '@supabase/supabase-js';
import { computeStudentTrend } from '../insights/server';
import { resolveTeacherScope } from '../insights/aggregate';
import { isAutoScoredType, type AssignmentType, type SubmissionStatus } from '../assignments/types';
import type { ClassGradebookResponse, GradebookCell, GradebookQueueItem, GradebookStudentRow } from './types';

const COMPLETED_STATUSES: SubmissionStatus[] = ['submitted', 'graded', 'returned'];

export function isCompleted(status: SubmissionStatus): boolean {
  return COMPLETED_STATUSES.includes(status);
}

export function isOverdue(dueDate: string | null, status: SubmissionStatus): boolean {
  if (!dueDate || status === 'graded' || status === 'returned') return false;
  return new Date(`${dueDate}T00:00:00`).getTime() < Date.now();
}

type AssignmentRow = { id: string; title: string; assignment_type: AssignmentType; due_date: string | null; classroom_id: string | null };
type SubmissionRow = { assignment_id: string; child_id: string; status: SubmissionStatus; score: number | null; submitted_at: string | null; graded_at: string | null; feedback: string | null; response_text: string | null; score_overridden: boolean };

/**
 * The spreadsheet-like Class Gradebook: every live assignment in this
 * classroom as a column, every approved student as a row. Reuses the exact
 * same `assignments`/`assignment_submissions` rows the Assignment Center and
 * Insights already read — no parallel grading data model.
 */
export async function computeClassGradebook(admin: SupabaseClient, teacherId: string, classroomId: string): Promise<ClassGradebookResponse | null> {
  const scope = await resolveTeacherScope(admin, teacherId, classroomId);
  if (!scope) return null;
  const classroom = scope.allClassrooms.find((c) => c.id === classroomId);
  if (!classroom) return null;

  const { data: assignmentRows } = await admin
    .from('assignments')
    .select('id, title, assignment_type, due_date, classroom_id')
    .eq('teacher_id', teacherId)
    .eq('classroom_id', classroomId)
    .eq('status', 'assigned')
    .order('created_at', { ascending: true });
  const assignments = (assignmentRows || []) as AssignmentRow[];
  const assignmentIds = assignments.map((a) => a.id);
  const dueDateById = new Map(assignments.map((a) => [a.id, a.due_date]));

  let submissions: SubmissionRow[] = [];
  if (assignmentIds.length > 0) {
    const { data: subRows } = await admin
      .from('assignment_submissions')
      .select('assignment_id, child_id, status, score, submitted_at, graded_at, feedback, response_text, score_overridden')
      .in('assignment_id', assignmentIds);
    const childIds = new Set(scope.children.map((c) => c.id));
    submissions = (subRows || []).filter((s) => childIds.has(s.child_id)) as SubmissionRow[];
  }

  const byChild = new Map<string, SubmissionRow[]>();
  for (const s of submissions) {
    const list = byChild.get(s.child_id) || [];
    list.push(s);
    byChild.set(s.child_id, list);
  }

  const students: GradebookStudentRow[] = scope.children
    .map((child) => {
      const rows = byChild.get(child.id) || [];
      const cells: Record<string, GradebookCell> = {};
      for (const s of rows) {
        cells[s.assignment_id] = {
          status: s.status,
          score: s.score,
          submittedAt: s.submitted_at,
          gradedAt: s.graded_at,
          feedback: s.feedback,
          responseText: s.response_text,
          scoreOverridden: s.score_overridden,
          overdue: isOverdue(dueDateById.get(s.assignment_id) || null, s.status),
        };
      }
      const scored = rows.filter((s) => s.score !== null);
      const average = scored.length ? Math.round(scored.reduce((sum, s) => sum + (s.score || 0), 0) / scored.length) : null;
      const completed = rows.filter((s) => isCompleted(s.status)).length;
      const pending = assignments.length - completed;
      const overdueCount = rows.filter((s) => isOverdue(dueDateById.get(s.assignment_id) || null, s.status)).length;

      const scoredChronological = rows
        .filter((s) => s.score !== null && (s.graded_at || s.submitted_at))
        .sort((a, b) => new Date(a.graded_at || a.submitted_at || 0).getTime() - new Date(b.graded_at || b.submitted_at || 0).getTime())
        .map((s) => s.score as number);
      const trendResult = computeStudentTrend(child.name, scoredChronological, []);

      return {
        studentId: child.id,
        name: child.name,
        cells,
        average,
        completed,
        pending,
        overdue: overdueCount,
        trend: trendResult.trend,
        trendDetail: trendResult.detail,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const allScored = submissions.filter((s) => s.score !== null);
  const avgScore = allScored.length ? Math.round(allScored.reduce((sum, s) => sum + (s.score || 0), 0) / allScored.length) : null;
  const completionRate = submissions.length ? Math.round((submissions.filter((s) => isCompleted(s.status)).length / submissions.length) * 100) : null;
  const awaitingGrading = submissions.filter((s) => s.status === 'submitted').length;
  const overdueCount = submissions.filter((s) => isOverdue(dueDateById.get(s.assignment_id) || null, s.status)).length;

  const improving = students.filter((s) => s.trend === 'improving' && s.trendDetail);
  const mostImproved = improving.length ? { studentId: improving[0].studentId, name: improving[0].name, detail: improving[0].trendDetail as string } : null;

  return {
    classroom: { id: classroom.id, name: classroom.name },
    assignments: assignments.map((a) => ({ id: a.id, title: a.title, assignmentType: a.assignment_type, dueDate: a.due_date })),
    students,
    classSummary: { avgScore, completionRate, awaitingGrading, overdueCount, mostImproved },
  };
}

/**
 * The flat, filterable Gradebook queue (Class / Student / Assignment /
 * Status / Score / Submitted / Graded / Feedback) — across every classroom
 * this teacher owns, or one if `classroomId` is given. This is the surface
 * bulk actions and the ungraded/submitted/overdue filters operate on.
 */
export async function computeGradingQueue(admin: SupabaseClient, teacherId: string, classroomId?: string | null): Promise<GradebookQueueItem[] | null> {
  const scope = await resolveTeacherScope(admin, teacherId, classroomId);
  if (!scope) return null;
  const childIds = new Set(scope.children.map((c) => c.id));
  const nameByChild = new Map(scope.children.map((c) => [c.id, c.name]));
  if (childIds.size === 0) return [];

  let assignmentQuery = admin.from('assignments').select('id, title, assignment_type, due_date, classroom_id').eq('teacher_id', teacherId).eq('status', 'assigned');
  if (classroomId) assignmentQuery = assignmentQuery.eq('classroom_id', classroomId);
  const { data: assignmentRows } = await assignmentQuery;
  const assignments = (assignmentRows || []) as AssignmentRow[];
  const assignmentIds = assignments.map((a) => a.id);
  if (assignmentIds.length === 0) return [];
  const assignmentById = new Map(assignments.map((a) => [a.id, a]));

  const classroomNameById = new Map(scope.allClassrooms.map((c) => [c.id, c.name]));

  const { data: subRows } = await admin
    .from('assignment_submissions')
    .select('assignment_id, child_id, status, score, submitted_at, graded_at, feedback, response_text, score_overridden')
    .in('assignment_id', assignmentIds);

  const items: GradebookQueueItem[] = (subRows || [])
    .filter((s) => childIds.has(s.child_id))
    .map((s) => {
      const a = assignmentById.get(s.assignment_id)!;
      return {
        assignmentId: a.id,
        assignmentTitle: a.title,
        assignmentType: a.assignment_type,
        isAutoScored: isAutoScoredType(a.assignment_type),
        childId: s.child_id,
        studentName: nameByChild.get(s.child_id) || 'Student',
        classroomName: a.classroom_id ? classroomNameById.get(a.classroom_id) || 'Class' : null,
        status: s.status,
        score: s.score,
        submittedAt: s.submitted_at,
        gradedAt: s.graded_at,
        dueDate: a.due_date,
        overdue: isOverdue(a.due_date, s.status),
        responseText: s.response_text,
        feedback: s.feedback,
        scoreOverridden: s.score_overridden,
      };
    })
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

  return items;
}
