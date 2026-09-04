import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';

export type CalendarItemType =
  | 'assignment'
  | 'scripture_memory'
  | 'challenge'
  | 'bible_adventure'
  | 'event'
  | 'announcement';

export type CalendarItem = {
  id: string;
  type: CalendarItemType;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // for multi-day challenges
  time?: string; // HH:MM
  classroomId: string;
  classroomName: string;
  status?: string;
  assignmentType?: string;
  totalStudents?: number;
  completedCount?: number;
  incompleteCount?: number;
  description?: string;
  meta?: Record<string, unknown>;
};

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get('classroomId');

  const admin = createServerAdminClient();

  // 1. Fetch teacher classrooms to resolve names and scope
  let classroomQuery = admin
    .from('classrooms')
    .select('id, name')
    .eq('teacher_id', user.id);

  if (classroomId) {
    // Explicit authorization check: verify classroom belongs to current teacher
    const { data: ownClass } = await admin
      .from('classrooms')
      .select('id')
      .eq('id', classroomId)
      .eq('teacher_id', user.id)
      .maybeSingle();

    if (!ownClass) {
      return NextResponse.json({ error: 'Classroom not found or unauthorized.' }, { status: 403 });
    }

    classroomQuery = classroomQuery.eq('id', classroomId);
  }

  const { data: classrooms, error: classError } = await classroomQuery;
  if (classError || !classrooms) {
    return NextResponse.json({ error: 'Could not load classrooms.' }, { status: 500 });
  }

  const classroomMap = new Map<string, string>();
  for (const c of classrooms) classroomMap.set(c.id, c.name);
  const allowedClassroomIds = Array.from(classroomMap.keys());

  if (allowedClassroomIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const items: CalendarItem[] = [];

  // 2. Fetch approved students count per classroom for completion calculations
  const { data: studentRows } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id')
    .in('classroom_id', allowedClassroomIds)
    .eq('approved', true);

  const studentsByClass = new Map<string, number>();
  for (const s of studentRows || []) {
    studentsByClass.set(s.classroom_id, (studentsByClass.get(s.classroom_id) || 0) + 1);
  }

  // 3. Fetch Assignments with due dates
  const { data: assignments } = await admin
    .from('assignments')
    .select('id, title, assignment_type, instructions, due_date, status, classroom_id, xp_reward, required_score')
    .in('classroom_id', allowedClassroomIds)
    .not('due_date', 'is', null);

  const assignmentIds = (assignments || []).map((a) => a.id);
  const subsByAssignment = new Map<string, { completed: number; total: number }>();

  if (assignmentIds.length > 0) {
    const { data: subs } = await admin
      .from('assignment_submissions')
      .select('assignment_id, child_id, status')
      .in('assignment_id', assignmentIds);

    for (const sub of subs || []) {
      const entry = subsByAssignment.get(sub.assignment_id) || { completed: 0, total: 0 };
      entry.total += 1;
      if (['submitted', 'graded', 'returned'].includes(sub.status)) {
        entry.completed += 1;
      }
      subsByAssignment.set(sub.assignment_id, entry);
    }
  }

  for (const a of assignments || []) {
    if (!a.due_date) continue;

    const classRosterSize = studentsByClass.get(a.classroom_id) || 0;
    const subStats = subsByAssignment.get(a.id) || { completed: 0, total: 0 };
    const totalTarget = classRosterSize > 0 ? classRosterSize : subStats.total;
    const completedCount = subStats.completed;
    const incompleteCount = Math.max(0, totalTarget - completedCount);

    // Format human-readable status
    let statusLabel: string;
    if (incompleteCount > 0 && totalTarget > 0) {
      statusLabel = `${incompleteCount} student${incompleteCount === 1 ? '' : 's'} incomplete`;
    } else if (totalTarget > 0 && incompleteCount === 0) {
      statusLabel = `All ${totalTarget} completed`;
    } else {
      statusLabel = a.status === 'assigned' ? 'Assigned' : (a.status || 'Active');
    }

    // Determine event classification
    let itemType: CalendarItemType = 'assignment';
    let subtitle = 'Assignment Due';

    if (a.assignment_type === 'memory') {
      itemType = 'scripture_memory';
      subtitle = 'Scripture Memory Due';
    } else if (a.assignment_type === 'story') {
      itemType = 'bible_adventure';
      subtitle = 'Bible Adventure Chapter';
    }

    items.push({
      id: `assignment-${a.id}`,
      type: itemType,
      title: a.title,
      subtitle,
      date: a.due_date,
      classroomId: a.classroom_id,
      classroomName: classroomMap.get(a.classroom_id) || 'Class',
      status: statusLabel,
      assignmentType: a.assignment_type,
      totalStudents: totalTarget,
      completedCount,
      incompleteCount,
      description: a.instructions || undefined,
      meta: {
        assignmentId: a.id,
        assignmentType: a.assignment_type,
        xpReward: a.xp_reward,
        requiredScore: a.required_score,
      },
    });
  }

  // 4. Fetch Class Challenges
  const { data: challenges } = await admin
    .from('class_challenges')
    .select('id, name, description, goal_type, goal_target, start_date, end_date, status, classroom_id, reward_amount')
    .in('classroom_id', allowedClassroomIds);

  for (const ch of challenges || []) {
    const goalSubtitle = ch.goal_target && ch.goal_type ? `Goal: ${ch.goal_target} ${ch.goal_type}` : 'Class Challenge';

    // Show on start date
    items.push({
      id: `challenge-start-${ch.id}`,
      type: 'challenge',
      title: `${ch.name} (Starts)`,
      subtitle: `${goalSubtitle} · Begins`,
      date: ch.start_date,
      endDate: ch.end_date,
      classroomId: ch.classroom_id,
      classroomName: classroomMap.get(ch.classroom_id) || 'Class',
      status: ch.status === 'active' ? 'Active Challenge' : (ch.status || 'Challenge'),
      description: ch.description || undefined,
      meta: {
        challengeId: ch.id,
        goalType: ch.goal_type,
        goalTarget: ch.goal_target,
        rewardAmount: ch.reward_amount,
      },
    });

    if (ch.end_date !== ch.start_date) {
      items.push({
        id: `challenge-end-${ch.id}`,
        type: 'challenge',
        title: `${ch.name} (Ends)`,
        subtitle: `${goalSubtitle} · Deadline`,
        date: ch.end_date,
        endDate: ch.end_date,
        classroomId: ch.classroom_id,
        classroomName: classroomMap.get(ch.classroom_id) || 'Class',
        status: ch.status === 'active' ? 'Active Challenge' : (ch.status || 'Challenge'),
        description: ch.description || undefined,
        meta: {
          challengeId: ch.id,
          goalType: ch.goal_type,
          goalTarget: ch.goal_target,
          rewardAmount: ch.reward_amount,
        },
      });
    }
  }

  // 5. Fetch Classroom Events
  const { data: events } = await admin
    .from('classroom_events')
    .select('id, title, event_type, event_date, start_time, end_time, description, classroom_id')
    .in('classroom_id', allowedClassroomIds);

  for (const ev of events || []) {
    const isScriptureMemory = ev.event_type === 'scripture_challenge';
    const typeLabel = ev.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    items.push({
      id: `event-${ev.id}`,
      type: isScriptureMemory ? 'scripture_memory' : 'event',
      title: ev.title,
      subtitle: isScriptureMemory ? 'Scripture Memory Event' : typeLabel,
      date: ev.event_date,
      time: ev.start_time ? ev.start_time.slice(0, 5) : undefined,
      classroomId: ev.classroom_id,
      classroomName: classroomMap.get(ev.classroom_id) || 'Class',
      status: 'Scheduled',
      description: ev.description || undefined,
      meta: {
        eventId: ev.id,
        eventType: ev.event_type,
        startTime: ev.start_time,
        endTime: ev.end_time,
        description: ev.description,
      },
    });
  }

  // 6. Fetch Announcements
  const { data: announcements } = await admin
    .from('classroom_announcements')
    .select('id, title, message, event_date, created_at, classroom_id')
    .in('classroom_id', allowedClassroomIds);

  for (const an of announcements || []) {
    const rawDate = an.event_date || an.created_at;
    const dateStr = rawDate.slice(0, 10);
    items.push({
      id: `announcement-${an.id}`,
      type: 'announcement',
      title: an.title,
      subtitle: 'Classroom Announcement',
      date: dateStr,
      classroomId: an.classroom_id,
      classroomName: classroomMap.get(an.classroom_id) || 'Class',
      status: 'Announcement',
      description: an.message || undefined,
      meta: {
        announcementId: an.id,
        message: an.message,
      },
    });
  }

  // Sort chronologically by date then time
  items.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });

  return NextResponse.json({ items });
}
