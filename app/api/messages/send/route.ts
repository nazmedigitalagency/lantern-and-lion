import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import type { ChatMessage } from '../../../lib/messages/types';

const SendMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  classroomId: z.string().uuid().optional(),
  childId: z.string().uuid().optional(),
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long (max 2000 characters)'),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to send messages.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid message payload' }, { status: 400 });
  }

  const { threadId, classroomId, childId, body } = parsed.data;

  try {
    const admin = createServerAdminClient();
    let targetThreadId = threadId;
    let thread: any = null;

    if (targetThreadId) {
      const { data: found } = await admin
        .from('parent_teacher_threads')
        .select('*')
        .eq('id', targetThreadId)
        .maybeSingle();
      thread = found;
    } else if (classroomId && childId) {
      // Find or create thread by classroomId + childId
      const { data: found } = await admin
        .from('parent_teacher_threads')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('child_id', childId)
        .or(`parent_id.eq.${user.id},teacher_id.eq.${user.id}`)
        .maybeSingle();

      if (found) {
        thread = found;
        targetThreadId = found.id;
      } else {
        // Need to create thread
        // Determine whether caller is teacher or parent
        const { data: classroom } = await admin.from('classrooms').select('id, teacher_id').eq('id', classroomId).maybeSingle();
        if (!classroom) return NextResponse.json({ error: 'Classroom not found.' }, { status: 404 });

        const isTeacher = classroom.teacher_id === user.id;
        let parentId: string | null = null;
        let teacherId: string = classroom.teacher_id;

        if (isTeacher) {
          const { data: child } = await admin.from('children').select('id, family_id').eq('id', childId).maybeSingle();
          if (!child) return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
          const { data: fam } = await admin.from('families').select('owner_id').eq('id', child.family_id).maybeSingle();
          parentId = fam?.owner_id || null;
        } else {
          parentId = user.id;
        }

        if (!parentId || !teacherId) {
          return NextResponse.json({ error: 'Unable to resolve conversation participants.' }, { status: 400 });
        }

        const { data: newThread, error: createErr } = await admin
          .from('parent_teacher_threads')
          .insert({
            classroom_id: classroomId,
            child_id: childId,
            parent_id: parentId,
            teacher_id: teacherId,
            last_message_at: new Date().toISOString(),
            last_message_snippet: body.slice(0, 100),
          })
          .select('*')
          .single();

        if (createErr || !newThread) {
          return NextResponse.json({ error: 'Failed to create conversation thread.' }, { status: 500 });
        }

        thread = newThread;
        targetThreadId = newThread.id;
      }
    }

    if (!thread || !targetThreadId) {
      return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
    }

    // Verify caller authorization
    if (thread.parent_id !== user.id && thread.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to post in this thread.' }, { status: 403 });
    }

    const senderRole: 'parent' | 'teacher' = thread.teacher_id === user.id ? 'teacher' : 'parent';

    // Insert message
    const { data: insertedMsg, error: insertErr } = await admin
      .from('parent_teacher_messages')
      .insert({
        thread_id: targetThreadId,
        sender_id: user.id,
        sender_role: senderRole,
        body,
        read: false,
      })
      .select('*')
      .single();

    if (insertErr || !insertedMsg) {
      return NextResponse.json({ error: 'Failed to deliver message.' }, { status: 500 });
    }

    // Update thread snippet and increment recipient unread count
    const updatePayload: Record<string, any> = {
      last_message_at: new Date().toISOString(),
      last_message_snippet: body.slice(0, 100),
    };
    if (senderRole === 'teacher') {
      updatePayload.parent_unread_count = (thread.parent_unread_count || 0) + 1;
    } else {
      updatePayload.teacher_unread_count = (thread.teacher_unread_count || 0) + 1;
    }

    await admin
      .from('parent_teacher_threads')
      .update(updatePayload)
      .eq('id', targetThreadId);

    const message: ChatMessage = {
      id: insertedMsg.id,
      threadId: insertedMsg.thread_id,
      senderId: insertedMsg.sender_id,
      senderRole: insertedMsg.sender_role as 'parent' | 'teacher',
      body: insertedMsg.body,
      read: insertedMsg.read,
      createdAt: insertedMsg.created_at,
    };

    return NextResponse.json({ success: true, message, threadId: targetThreadId });
  } catch (err: unknown) {
    console.error('Error in POST /api/messages/send:', err);
    return NextResponse.json({ error: 'Server error sending message.' }, { status: 500 });
  }
}
