import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { notifyChildOnce, notifyOnce } from '../../../../lib/activity/server';
import { resolveTargetChildIds } from '../../../../lib/assignments/server';

const PublishSchema = z.object({
  classroomId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).max(200).optional(),
});

/** Turns a draft into a live assignment: locks in the target roster, creates submission rows, and notifies parents. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const rawBody = await req.json().catch(() => ({}));
  const parsed = PublishSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const admin = createServerAdminClient();
  const { data: assignment } = await admin.from('assignments').select('id, title, classroom_id, status, due_date').eq('id', id).eq('teacher_id', user.id).maybeSingle();
  if (!assignment) return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
  if (assignment.status === 'assigned') return NextResponse.json({ error: 'This assignment is already live.' }, { status: 409 });

  const classroomId = parsed.data.classroomId ?? assignment.classroom_id ?? undefined;
  const targetIds = await resolveTargetChildIds(admin, user.id, classroomId || undefined, parsed.data.studentIds);
  if (targetIds.length === 0) return NextResponse.json({ error: 'Choose a class or at least one student.' }, { status: 400 });

  const nowIso = new Date().toISOString();
  const { error: updateError } = await admin
    .from('assignments')
    .update({ status: 'assigned', assigned_at: nowIso, classroom_id: classroomId || null, updated_at: nowIso })
    .eq('id', id);
  if (updateError) return NextResponse.json({ error: 'Could not publish this assignment.' }, { status: 500 });

  await admin.from('assignment_submissions').upsert(
    targetIds.map((childId) => ({ assignment_id: id, child_id: childId })),
    { onConflict: 'assignment_id,child_id', ignoreDuplicates: true }
  );

  let classroomName: string | null = null;
  if (classroomId) {
    const { data: classroom } = await admin.from('classrooms').select('name').eq('id', classroomId).maybeSingle();
    classroomName = classroom?.name || null;
  }

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
        body: `${child.name} was assigned “${assignment.title}”${classroomName ? ` in ${classroomName}` : ''}${assignment.due_date ? ` — due ${new Date(`${assignment.due_date}T00:00:00`).toLocaleDateString()}` : ''}.`,
        payload: { assignmentId: id },
        dedupeKey: `assignment:${id}:${child.id}`,
      }).catch(() => {});
    }
    await notifyChildOnce(admin, {
      childId: child.id,
      type: 'ASSIGNMENT',
      title: `New assignment${classroomName ? ` from ${classroomName}` : ''}`,
      body: `“${assignment.title}” is ready for you${assignment.due_date ? ` — due ${new Date(`${assignment.due_date}T00:00:00`).toLocaleDateString()}` : ''}.`,
      payload: { assignmentId: id },
      dedupeKey: `assignment_child:${id}:${child.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
