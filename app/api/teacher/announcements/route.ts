import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { notifyChildOnce, notifyOnce } from '../../../lib/activity/server';

const CreateAnnouncementSchema = z.object({
  classroomId: z.string().uuid(),
  title: z.string().trim().min(1, 'Title is required').max(120),
  message: z.string().trim().min(1, 'Message is required').max(2000),
  eventDate: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get('classroomId');

  const admin = createServerAdminClient();
  let query = admin
    .from('classroom_announcements')
    .select('*, classrooms!inner(name)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  if (classroomId) {
    query = query.eq('classroom_id', classroomId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Could not load announcements.' }, { status: 500 });
  }

  return NextResponse.json({ announcements: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = CreateAnnouncementSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid announcement details.' }, { status: 400 });
  }

  const admin = createServerAdminClient();

  // Verify teacher owns classroom
  const { data: classroom } = await admin
    .from('classrooms')
    .select('id, name')
    .eq('id', parsed.data.classroomId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!classroom) {
    return NextResponse.json({ error: 'Classroom not found or unauthorized.' }, { status: 403 });
  }

  // Teacher display name
  const teacherName = (user.user_metadata?.name || user.user_metadata?.full_name || 'your teacher') as string;

  // Insert announcement record
  const { data: announcement, error: insertError } = await admin
    .from('classroom_announcements')
    .insert({
      teacher_id: user.id,
      classroom_id: parsed.data.classroomId,
      title: parsed.data.title,
      message: parsed.data.message,
      event_date: parsed.data.eventDate || null,
    })
    .select()
    .single();

  if (insertError || !announcement) {
    return NextResponse.json({ error: 'Could not save announcement.' }, { status: 500 });
  }

  // Fan out notification to all approved students in this classroom
  const { data: students } = await admin
    .from('classroom_students')
    .select('child_id')
    .eq('classroom_id', parsed.data.classroomId)
    .eq('approved', true);

  const studentIds = (students || []).map((s) => s.child_id);
  const nowIso = new Date().toISOString();

  for (const childId of studentIds) {
    await notifyChildOnce(admin, {
      childId,
      type: 'TEACHER_ANNOUNCEMENT',
      title: `New announcement from ${teacherName}`,
      body: `${parsed.data.title}: ${parsed.data.message.slice(0, 100)}${parsed.data.message.length > 100 ? '…' : ''}`,
      payload: {
        announcementId: announcement.id,
        title: parsed.data.title,
        message: parsed.data.message,
        classroomName: classroom.name,
        teacherName,
        eventDate: parsed.data.eventDate || null,
        createdAt: nowIso,
      },
      dedupeKey: `announcement_child:${announcement.id}:${childId}`,
    }).catch(() => {});
  }

  // Fan out notification to parents of students in this classroom (Feature 12)
  if (studentIds.length > 0) {
    try {
      const { data: childrenWithFamily } = await admin
        .from('children')
        .select('id, name, family_id, families(owner_id)')
        .in('id', studentIds);

      const notifiedOwners = new Set<string>();
      for (const ch of childrenWithFamily || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ownerId = (ch.families as any)?.owner_id;
        if (ownerId && !notifiedOwners.has(ownerId)) {
          notifiedOwners.add(ownerId);
          await notifyOnce(admin, {
            recipientId: ownerId,
            childId: ch.id,
            type: 'TEACHER_ANNOUNCEMENT',
            title: `${classroom.name}: ${parsed.data.title}`,
            body: `${teacherName}: “${parsed.data.message.slice(0, 120)}${parsed.data.message.length > 120 ? '…' : ''}”`,
            payload: {
              announcementId: announcement.id,
              classroomId: classroom.id,
              classroomName: classroom.name,
              teacherName,
            },
            dedupeKey: `announcement_parent:${announcement.id}:${ownerId}`,
          }).catch(() => {});
        }
      }
    } catch {
      /* Best effort notification delivery */
    }
  }

  return NextResponse.json({
    success: true,
    announcement,
    deliveredCount: studentIds.length,
  });
}
