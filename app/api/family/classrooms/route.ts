import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';

export type ParentChildClassroomInfo = {
  childId: string;
  childName: string;
  classroomId: string | null;
  classroomName: string | null;
  classroomCode: string | null;
  ageBand: string | null;
  teacherName: string | null;
  churchOrOrg: string | null;
  status: 'connected' | 'pending' | 'declined' | 'revoked' | 'not_connected';
  approved: boolean;
  needsHelp: boolean;
  joinedAt: string | null;
  requestedBy: 'child' | 'teacher';
  requestedScopes: string[];
  assignments: {
    completedCount: number;
    pendingCount: number;
    latest: {
      title: string;
      assignmentType: string;
      score: number | null;
      feedback: string | null;
      gradedAt: string | null;
    } | null;
  };
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    eventDate: string | null;
    createdAt: string;
  }>;
};

const DEFAULT_REQUESTED_SCOPES = [
  'Classroom participation',
  'Assignment progress',
  'Quiz/activity performance',
  'Scripture learning progress',
  'Relevant educational activity',
];

/** Lists this parent's children's classroom memberships, teachers, assignment progress, and announcements. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });

  const admin = createServerAdminClient();
  const { data: family } = await admin.from('families').select('id').eq('owner_id', user.id).maybeSingle();
  if (!family) return NextResponse.json({ memberships: [], childClassrooms: [] });

  const { data: children } = await admin.from('children').select('id, name').eq('family_id', family.id);
  const childIds = (children || []).map((c) => c.id);
  if (childIds.length === 0) return NextResponse.json({ memberships: [], childClassrooms: [] });

  const { data: memberships } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id, approved, needs_help, joined_at, requested_by, status, classrooms(id, name, age_band, code, teacher_id, church_or_org)')
    .in('child_id', childIds);

  const rawMemberships = memberships || [];

  // Gather distinct teacher IDs and classroom IDs
  const teacherIds = new Set<string>();
  const classroomIds = new Set<string>();
  for (const m of rawMemberships) {
    const c = m.classrooms as unknown as { id: string; name: string; age_band: string | null; code: string; teacher_id: string; church_or_org?: string | null } | null;
    if (c) {
      classroomIds.add(c.id);
      if (c.teacher_id) teacherIds.add(c.teacher_id);
    }
  }

  // Teacher names
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

  // Submissions for this family's children
  const { data: submissions } = await admin
    .from('assignment_submissions')
    .select('id, child_id, status, score, feedback, submitted_at, graded_at, assignments(id, title, assignment_type, due_date, classroom_id)')
    .in('child_id', childIds);

  type SubmissionWithAssignment = {
    id: string;
    child_id: string;
    status: string;
    score: number | null;
    feedback: string | null;
    submitted_at: string | null;
    graded_at: string | null;
    assignments: { id: string; title: string; assignment_type: string; due_date: string | null; classroom_id: string } | null;
  };
  const rawSubmissions = (submissions || []) as unknown as SubmissionWithAssignment[];

  // Announcements for these classrooms
  let announcementsList: Array<{ id: string; classroom_id: string; title: string; message: string; event_date: string | null; created_at: string }> = [];
  if (classroomIds.size > 0) {
    const { data: annData } = await admin
      .from('classroom_announcements')
      .select('id, classroom_id, title, message, event_date, created_at')
      .in('classroom_id', Array.from(classroomIds))
      .order('created_at', { ascending: false })
      .limit(20);
    announcementsList = annData || [];
  }

  // Build per-child educational classroom summaries supporting multiple classrooms per child
  const childClassrooms: ParentChildClassroomInfo[] = [];

  for (const child of children || []) {
    const childMemberships = rawMemberships.filter((m) => m.child_id === child.id);
    if (childMemberships.length === 0) {
      childClassrooms.push({
        childId: child.id,
        childName: child.name,
        classroomId: null,
        classroomName: null,
        classroomCode: null,
        ageBand: null,
        teacherName: null,
        churchOrOrg: null,
        status: 'not_connected',
        approved: false,
        needsHelp: false,
        joinedAt: null,
        requestedBy: 'child',
        requestedScopes: DEFAULT_REQUESTED_SCOPES,
        assignments: { completedCount: 0, pendingCount: 0, latest: null },
        announcements: [],
      });
      continue;
    }

    for (const membership of childMemberships) {
      const c = membership.classrooms as unknown as { id: string; name: string; age_band: string | null; code: string; teacher_id: string; church_or_org?: string | null } | null;
      const teacherName = c?.teacher_id ? (teacherNames.get(c.teacher_id) || 'Teacher') : 'Teacher';
      const churchOrOrg = c?.church_or_org || 'Grace Community Church';

      let status: 'connected' | 'pending' | 'declined' | 'revoked' | 'not_connected' = 'pending';
      const rawStatus = (membership as unknown as { status?: string }).status;
      if (rawStatus === 'declined') status = 'declined';
      else if (rawStatus === 'revoked') status = 'revoked';
      else if (rawStatus === 'removed') status = 'not_connected';
      else if (membership.approved || rawStatus === 'approved') status = 'connected';
      else status = 'pending';

      // Filter assignments for this child and classroom
      const childSubs = rawSubmissions.filter((s) => s.child_id === child.id && (!c || s.assignments?.classroom_id === c.id));
      const completedSubs = childSubs.filter((s) => s.status === 'completed' || s.status === 'graded' || s.status === 'returned');
      const pendingSubs = childSubs.filter((s) => s.status === 'assigned' || s.status === 'in_progress');

      // Find latest graded or submitted assignment
      const sortedGraded = [...childSubs]
        .filter((s) => s.assignments && (s.score !== null || s.feedback !== null || s.graded_at !== null || s.submitted_at !== null))
        .sort((a, b) => new Date(b.graded_at || b.submitted_at || 0).getTime() - new Date(a.graded_at || a.submitted_at || 0).getTime());
      const latestSub = sortedGraded[0];
      const latest = latestSub && latestSub.assignments ? {
        title: latestSub.assignments.title,
        assignmentType: latestSub.assignments.assignment_type,
        score: latestSub.score,
        feedback: latestSub.feedback,
        gradedAt: latestSub.graded_at,
      } : null;

      const childAnnouncements = announcementsList
        .filter((a) => c && a.classroom_id === c.id)
        .map((a) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          eventDate: a.event_date,
          createdAt: a.created_at,
        }));

      childClassrooms.push({
        childId: child.id,
        childName: child.name,
        classroomId: c?.id || membership.classroom_id,
        classroomName: c?.name || 'Class',
        classroomCode: c?.code || null,
        ageBand: c?.age_band || null,
        teacherName,
        churchOrOrg,
        status,
        approved: membership.approved || rawStatus === 'approved',
        needsHelp: membership.needs_help,
        joinedAt: membership.joined_at,
        requestedBy: (membership.requested_by as 'child' | 'teacher' | undefined) || 'child',
        requestedScopes: DEFAULT_REQUESTED_SCOPES,
        assignments: {
          completedCount: completedSubs.length,
          pendingCount: pendingSubs.length,
          latest,
        },
        announcements: childAnnouncements,
      });
    }
  }

  // Backwards compatibility for existing UI
  const membershipsResult = rawMemberships.map((m) => {
    const c = m.classrooms as unknown as { id: string; name: string } | null;
    return {
      classroomId: m.classroom_id,
      classroomName: c?.name || 'Class',
      childId: m.child_id,
      childName: children?.find((ch) => ch.id === m.child_id)?.name || '',
      approved: m.approved,
      needsHelp: m.needs_help,
      joinedAt: m.joined_at,
      requestedBy: (m.requested_by as 'child' | 'teacher' | undefined) || 'child',
    };
  });

  return NextResponse.json({
    memberships: membershipsResult,
    childClassrooms,
  });
}
