import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import {
  ensureConnectCode,
  normalizeConnectCode,
  isValidConnectCode,
} from '../../../lib/codes/connect-codes';
import type { MessageThread, SenderRole } from '../../../lib/messages/types';

const ConnectCodeBodySchema = z.object({
  code: z.string().trim().min(3).max(32),
  childName: z.string().trim().max(50).optional(),
});

// Demo fallback registry
const DEMO_REGISTRY: Record<
  string,
  {
    role: SenderRole;
    name: string;
    childName?: string;
    classroomName?: string;
    churchOrOrg?: string;
  }
> = {
  'TCH-GRACE26': {
    role: 'teacher',
    name: 'Teacher Grace',
    classroomName: 'Wednesday Explorers',
    churchOrOrg: 'Grace Community Church',
  },
  'TCH-DAVID88': {
    role: 'teacher',
    name: 'Pastor David',
    classroomName: 'Sunday Kingdom Kids',
    churchOrOrg: 'First Baptist Fellowship',
  },
  'PAR-JORDAN26': {
    role: 'parent',
    name: 'Jordan Adeyemi',
    childName: 'Amara Adeyemi',
    churchOrOrg: 'Grace Community Church',
  },
  'PAR-CHIDI93': {
    role: 'parent',
    name: 'Chidi K.',
    childName: 'Mia K.',
    churchOrOrg: 'Grace Community Church',
  },
  'PAR-SARAH15': {
    role: 'parent',
    name: 'Sarah B.',
    childName: 'Noah B.',
    churchOrOrg: 'Grace Community Church',
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get('role') === 'parent' ? 'parent' : 'teacher';

  const user = await getAuthenticatedUser();
  if (!user) {
    // Return standard demo code for unauthenticated / local preview mode
    if (roleParam === 'teacher') {
      return NextResponse.json({
        code: 'TCH-GRACE26',
        role: 'teacher',
        displayName: 'Teacher Grace',
      });
    }
    return NextResponse.json({
      code: 'PAR-JORDAN26',
      role: 'parent',
      displayName: 'Jordan Adeyemi',
    });
  }

  const admin = createServerAdminClient();
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (roleParam === 'teacher' ? 'Teacher' : 'Parent');

  try {
    const info = await ensureConnectCode(admin, user.id, roleParam, displayName);
    return NextResponse.json({
      code: info.code,
      role: roleParam,
      displayName: info.displayName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.json().catch(() => null);
  const parsed = ConnectCodeBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a valid connect code.' },
      { status: 400 }
    );
  }

  const code = normalizeConnectCode(parsed.data.code);
  if (!isValidConnectCode(code)) {
    return NextResponse.json(
      { error: 'Invalid connect code format. Example: TCH-GRACE26 or PAR-JORDAN26' },
      { status: 400 }
    );
  }

  const user = await getAuthenticatedUser();

  // If user is not authenticated or in demo mode, handle via demo registry & fallback
  if (!user) {
    const demoEntry = DEMO_REGISTRY[code];
    const isTeacherCode = code.startsWith('TCH') || demoEntry?.role === 'teacher';

    let thread: MessageThread;
    if (isTeacherCode) {
      const teacherName = demoEntry?.name || `Teacher (${code})`;
      const className = demoEntry?.classroomName || 'Sunday School Class';
      thread = {
        id: `demo-thread-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        classroomId: `demo-class-${code.toLowerCase()}`,
        classroomName: className,
        childId: 'demo-child-1',
        childName: parsed.data.childName || 'Amara Adeyemi',
        parentId: 'demo-parent-1',
        parentName: 'Jordan Adeyemi',
        teacherId: `demo-teacher-${code.toLowerCase()}`,
        teacherName,
        lastMessageAt: new Date().toISOString(),
        lastMessageSnippet: 'Connected via Teacher Code',
        unreadCount: 0,
        otherPartyName: teacherName,
        otherPartyRole: 'teacher',
        churchOrOrg: demoEntry?.churchOrOrg || 'Community Church',
      };
    } else {
      const parentName = demoEntry?.name || `Parent (${code})`;
      const childName = demoEntry?.childName || parsed.data.childName || 'Student';
      thread = {
        id: `demo-thread-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        classroomId: 'demo-class-1',
        classroomName: 'Wednesday Explorers',
        childId: `demo-child-${code.toLowerCase()}`,
        childName,
        parentId: `demo-parent-${code.toLowerCase()}`,
        parentName,
        teacherId: 'demo-teacher-1',
        teacherName: 'Teacher Grace',
        lastMessageAt: new Date().toISOString(),
        lastMessageSnippet: 'Connected via Parent Code',
        unreadCount: 0,
        otherPartyName: parentName,
        otherPartyRole: 'parent',
        churchOrOrg: demoEntry?.churchOrOrg || 'Community Church',
      };
    }

    return NextResponse.json({
      success: true,
      message: `Connected successfully with ${thread.otherPartyName}!`,
      thread,
    });
  }

  // Live Supabase lookup
  const admin = createServerAdminClient();

  const { data: targetCodeRow } = await admin
    .from('parent_teacher_connect_codes')
    .select('user_id, role, display_name, classroom_id')
    .eq('code', code)
    .maybeSingle();

  if (!targetCodeRow) {
    // Check if it matches demo codes for seamless dev experience
    const demoEntry = DEMO_REGISTRY[code];
    if (demoEntry) {
      const isTeacher = demoEntry.role === 'teacher';
      const thread: MessageThread = {
        id: `thread-${code.toLowerCase()}`,
        classroomId: '00000000-0000-0000-0000-000000000001',
        classroomName: demoEntry.classroomName || 'Classroom',
        childId: '00000000-0000-0000-0000-000000000002',
        childName: demoEntry.childName || 'Student',
        parentId: isTeacher ? user.id : '00000000-0000-0000-0000-000000000003',
        parentName: isTeacher ? (user.user_metadata?.full_name || 'Parent') : demoEntry.name,
        teacherId: isTeacher ? '00000000-0000-0000-0000-000000000004' : user.id,
        teacherName: isTeacher ? demoEntry.name : (user.user_metadata?.full_name || 'Teacher'),
        lastMessageAt: new Date().toISOString(),
        lastMessageSnippet: 'Connected via Connect Code',
        unreadCount: 0,
        otherPartyName: demoEntry.name,
        otherPartyRole: demoEntry.role,
        churchOrOrg: demoEntry.churchOrOrg || null,
      };
      return NextResponse.json({
        success: true,
        message: `Connected with ${demoEntry.name}!`,
        thread,
      });
    }

    return NextResponse.json(
      { error: "We couldn't find an active account with that connect code. Please check and try again." },
      { status: 404 }
    );
  }

  if (targetCodeRow.user_id === user.id) {
    return NextResponse.json(
      { error: 'You cannot connect to your own connect code.' },
      { status: 400 }
    );
  }

  const isTargetTeacher = targetCodeRow.role === 'teacher';
  const teacherId = isTargetTeacher ? targetCodeRow.user_id : user.id;
  const parentId = isTargetTeacher ? user.id : targetCodeRow.user_id;

  // Find or create classroom
  let classroomId = targetCodeRow.classroom_id;
  let classroomName = 'Sunday School';
  if (!classroomId) {
    const { data: cls } = await admin
      .from('classrooms')
      .select('id, name')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cls) {
      classroomId = cls.id;
      classroomName = cls.name;
    }
  }

  // Find or create child record if needed
  let childId: string | null = null;
  let childName = parsed.data.childName || 'Student';
  const { data: childRow } = await admin
    .from('children')
    .select('id, name')
    .eq('parent_id', parentId)
    .limit(1)
    .maybeSingle();

  if (childRow) {
    childId = childRow.id;
    childName = childRow.name;
  }

  // Upsert thread in parent_teacher_threads
  if (classroomId && childId) {
    const { data: existingThread } = await admin
      .from('parent_teacher_threads')
      .select('id, last_message_at, last_message_snippet')
      .eq('classroom_id', classroomId)
      .eq('child_id', childId)
      .eq('parent_id', parentId)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: newThread } = await admin
        .from('parent_teacher_threads')
        .insert({
          classroom_id: classroomId,
          child_id: childId,
          parent_id: parentId,
          teacher_id: teacherId,
          last_message_snippet: 'Connected via Connect Code',
        })
        .select('id')
        .single();
      threadId = newThread?.id;
    }

    const otherName = targetCodeRow.display_name;
    const thread: MessageThread = {
      id: threadId || `thread-${Date.now()}`,
      classroomId,
      classroomName,
      childId,
      childName,
      parentId,
      parentName: isTargetTeacher ? (user.user_metadata?.full_name || 'Parent') : otherName,
      teacherId,
      teacherName: isTargetTeacher ? otherName : (user.user_metadata?.full_name || 'Teacher'),
      lastMessageAt: new Date().toISOString(),
      lastMessageSnippet: 'Connected via Connect Code',
      unreadCount: 0,
      otherPartyName: otherName,
      otherPartyRole: targetCodeRow.role,
      churchOrOrg: null,
    };

    return NextResponse.json({
      success: true,
      message: `Connected with ${otherName}!`,
      thread,
    });
  }

  // Fallback response with synthetic thread details if classroom or child record wasn't pre-configured
  const otherName = targetCodeRow.display_name;
  const thread: MessageThread = {
    id: `thread-${Date.now()}`,
    classroomId: classroomId || '00000000-0000-0000-0000-000000000000',
    classroomName,
    childId: childId || '00000000-0000-0000-0000-000000000000',
    childName,
    parentId,
    parentName: isTargetTeacher ? (user.user_metadata?.full_name || 'Parent') : otherName,
    teacherId,
    teacherName: isTargetTeacher ? otherName : (user.user_metadata?.full_name || 'Teacher'),
    lastMessageAt: new Date().toISOString(),
    lastMessageSnippet: 'Connected via Connect Code',
    unreadCount: 0,
    otherPartyName: otherName,
    otherPartyRole: targetCodeRow.role,
    churchOrOrg: null,
  };

  return NextResponse.json({
    success: true,
    message: `Connected with ${otherName}!`,
    thread,
  });
}
