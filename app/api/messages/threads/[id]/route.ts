import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import type { ChatMessage } from '../../../../lib/messages/types';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to access messages.' }, { status: 401 });
  }

  const { id: threadId } = await context.params;
  if (!threadId) {
    return NextResponse.json({ error: 'Thread ID is required.' }, { status: 400 });
  }

  try {
    const admin = createServerAdminClient();

    // 1. Check thread in DB
    let thread: any = null;
    try {
      const { data: threadData } = await admin
        .from('parent_teacher_threads')
        .select('id, classroom_id, child_id, parent_id, teacher_id, last_message_at, classrooms(name, church_or_org), children(name)')
        .eq('id', threadId)
        .maybeSingle();
      thread = threadData;
    } catch {
      // Table may not exist yet
    }

    // 2. Fetch messages in chronological order
    let messagesData: any[] = [];
    try {
      const { data: dbMessages } = await admin
        .from('parent_teacher_messages')
        .select('id, thread_id, sender_id, sender_role, body, read, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(150);
      messagesData = dbMessages || [];
    } catch {
      // Table may not exist yet
    }

    const messages: ChatMessage[] = (messagesData || []).map((m) => ({
      id: m.id,
      threadId: m.thread_id,
      senderId: m.sender_id,
      senderRole: m.sender_role as 'parent' | 'teacher',
      body: m.body,
      read: m.read,
      createdAt: m.created_at,
    }));

    // 3. Mark unread messages as read for this caller if DB exists
    if (thread) {
      const isCallerTeacher = thread.teacher_id === user.id;
      try {
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
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ thread, messages });
  } catch (err: unknown) {
    console.error('Error in GET /api/messages/threads/[id]:', err);
    return NextResponse.json({ thread: null, messages: [] });
  }
}
