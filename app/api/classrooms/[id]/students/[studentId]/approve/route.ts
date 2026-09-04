import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../../../lib/supabase/server';
import { recordConnectionAudit } from '../../../../../../lib/classrooms/audit';
import { notifyOnce, notifyChildOnce } from '../../../../../../lib/activity/server';

const BodySchema = z.object({
  action: z.enum(['approve', 'decline', 'revoke']).optional(),
  approved: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; studentId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });

  const { id: classroomId, studentId } = await ctx.params;
  const rawBody = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const admin = createServerAdminClient();

  // The caller must be the parent who owns this specific child — never trust
  // the classroom/student ids alone.
  const { data: child } = await admin.from('children').select('id, name, family_id').eq('id', studentId).maybeSingle();
  if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: family } = await admin.from('families').select('id').eq('id', child.family_id).eq('owner_id', user.id).maybeSingle();
  if (!family) return NextResponse.json({ error: 'You are not authorized to manage this student.' }, { status: 403 });

  const { data: classroom } = await admin.from('classrooms').select('id, name, teacher_id').eq('id', classroomId).maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Classroom not found.' }, { status: 404 });

  // Determine intent: 'approve' | 'decline' | 'revoke'
  let targetAction: 'approve' | 'decline' | 'revoke' = 'approve';
  if (parsed.data.action) {
    targetAction = parsed.data.action;
  } else if (parsed.data.approved !== undefined) {
    targetAction = parsed.data.approved ? 'approve' : 'decline';
  }

  const now = new Date().toISOString();
  let updateData: Record<string, unknown> = {};

  if (targetAction === 'approve') {
    updateData = {
      status: 'approved',
      approved: true,
      approved_by: user.id,
      approved_at: now,
      revoked_at: null,
      updated_at: now,
    };
  } else if (targetAction === 'decline') {
    updateData = {
      status: 'declined',
      approved: false,
      updated_at: now,
    };
  } else {
    // revoke
    updateData = {
      status: 'revoked',
      approved: false,
      revoked_at: now,
      updated_at: now,
    };
  }

  const { error } = await admin
    .from('classroom_students')
    .update(updateData)
    .eq('classroom_id', classroomId)
    .eq('child_id', studentId);

  if (error) return NextResponse.json({ error: 'Could not update connection status.' }, { status: 500 });

  // Record audit log
  const auditAction = targetAction === 'approve' ? 'approved' : targetAction === 'decline' ? 'declined' : 'revoked';
  await recordConnectionAudit(admin, {
    classroomId,
    childId: studentId,
    teacherId: classroom.teacher_id,
    actorId: user.id,
    actorRole: 'parent',
    action: auditAction,
    metadata: { classroomName: classroom.name, childName: child.name },
  });

  // Resolve teacher name for notifications
  let teacherName = 'Teacher';
  try {
    const { data: teacherUser } = await admin.auth.admin.getUserById(classroom.teacher_id);
    teacherName = (teacherUser?.user?.user_metadata?.name || teacherUser?.user?.user_metadata?.full_name || 'Teacher') as string;
  } catch {}

  // Notify teacher based on action
  if (targetAction === 'approve') {
    await notifyOnce(admin, {
      recipientId: classroom.teacher_id,
      childId: child.id,
      type: 'TEACHER_CONNECTION_APPROVED',
      title: 'Classroom connection approved',
      body: `Connection with ${child.name} in "${classroom.name}" was approved by their parent.`,
      payload: { classroomId, classroomName: classroom.name, childId: child.id },
      dedupeKey: `teacher_conn_approved:${classroomId}:${child.id}:${Date.now()}`,
    });

    // Notify child/teen
    await notifyChildOnce(admin, {
      childId: child.id,
      type: 'TEACHER_CONNECTED',
      title: 'Connected to your classroom!',
      body: `You are now connected with Teacher ${teacherName} in ${classroom.name}.`,
      payload: { classroomId, classroomName: classroom.name, teacherName },
      dedupeKey: `child_teacher_conn:${classroomId}:${child.id}:${Date.now()}`,
    });
  } else if (targetAction === 'decline') {
    await notifyOnce(admin, {
      recipientId: classroom.teacher_id,
      childId: child.id,
      type: 'TEACHER_CONNECTION_DECLINED',
      title: 'Classroom connection declined',
      body: `The connection request for ${child.name} in "${classroom.name}" was declined.`,
      payload: { classroomId, classroomName: classroom.name, childId: child.id },
      dedupeKey: `teacher_conn_declined:${classroomId}:${child.id}:${Date.now()}`,
    });
  } else if (targetAction === 'revoke') {
    await notifyOnce(admin, {
      recipientId: classroom.teacher_id,
      childId: child.id,
      type: 'TEACHER_CONNECTION_REVOKED',
      title: 'Classroom connection revoked',
      body: `Classroom access for ${child.name} in "${classroom.name}" was revoked by their parent.`,
      payload: { classroomId, classroomName: classroom.name, childId: child.id },
      dedupeKey: `teacher_conn_revoked:${classroomId}:${child.id}:${Date.now()}`,
    });
  }

  return NextResponse.json({ success: true, status: updateData.status });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; studentId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });

  const { id: classroomId, studentId } = await ctx.params;
  const admin = createServerAdminClient();

  const { data: child } = await admin.from('children').select('id, name, family_id').eq('id', studentId).maybeSingle();
  if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: family } = await admin.from('families').select('id').eq('id', child.family_id).eq('owner_id', user.id).maybeSingle();
  if (!family) return NextResponse.json({ error: 'You are not authorized to manage this student.' }, { status: 403 });

  const { data: classroom } = await admin.from('classrooms').select('id, name, teacher_id').eq('id', classroomId).maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Classroom not found.' }, { status: 404 });

  const now = new Date().toISOString();
  // Revoke connection rather than destroying educational history
  const { error } = await admin
    .from('classroom_students')
    .update({
      status: 'revoked',
      approved: false,
      revoked_at: now,
      updated_at: now,
    })
    .eq('classroom_id', classroomId)
    .eq('child_id', studentId);

  if (error) return NextResponse.json({ error: 'Could not revoke connection.' }, { status: 500 });

  // Audit log
  await recordConnectionAudit(admin, {
    classroomId,
    childId: studentId,
    teacherId: classroom.teacher_id,
    actorId: user.id,
    actorRole: 'parent',
    action: 'revoked',
    metadata: { classroomName: classroom.name, childName: child.name },
  });

  // Notify teacher
  await notifyOnce(admin, {
    recipientId: classroom.teacher_id,
    childId: child.id,
    type: 'TEACHER_CONNECTION_REVOKED',
    title: 'Classroom connection revoked',
    body: `Classroom access for ${child.name} in "${classroom.name}" was revoked by their parent.`,
    payload: { classroomId, classroomName: classroom.name, childId: child.id },
    dedupeKey: `teacher_conn_revoked:${classroomId}:${child.id}:${Date.now()}`,
  });

  return NextResponse.json({ success: true, status: 'revoked' });
}

