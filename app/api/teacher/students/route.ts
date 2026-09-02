import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { getStreakCalendar, getStreakStatus } from '../../../lib/streak/server';
import { getConceptMasteryForChild } from '../../../lib/adaptive/server';
import { getConcept } from '../../../lib/adaptive/concepts';
import { getLevelInfo } from '../../../lib/xp-levels';
import { ageGroupForAge, buildNeedsAttention, computeActivityStatus } from '../../../lib/classrooms/server';
import type { PendingStudent, StudentCard, StudentClassroomRef } from '../../../lib/classrooms/types';
import { normalizeTeacherCode } from '../../../lib/codes/server';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import { notifyOnce } from '../../../lib/activity/server';

type ChildRow = { id: string; name: string; age: number; family_id: string; last_login_at: string | null };
type RosterRow = { classroom_id: string; child_id: string; approved: boolean; needs_help: boolean; joined_at: string; children: ChildRow | null };

/**
 * Every classroom this teacher owns, rolled up into one "My Students"
 * roster. Reuses the exact same streak/mastery/activity helpers as
 * /api/classrooms/[id]/summary and /api/family/today — no parallel scoring
 * system, just a different aggregation of the same source data.
 *
 * Only children a parent has approved into one of this teacher's classrooms
 * get full learning data; anyone still pending approval is listed
 * separately, by name only, matching the privacy stance already used by the
 * class summary endpoint.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const admin = createServerAdminClient();

  const { data: classrooms } = await admin.from('classrooms').select('id, name, age_band').eq('teacher_id', user.id);
  const classroomList = classrooms || [];
  if (classroomList.length === 0) {
    return NextResponse.json({ classrooms: [], students: [], pending: [] });
  }
  const classroomIds = classroomList.map((c) => c.id);
  const classroomRef = (id: string): StudentClassroomRef => {
    const c = classroomList.find((cl) => cl.id === id);
    return { id, name: c?.name || 'Class' };
  };

  const { data: rosterRaw } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id, approved, needs_help, joined_at, children(id, name, age, family_id, last_login_at)')
    .in('classroom_id', classroomIds);

  const roster = ((rosterRaw || []) as unknown as RosterRow[]).filter((r) => r.children);
  if (roster.length === 0) {
    return NextResponse.json({ classrooms: classroomList.map((c) => ({ id: c.id, name: c.name, ageBand: c.age_band })), students: [], pending: [] });
  }

  const byChild = new Map<string, RosterRow[]>();
  for (const r of roster) {
    const list = byChild.get(r.child_id) || [];
    list.push(r);
    byChild.set(r.child_id, list);
  }

  const approvedChildIds = Array.from(byChild.entries()).filter(([, rows]) => rows.some((r) => r.approved)).map(([id]) => id);
  const pendingChildIds = Array.from(byChild.entries()).filter(([, rows]) => !rows.some((r) => r.approved)).map(([id]) => id);

  const familyIds = Array.from(new Set(roster.map((r) => (r.children as ChildRow).family_id)));
  const { data: families } = familyIds.length ? await admin.from('families').select('id, timezone').in('id', familyIds) : { data: [] as { id: string; timezone: string }[] };
  const timezoneByChild = new Map<string, string>();
  for (const r of roster) {
    const familyId = (r.children as ChildRow).family_id;
    timezoneByChild.set(r.child_id, families?.find((f) => f.id === familyId)?.timezone || 'UTC');
  }

  const lifetimeXp = new Map<string, number>();
  if (approvedChildIds.length > 0) {
    const { data: xpRows } = await admin.from('daily_activity_summary').select('child_id, xp_earned').in('child_id', approvedChildIds);
    for (const row of xpRows || []) lifetimeXp.set(row.child_id, (lifetimeXp.get(row.child_id) || 0) + (row.xp_earned || 0));
  }

  const students: StudentCard[] = await Promise.all(approvedChildIds.map(async (childId) => {
    const memberships = byChild.get(childId)!;
    const child = memberships[0].children as ChildRow;
    const needsHelp = memberships.some((m) => m.needs_help);
    const tz = timezoneByChild.get(childId) || 'UTC';

    const [streak, calendar, masteryRows] = await Promise.all([
      getStreakStatus(admin, childId, tz),
      getStreakCalendar(admin, childId, tz, 7),
      getConceptMasteryForChild(admin, childId),
    ]);

    const weeklyActiveDays = calendar.filter((d) => d.state === 'complete' || d.state === 'grace').length;
    const masteryPercent = masteryRows.length ? Math.round(masteryRows.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRows.length) : 0;
    const strugglingLabels = masteryRows.filter((m) => m.status === 'needs_reinforcement').map((m) => getConcept(m.concept_id)?.label || m.concept_id);

    const xp = lifetimeXp.get(childId) || 0;
    const level = getLevelInfo(xp);
    const activityStatus = computeActivityStatus(child.last_login_at);
    const { needsAttention, reasons } = buildNeedsAttention({
      lastActiveAt: child.last_login_at,
      needsHelp,
      streakEndedRecently: streak.streakEndedRecently,
      strugglingConceptLabels: strugglingLabels,
    });

    return {
      id: child.id,
      name: child.name,
      age: child.age,
      ageGroup: ageGroupForAge(child.age),
      classrooms: memberships.filter((m) => m.approved).map((m) => classroomRef(m.classroom_id)),
      xp,
      level: level.level,
      levelTitle: level.title,
      currentStreak: streak.currentStreak,
      weeklyActiveDays,
      masteryPercent,
      masteryTracked: masteryRows.length > 0,
      lastActiveAt: child.last_login_at,
      activityStatus,
      needsHelp,
      needsAttention,
      needsAttentionReasons: reasons,
    };
  }));

  students.sort((a, b) => a.name.localeCompare(b.name));

  const pending: PendingStudent[] = pendingChildIds.map((childId) => {
    const memberships = byChild.get(childId)!;
    const child = memberships[0].children as ChildRow;
    return {
      id: child.id,
      name: child.name,
      classrooms: memberships.map((m) => classroomRef(m.classroom_id)),
      joinedAt: memberships[0].joined_at || null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    classrooms: classroomList.map((c) => ({ id: c.id, name: c.name, ageBand: c.age_band })),
    students,
    pending,
  });
}

const AddStudentSchema = z.object({
  teacherCode: z.string().trim().min(4).max(32),
  classroomId: z.string().uuid(),
});

/**
 * "Students → Add Student → Enter Teacher Code": the teacher-initiated half
 * of the connection flow (a child sharing their Teacher Code from "My
 * Lantern & Lion Codes"). Creates the exact same kind of pending
 * classroom_students row a child's own self-join with a classroom code
 * would — reusing the existing parent-approval endpoint and UI rather than
 * a parallel relationship system, just tagged requested_by: 'teacher'.
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
    .select('id, approved')
    .eq('classroom_id', classroom.id)
    .eq('child_id', child.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      existing.approved
        ? { error: 'This student is already connected to your classroom.', status: 'already_connected' }
        : { error: 'Connection request pending.', status: 'pending' },
      { status: 409 }
    );
  }

  const { error: insertError } = await admin
    .from('classroom_students')
    .insert({ classroom_id: classroom.id, child_id: child.id, approved: false, requested_by: 'teacher' });
  if (insertError) return NextResponse.json({ error: 'Could not send the connection request.' }, { status: 500 });

  const { data: family } = await admin.from('families').select('owner_id').eq('id', child.family_id).maybeSingle();
  if (family?.owner_id) {
    await notifyOnce(admin, {
      recipientId: family.owner_id,
      childId: child.id,
      type: 'TEACHER_REQUEST',
      title: 'New classroom connection request',
      body: `A teacher wants to add ${child.name} to "${classroom.name}". Review and approve it from your Family dashboard.`,
      payload: { classroomId: classroom.id, classroomName: classroom.name, childId: child.id },
      dedupeKey: `teacher_request:${classroom.id}:${child.id}`,
    });
  }

  return NextResponse.json({
    success: true,
    pendingApproval: true,
    child: { id: child.id, name: child.name },
    classroom: { id: classroom.id, name: classroom.name },
  });
}
