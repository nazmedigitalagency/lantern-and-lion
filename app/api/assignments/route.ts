import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../lib/supabase/route-client';
import { createServerAdminClient } from '../../lib/supabase/server';
import { notifyChildOnce, notifyOnce } from '../../lib/activity/server';
import { assignmentBucket, resolveTargetChildIds, syncAssignmentSubmissions } from '../../lib/assignments/server';
import { referenceExists, referenceLabel } from '../../lib/assignments/content';
import type { AssignmentListItem, AssignmentType } from '../../lib/assignments/types';

type AssignmentRow = {
  id: string;
  title: string;
  assignment_type: AssignmentType;
  reference_id: string | null;
  classroom_id: string | null;
  status: 'draft' | 'assigned';
  due_date: string | null;
  required_score: number | null;
  xp_reward: number | null;
  created_at: string;
  assigned_at: string | null;
};

/**
 * Every assignment this teacher owns, across every classroom — the
 * Assignment Center's one list, bucketed client-side (Drafts/Active/Due
 * soon/Completed/Overdue) same as My Students' filter chips. Auto-scored
 * submissions are reconciled against real completion data on every read.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const classroomFilter = req.nextUrl.searchParams.get('classroomId');

  const admin = createServerAdminClient();
  let query = admin
    .from('assignments')
    .select('id, title, assignment_type, reference_id, classroom_id, status, due_date, required_score, xp_reward, created_at, assigned_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });
  if (classroomFilter) query = query.eq('classroom_id', classroomFilter);
  const { data: rows } = await query;

  const assignments = (rows || []) as AssignmentRow[];
  if (assignments.length === 0) return NextResponse.json({ assignments: [] });

  const classroomIds = Array.from(new Set(assignments.map((a) => a.classroom_id).filter((id): id is string => Boolean(id))));
  const { data: classrooms } = classroomIds.length
    ? await admin.from('classrooms').select('id, name').in('id', classroomIds)
    : { data: [] as { id: string; name: string }[] };
  const classroomName = (id: string | null) => (id ? classrooms?.find((c) => c.id === id)?.name || 'Class' : null);

  const items: AssignmentListItem[] = await Promise.all(assignments.map(async (a) => {
    const { data: submissionRows } = await admin
      .from('assignment_submissions')
      .select('id, child_id, status, score, xp_awarded')
      .eq('assignment_id', a.id);
    const submissions = submissionRows || [];

    if (a.status === 'assigned') {
      await syncAssignmentSubmissions(admin, a, submissions);
    }

    const completedCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'graded' || s.status === 'returned').length;
    const gradedRows = submissions.filter((s) => s.status === 'graded' || s.status === 'returned');
    const scored = submissions.filter((s) => s.score !== null);
    const avgScore = scored.length ? Math.round(scored.reduce((sum, s) => sum + (s.score || 0), 0) / scored.length) : null;

    return {
      id: a.id,
      title: a.title,
      assignmentType: a.assignment_type,
      referenceId: a.reference_id,
      referenceLabel: referenceLabel(a.assignment_type, a.reference_id),
      classroom: a.classroom_id ? { id: a.classroom_id, name: classroomName(a.classroom_id) || 'Class' } : null,
      studentCount: submissions.length,
      createdAt: a.created_at,
      dueDate: a.due_date,
      status: a.status,
      bucket: assignmentBucket(a.status, a.due_date, completedCount, submissions.length),
      completedCount,
      gradedCount: gradedRows.length,
      avgScore,
      requiredScore: a.required_score,
      xpReward: a.xp_reward,
    };
  }));

  return NextResponse.json({ assignments: items });
}

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  instructions: z.string().trim().max(2000).optional(),
  assignmentType: z.enum(['story', 'reading', 'quiz', 'memory', 'game', 'written', 'custom']),
  referenceId: z.string().trim().max(64).optional(),
  classroomId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).max(200).optional(),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timeLimitMinutes: z.number().int().min(1).max(600).optional(),
  requiredScore: z.number().int().min(0).max(100).optional(),
  xpReward: z.number().int().min(0).max(2000).optional(),
  publish: z.boolean().default(false),
});

/**
 * Creates an assignment as a draft, or publishes it immediately
 * (publish: true) — targeting an entire classroom's currently-approved
 * roster, a hand-picked list of students, or both. Every targeted child
 * must already be one this teacher is authorized to manage (approved into
 * one of their own classrooms) — never trusted from the request alone.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please fill in the required fields.' }, { status: 400 });
  const data = parsed.data;

  const needsReference = data.assignmentType !== 'written' && data.assignmentType !== 'custom';
  if (needsReference && (!data.referenceId || !referenceExists(data.assignmentType, data.referenceId))) {
    return NextResponse.json({ error: 'Please choose what to assign.' }, { status: 400 });
  }

  const admin = createServerAdminClient();

  // Verify classroom ownership.
  let classroomName: string | null = null;
  if (data.classroomId) {
    const { data: classroom } = await admin.from('classrooms').select('id, name').eq('id', data.classroomId).eq('teacher_id', user.id).maybeSingle();
    if (!classroom) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
    classroomName = classroom.name;
  }

  if (!data.classroomId && (!data.studentIds || data.studentIds.length === 0) && data.publish) {
    return NextResponse.json({ error: 'Choose a class or at least one student.' }, { status: 400 });
  }

  const { data: assignment, error } = await admin
    .from('assignments')
    .insert({
      teacher_id: user.id,
      title: data.title,
      instructions: data.instructions || null,
      assignment_type: data.assignmentType,
      reference_id: needsReference ? data.referenceId : null,
      classroom_id: data.classroomId || null,
      status: data.publish ? 'assigned' : 'draft',
      due_date: data.dueDate || null,
      time_limit_minutes: data.timeLimitMinutes || null,
      required_score: data.requiredScore ?? null,
      xp_reward: data.xpReward ?? null,
      assigned_at: data.publish ? new Date().toISOString() : null,
    })
    .select('id')
    .maybeSingle();

  if (error || !assignment) return NextResponse.json({ error: 'Could not create the assignment.' }, { status: 500 });

  if (data.publish) {
    const targetIds = await resolveTargetChildIds(admin, user.id, data.classroomId, data.studentIds);
    if (targetIds.length > 0) {
      await admin.from('assignment_submissions').upsert(
        targetIds.map((childId) => ({ assignment_id: assignment.id, child_id: childId })),
        { onConflict: 'assignment_id,child_id', ignoreDuplicates: true }
      );

      // Parents get a notification the existing way; children/teens now
      // also get one directly in their own notification center (child
      // sessions have no auth.users id, so this uses recipient_child_id —
      // see notifyChildOnce).
      const { data: childRows } = await admin.from('children').select('id, name, family_id').in('id', targetIds);
      const familyIds = Array.from(new Set((childRows || []).map((c) => c.family_id)));
      const { data: families } = familyIds.length ? await admin.from('families').select('id, owner_id').in('id', familyIds) : { data: [] as { id: string; owner_id: string }[] };
      for (const child of childRows || []) {
        const ownerId = families?.find((f) => f.id === child.family_id)?.owner_id;
        if (ownerId) {
          await notifyOnce(admin, {
            recipientId: ownerId,
            childId: child.id,
            type: 'ASSIGNMENT',
            title: 'New assignment',
            body: `${child.name} was assigned “${data.title}”${classroomName ? ` in ${classroomName}` : ''}${data.dueDate ? ` — due ${new Date(`${data.dueDate}T00:00:00`).toLocaleDateString()}` : ''}.`,
            payload: { assignmentId: assignment.id },
            dedupeKey: `assignment:${assignment.id}:${child.id}`,
          }).catch(() => {});
        }
        await notifyChildOnce(admin, {
          childId: child.id,
          type: 'ASSIGNMENT',
          title: `New assignment${classroomName ? ` from ${classroomName}` : ''}`,
          body: `“${data.title}” is ready for you${data.dueDate ? ` — due ${new Date(`${data.dueDate}T00:00:00`).toLocaleDateString()}` : ''}.`,
          payload: { assignmentId: assignment.id },
          dedupeKey: `assignment_child:${assignment.id}:${child.id}`,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ success: true, id: assignment.id, status: data.publish ? 'assigned' : 'draft' });
}
