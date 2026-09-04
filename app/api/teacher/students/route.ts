import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { computeStudentCards, type ChildRow } from '../../../lib/classrooms/roster';
import type { ConnectionStatus, PendingStudent, StudentCard, StudentClassroomRef } from '../../../lib/classrooms/types';
import { normalizeTeacherCode } from '../../../lib/codes/server';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import { notifyOnce } from '../../../lib/activity/server';
import { recordConnectionAudit } from '../../../lib/classrooms/audit';

type RosterRow = {
  classroom_id: string;
  child_id: string;
  approved: boolean;
  needs_help: boolean;
  joined_at: string;
  status?: string | null;
  updated_at?: string | null;
  children: ChildRow | null;
};

/**
 * Every classroom this teacher owns, rolled up into one "My Students"
 * roster. Reuses the exact same streak/mastery/activity helpers as
 * /api/classrooms/[id]/summary and /api/family/today — no parallel scoring
 * system, just a different aggregation of the same source data.
 *
 * Only children a parent has approved into one of this teacher's classrooms
 * get full learning data; anyone still pending approval, declined, or revoked
 * is listed separately, by name only, matching the privacy stance.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const admin = createServerAdminClient();

  const { data: classrooms } = await admin.from('classrooms').select('id, name, age_band').eq('teacher_id', user.id);
  const classroomList = classrooms || [];
  if (classroomList.length === 0) {
    return NextResponse.json({ classrooms: [], students: [], pending: [], declined: [], revoked: [] });
  }
  const classroomIds = classroomList.map((c) => c.id);
  const classroomRef = (id: string): StudentClassroomRef => {
    const c = classroomList.find((cl) => cl.id === id);
    return { id, name: c?.name || 'Class' };
  };

  const { data: rosterRaw } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id, approved, needs_help, joined_at, status, updated_at, children(id, name, age, family_id, last_login_at)')
    .in('classroom_id', classroomIds);

  const roster = ((rosterRaw || []) as unknown as RosterRow[]).filter((r) => r.children);
  if (roster.length === 0) {
    return NextResponse.json({
      classrooms: classroomList.map((c) => ({ id: c.id, name: c.name, ageBand: c.age_band })),
      students: [],
      pending: [],
      declined: [],
      revoked: [],
    });
  }

  const byChild = new Map<string, RosterRow[]>();
  for (const r of roster) {
    const list = byChild.get(r.child_id) || [];
    list.push(r);
    byChild.set(r.child_id, list);
  }

  const approvedChildIds = Array.from(byChild.entries())
    .filter(([, rows]) => rows.some((r) => r.approved || r.status === 'approved'))
    .map(([id]) => id);

  const pendingChildIds = Array.from(byChild.entries())
    .filter(([id, rows]) => !approvedChildIds.includes(id) && rows.some((r) => r.status === 'pending' || (!r.status && !r.approved)))
    .map(([id]) => id);

  const declinedChildIds = Array.from(byChild.entries())
    .filter(([id, rows]) => !approvedChildIds.includes(id) && !pendingChildIds.includes(id) && rows.some((r) => r.status === 'declined'))
    .map(([id]) => id);

  const revokedChildIds = Array.from(byChild.entries())
    .filter(([id, rows]) => !approvedChildIds.includes(id) && !pendingChildIds.includes(id) && !declinedChildIds.includes(id) && rows.some((r) => r.status === 'revoked'))
    .map(([id]) => id);

  const needsHelpByChild = new Map<string, boolean>();
  for (const [childId, rows] of byChild) needsHelpByChild.set(childId, rows.some((r) => r.needs_help));

  const approvedChildren = approvedChildIds.map((id) => byChild.get(id)![0].children as ChildRow);
  const cardsByChild = await computeStudentCards(admin, approvedChildren, needsHelpByChild);

  const students: StudentCard[] = approvedChildIds.map((childId) => {
    const memberships = byChild.get(childId)!;
    const base = cardsByChild.get(childId)!;
    return { ...base, classrooms: memberships.filter((m) => m.approved || m.status === 'approved').map((m) => classroomRef(m.classroom_id)) };
  });

  students.sort((a, b) => a.name.localeCompare(b.name));

  const mapStudentGroup = (childIds: string[], targetStatus: ConnectionStatus): PendingStudent[] =>
    childIds.map((childId) => {
      const memberships = byChild.get(childId)!;
      const child = memberships[0].children as ChildRow;
      const match = memberships.find((m) => m.status === targetStatus) || memberships[0];
      return {
        id: child.id,
        name: child.name,
        classrooms: memberships.map((m) => classroomRef(m.classroom_id)),
        joinedAt: match.joined_at || null,
        status: (match.status as ConnectionStatus) || targetStatus,
        updatedAt: match.updated_at || null,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

  const pending: PendingStudent[] = mapStudentGroup(pendingChildIds, 'pending');
  const declined: PendingStudent[] = mapStudentGroup(declinedChildIds, 'declined');
  const revoked: PendingStudent[] = mapStudentGroup(revokedChildIds, 'revoked');

  return NextResponse.json({
    classrooms: classroomList.map((c) => ({ id: c.id, name: c.name, ageBand: c.age_band })),
    students,
    pending,
    declined,
    revoked,
  });
}

const AddStudentSchema = z.object({
  teacherCode: z.string().trim().min(4).max(32),
  classroomId: z.string().uuid(),
});

/**
 * "Students → Add Student → Enter Teacher Code": the teacher-initiated half
 * of the connection flow. Creates a pending connection state.
 * Prevents duplicate active requests.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  // Keyed by teacher + IP: generous enough for normal use, tight enough to
  // make brute-forcing the Teacher Code space impractical.
  const limit = checkRateLimit(`teacher-add-student:${user.id}:${getClientIp(req)}`, { maxRequests: 20, windowSeconds: 60 });
  if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts. Please wait a moment and try again.' }, { status: 429 });

  const rawBody = await req.json().catch(() => null);
  const parsed = AddStudentSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please enter a valid Teacher Code.' }, { status: 400 });

  const admin = createServerAdminClient();

  const { data: classroom } = await admin
    .from('classrooms')
    .select('id, name')
    .eq('id', parsed.data.classroomId)
    .eq('teacher_id', user.id)
    .maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const code = normalizeTeacherCode(parsed.data.teacherCode);
  const { data: child } = await admin.from('children').select('id, name, family_id').eq('teacher_code', code).maybeSingle();
  if (!child) {
    return NextResponse.json({ error: "We couldn't find a student with that code. Check the code and try again.", status: 'not_found' }, { status: 404 });
  }

  const { data: existing } = await admin
    .from('classroom_students')
    .select('id, approved, status')
    .eq('classroom_id', classroom.id)
    .eq('child_id', child.id)
    .maybeSingle();

  if (existing) {
    const isApproved = existing.approved || existing.status === 'approved';
    const isPending = existing.status === 'pending' || (!existing.status && !existing.approved);
    if (isApproved) {
      return NextResponse.json(
        { error: 'This student is already connected to your classroom.', status: 'already_connected' },
        { status: 409 }
      );
    }
    if (isPending) {
      return NextResponse.json(
        { error: 'Connection request pending.', status: 'pending' },
        { status: 409 }
      );
    }

    // If previously declined, revoked, or removed: transition back to pending
    const { error: updateError } = await admin
      .from('classroom_students')
      .update({
        approved: false,
        status: 'pending',
        requested_by: 'teacher',
        revoked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) return NextResponse.json({ error: 'Could not send the connection request.' }, { status: 500 });
  } else {
    const { error: insertError } = await admin
      .from('classroom_students')
      .insert({
        classroom_id: classroom.id,
        child_id: child.id,
        approved: false,
        status: 'pending',
        requested_by: 'teacher',
      });
    if (insertError) return NextResponse.json({ error: 'Could not send the connection request.' }, { status: 500 });
  }

  // Immutable audit log
  await recordConnectionAudit(admin, {
    classroomId: classroom.id,
    childId: child.id,
    teacherId: user.id,
    actorId: user.id,
    actorRole: 'teacher',
    action: 'requested',
    metadata: { classroomName: classroom.name, teacherCodeUsed: true },
  });

  // Notify parent
  const teacherName = (user.user_metadata?.name || user.user_metadata?.full_name || 'Teacher') as string;
  const { data: family } = await admin.from('families').select('owner_id').eq('id', child.family_id).maybeSingle();
  if (family?.owner_id) {
    await notifyOnce(admin, {
      recipientId: family.owner_id,
      childId: child.id,
      type: 'TEACHER_REQUEST',
      title: `${teacherName} wants to connect with ${child.name} as a teacher.`,
      body: `${teacherName} wants to connect with ${child.name} in "${classroom.name}". Review and approve classroom access from your dashboard.`,
      payload: { classroomId: classroom.id, classroomName: classroom.name, teacherName, childId: child.id },
      dedupeKey: `teacher_request:${classroom.id}:${child.id}:${Date.now()}`,
    });
  }

  return NextResponse.json({
    success: true,
    pendingApproval: true,
    child: { id: child.id, name: child.name },
    classroom: { id: classroom.id, name: classroom.name },
  });
}
