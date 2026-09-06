import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import type { ChatMessage } from '../../../lib/messages/types';

const SendMessageSchema = z.object({
  threadId: z.string().trim().min(1).optional(),
  classroomId: z.string().trim().min(1).optional(),
  childId: z.string().trim().min(1).optional(),
  senderRole: z.enum(['teacher', 'parent']).optional(),
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long (max 2000 characters)'),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to send messages.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid message payload' }, { status: 400 });
  }

  const { threadId, classroomId, childId, body, senderRole: requestedSenderRole } = parsed.data;

  try {
    const admin = createServerAdminClient();
    let targetThreadId = threadId || `thread-${classroomId || 'cls'}-${childId || 'ch'}`;
    let thread: any = null;

    try {
      if (threadId) {
        const { data: found } = await admin
          .from('parent_teacher_threads')
          .select('*')
          .eq('id', targetThreadId)
          .maybeSingle();
        thread = found;
      } else if (classroomId && childId) {
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
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Determine sender role - prioritize explicit senderRole from caller context
    let senderRole: 'parent' | 'teacher' = 'parent';
    if (requestedSenderRole) {
      senderRole = requestedSenderRole;
    } else if (thread?.teacher_id === user.id && thread?.parent_id !== user.id) {
      senderRole = 'teacher';
    } else if (user.user_metadata?.connect_role === 'teacher') {
      senderRole = 'teacher';
    } else {
      // Check if user is a teacher of any classroom
      try {
        const { data: teacherClassrooms } = await admin.from('classrooms').select('id').eq('teacher_id', user.id).limit(1);
        if (teacherClassrooms && teacherClassrooms.length > 0) {
          senderRole = 'teacher';
        }
      } catch {
        // ignore
      }
    }

    // Keep thread teacher_id / parent_id consistent if missing
    if (thread) {
      try {
        if (senderRole === 'teacher' && !thread.teacher_id) {
          await admin.from('parent_teacher_threads').update({ teacher_id: user.id }).eq('id', targetThreadId);
        } else if (senderRole === 'parent' && !thread.parent_id) {
          await admin.from('parent_teacher_threads').update({ parent_id: user.id }).eq('id', targetThreadId);
        }
      } catch {
        // ignore
      }
    }

    // Insert message into DB if parent_teacher_messages table exists
    let insertedMsg: any = null;
    try {
      const { data: dbMsg } = await admin
        .from('parent_teacher_messages')
        .insert({
          thread_id: targetThreadId,
          sender_id: user.id,
          sender_role: senderRole,
          body,
          read: false,
        })
        .select('*')
        .maybeSingle();
      insertedMsg = dbMsg;
    } catch {
      // Table may not exist yet
    }

    // Update parent_teacher_threads if exists
    try {
      const updatePayload: Record<string, any> = {
        last_message_at: new Date().toISOString(),
        last_message_snippet: body.slice(0, 100),
      };
      if (senderRole === 'teacher') {
        updatePayload.parent_unread_count = (thread?.parent_unread_count || 0) + 1;
      } else {
        updatePayload.teacher_unread_count = (thread?.teacher_unread_count || 0) + 1;
      }

      await admin
        .from('parent_teacher_threads')
        .update(updatePayload)
        .eq('id', targetThreadId);
    } catch {
      // ignore
    }

    const message: ChatMessage = {
      id: insertedMsg?.id || `msg-${Date.now()}`,
      threadId: targetThreadId,
      senderId: user.id,
      senderRole,
      body,
      read: false,
      createdAt: insertedMsg?.created_at || new Date().toISOString(),
    };

    return NextResponse.json({ success: true, message, threadId: targetThreadId });
  } catch (err: unknown) {
    console.error('Error in POST /api/messages/send:', err);
    return NextResponse.json({ error: 'Server error sending message.' }, { status: 500 });
  }
}
