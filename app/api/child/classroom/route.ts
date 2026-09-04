import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';

export type ChildClassroomItem = {
  id: string;
  name: string;
  code: string;
  ageBand: string | null;
  teacherName: string;
  churchOrOrg: string | null;
  approved: boolean;
  status: string;
};

export async function GET() {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const admin = createServerAdminClient();

  const { data: membershipsRaw } = await admin
    .from('classroom_students')
    .select('classroom_id, approved, status, requested_by, classrooms(id, name, code, age_band, teacher_id, church_or_org)')
    .eq('child_id', session.childId);

  const memberships = (membershipsRaw || []).filter((m) => m.classrooms);

  if (memberships.length === 0) {
    return NextResponse.json({
      connected: false,
      approved: false,
      classroom: null,
      teacherName: null,
      classrooms: [],
    });
  }

  // Teacher names cache
  const teacherNames = new Map<string, string>();

  const classroomsList: ChildClassroomItem[] = [];
  for (const m of memberships) {
    const c = m.classrooms as unknown as {
      id: string;
      name: string;
      code: string;
      age_band: string | null;
      teacher_id: string;
      church_or_org?: string | null;
    } | null;

    if (!c) continue;

    let teacherName = 'Teacher';
    if (c.teacher_id) {
      if (teacherNames.has(c.teacher_id)) {
        teacherName = teacherNames.get(c.teacher_id)!;
      } else {
        try {
          const { data: teacherUser } = await admin.auth.admin.getUserById(c.teacher_id);
          teacherName = (teacherUser?.user?.user_metadata?.name || teacherUser?.user?.user_metadata?.full_name || 'Teacher') as string;
          teacherNames.set(c.teacher_id, teacherName);
        } catch {
          teacherNames.set(c.teacher_id, 'Teacher');
        }
      }
    }

    const isApproved = m.approved || m.status === 'approved';
    classroomsList.push({
      id: c.id,
      name: c.name,
      code: c.code,
      ageBand: c.age_band,
      teacherName,
      churchOrOrg: c.church_or_org || null,
      approved: isApproved,
      status: m.status || (isApproved ? 'approved' : 'pending'),
    });
  }

  const primary = classroomsList.find((cl) => cl.approved) || classroomsList[0] || null;

  return NextResponse.json({
    connected: classroomsList.length > 0,
    approved: Boolean(primary?.approved),
    classroom: primary ? {
      id: primary.id,
      name: primary.name,
      code: primary.code,
      ageBand: primary.ageBand,
      churchOrOrg: primary.churchOrOrg,
    } : null,
    teacherName: primary?.teacherName || null,
    classrooms: classroomsList,
  });
}
