import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';

const CreateEventSchema = z.object({
  classroomId: z.string().uuid(),
  title: z.string().trim().min(1, 'Title is required').max(120),
  eventType: z.enum(['bible_study', 'sunday_school', 'youth_meeting', 'scripture_challenge', 'review', 'other']),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date in YYYY-MM-DD format is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
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
    .from('classroom_events')
    .select('*')
    .eq('teacher_id', user.id)
    .order('event_date', { ascending: true });

  if (classroomId) {
    query = query.eq('classroom_id', classroomId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Could not load events.' }, { status: 500 });
  }

  return NextResponse.json({ events: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = CreateEventSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid event details.' }, { status: 400 });
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

  const { data: event, error: insertError } = await admin
    .from('classroom_events')
    .insert({
      teacher_id: user.id,
      classroom_id: parsed.data.classroomId,
      title: parsed.data.title,
      event_type: parsed.data.eventType,
      event_date: parsed.data.eventDate,
      start_time: parsed.data.startTime || null,
      end_time: parsed.data.endTime || null,
      description: parsed.data.description || null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Could not create event.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, event });
}
