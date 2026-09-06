import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';

const ReadSchema = z.object({
  threadId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to update read status.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = ReadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid threadId is required.' }, { status: 400 });
  }

  const { threadId } = parsed.data;

  try {
    const admin = createServerAdminClient();

    const { data: thread } = await admin
      .from('parent_teacher_threads')
      .select('id, parent_id, teacher_id')
      .eq('id', threadId)
      .maybeSingle();

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
    }

    if (thread.parent_id !== user.id && thread.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const isCallerTeacher = thread.teacher_id === user.id;

    if (isCallerTeacher) {
      await admin
        .from('parent_teacher_threads')
        .update({ teacher_unread_count: 0 })
        .eq('id', threadId);
      await admin
        .from('parent_teacher_messages')
        .update({ read: true })
        .eq('thread_id', threadId)
        .eq('sender_role', 'parent')
        .eq('read', false);
    } else {
      await admin
        .from('parent_teacher_threads')
        .update({ parent_unread_count: 0 })
        .eq('id', threadId);
      await admin
        .from('parent_teacher_messages')
        .update({ read: true })
        .eq('thread_id', threadId)
        .eq('sender_role', 'teacher')
        .eq('read', false);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error in POST /api/messages/read:', err);
    return NextResponse.json({ error: 'Failed to update read state.' }, { status: 500 });
  }
}
