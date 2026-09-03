import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';

export type CalendarItemType = 'assignment' | 'challenge' | 'event' | 'announcement';

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

  // 2. Fetch Assignments with due dates
  const { data: assignments } = await admin
    .from('assignments')
    .select('id, title, due_date, status, classroom_id')
    .in('classroom_id', allowedClassroomIds)
    .not('due_date', 'is', null);

  for (const a of assignments || []) {
    if (!a.due_date) continue;
    items.push({
      id: `assignment-${a.id}`,
      type: 'assignment',
      title: a.title,
      subtitle: 'Assignment Due',
      date: a.due_date,
      classroomId: a.classroom_id,
      classroomName: classroomMap.get(a.classroom_id) || 'Class',
      status: a.status,
      meta: { assignmentId: a.id },
    });
  }

  // 3. Fetch Class Challenges
  const { data: challenges } = await admin
    .from('class_challenges')
    .select('id, name, start_date, end_date, status, classroom_id')
    .in('classroom_id', allowedClassroomIds);

  for (const ch of challenges || []) {
    // Show on start date and end date
    items.push({
      id: `challenge-start-${ch.id}`,
      type: 'challenge',
      title: `${ch.name} (Starts)`,
      subtitle: 'Challenge Begins',
      date: ch.start_date,
      endDate: ch.end_date,
      classroomId: ch.classroom_id,
      classroomName: classroomMap.get(ch.classroom_id) || 'Class',
      status: ch.status,
      meta: { challengeId: ch.id },
    });

    if (ch.end_date !== ch.start_date) {
      items.push({
        id: `challenge-end-${ch.id}`,
        type: 'challenge',
        title: `${ch.name} (Goal Deadline)`,
        subtitle: 'Challenge Deadline',
        date: ch.end_date,
        classroomId: ch.classroom_id,
        classroomName: classroomMap.get(ch.classroom_id) || 'Class',
        status: ch.status,
        meta: { challengeId: ch.id },
      });
    }
  }

  // 4. Fetch Classroom Events
  const { data: events } = await admin
    .from('classroom_events')
    .select('id, title, event_type, event_date, start_time, end_time, description, classroom_id')
    .in('classroom_id', allowedClassroomIds);

  for (const ev of events || []) {
    items.push({
      id: `event-${ev.id}`,
      type: 'event',
      title: ev.title,
      subtitle: ev.event_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      date: ev.event_date,
      time: ev.start_time ? ev.start_time.slice(0, 5) : undefined,
      classroomId: ev.classroom_id,
      classroomName: classroomMap.get(ev.classroom_id) || 'Class',
      meta: {
        eventId: ev.id,
        eventType: ev.event_type,
        startTime: ev.start_time,
        endTime: ev.end_time,
        description: ev.description,
      },
    });
  }

  // 5. Fetch Announcements
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
