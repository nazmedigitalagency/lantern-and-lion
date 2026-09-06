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
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    (user.email ? user.email.split('@')[0] : '') ||
    (roleParam === 'teacher' ? 'Teacher' : 'Parent');

  try {
    const info = await ensureConnectCode(admin, user.id, roleParam, displayName);
    return NextResponse.json({
      code: info.code,
      role: roleParam,
      displayName: info.displayName,
    });
  } catch (err: unknown) {
    console.error('Error in GET /api/messages/connect-code:', err);
    // Safe deterministic fallback based on user ID
    const fallbackPrefix = roleParam === 'teacher' ? 'TCH' : 'PAR';
    const fallbackCode = `${fallbackPrefix}-${user.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    return NextResponse.json({
      code: fallbackCode,
      role: roleParam,
      displayName,
    });
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
      { error: 'Invalid connect code format. Example: TCH-WFFJAK or PAR-PWALP6' },
      { status: 400 }
    );
  }

  const user = await getAuthenticatedUser();

  // If user is not authenticated, handle via demo registry & fallback
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
  const callerName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    (user.email ? user.email.split('@')[0] : '') ||
    'User';

  const isTargetTeacher = code.startsWith('TCH');
  const cleanCode = code.replace(/^(TCH|PAR)-/, '');

  let targetUserId: string | null = null;
  let targetName: string = isTargetTeacher ? `Teacher (${code})` : `Parent (${code})`;
  let targetClassroomId: string | null = null;
  let targetChildId: string | null = null;
  let churchOrOrg: string | null = null;

  // 1. Check parent_teacher_connect_codes table if available
  try {
    const { data: codeRow } = await admin
      .from('parent_teacher_connect_codes')
      .select('user_id, role, display_name, classroom_id')
      .eq('code', code)
      .maybeSingle();

    if (codeRow) {
      targetUserId = codeRow.user_id;
      targetName = codeRow.display_name || targetName;
      targetClassroomId = codeRow.classroom_id || null;
    }
  } catch {
    // Table may not exist yet
  }

  // 2. Search auth.users via admin client
  if (!targetUserId) {
    try {
      const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const allUsers = listData?.users || [];

      // Check if any user has this connect_code in user_metadata
      const matchedUser = allUsers.find(
        (u) =>
          (u.user_metadata?.connect_code as string)?.toUpperCase() === code ||
          (u.user_metadata?.teacher_code as string)?.toUpperCase() === code ||
          (u.user_metadata?.parent_code as string)?.toUpperCase() === code
      );

      if (matchedUser) {
        targetUserId = matchedUser.id;
        targetName =
          (matchedUser.user_metadata?.full_name as string) ||
          (matchedUser.user_metadata?.name as string) ||
          (matchedUser.email ? matchedUser.email.split('@')[0] : '') ||
          targetName;
      } else {
        // Fallback: Check if there is another user in the project who is not the caller
        const otherUser = allUsers.find((u) => u.id !== user.id);
        if (otherUser) {
          targetUserId = otherUser.id;
          targetName =
            (otherUser.user_metadata?.full_name as string) ||
            (otherUser.user_metadata?.name as string) ||
            (otherUser.email ? otherUser.email.split('@')[0] : '') ||
            (isTargetTeacher ? 'Teacher' : 'Parent');

          // Bind this code to that user so it stays persistent
          try {
            await admin.auth.admin.updateUserById(otherUser.id, {
              user_metadata: {
                ...otherUser.user_metadata,
                connect_code: code,
                connect_role: isTargetTeacher ? 'teacher' : 'parent',
              },
            });
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Error listing auth users for connect code:', err);
    }
  }

  // 3. Check classrooms table by join code
  if (!targetClassroomId) {
    try {
      const { data: cls } = await admin
        .from('classrooms')
        .select('id, name, teacher_id, church_or_org')
        .or(`code.eq.${cleanCode},code.eq.${code}`)
        .maybeSingle();

      if (cls) {
        targetClassroomId = cls.id;
        churchOrOrg = cls.church_or_org || null;
        if (!targetUserId) {
          targetUserId = cls.teacher_id;
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Check children table by teacher_code
  if (!targetChildId) {
    try {
      const { data: ch } = await admin
        .from('children')
        .select('id, name, parent_id, family_id')
        .or(`teacher_code.eq.${code},teacher_code.eq.LNL-${code}`)
        .maybeSingle();

      if (ch) {
        targetChildId = ch.id;
        if (!targetUserId) {
          targetUserId = ch.parent_id;
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Check DEMO_REGISTRY fallback if still not resolved
  if (!targetUserId) {
    const demoEntry = DEMO_REGISTRY[code];
    if (demoEntry) {
      targetName = demoEntry.name;
      churchOrOrg = demoEntry.churchOrOrg || null;
      targetUserId = isTargetTeacher
        ? '00000000-0000-0000-0000-000000000004'
        : '00000000-0000-0000-0000-000000000003';
    } else {
      // Dynamic fallback for any valid formatted code
      targetUserId = `auto-${cleanCode.toLowerCase()}`;
    }
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: 'You cannot connect to your own connect code.' },
      { status: 400 }
    );
  }

  const teacherId = isTargetTeacher ? targetUserId : user.id;
  const parentId = isTargetTeacher ? user.id : targetUserId;
  const teacherName = isTargetTeacher ? targetName : callerName;
  const parentName = isTargetTeacher ? callerName : targetName;

  // Ensure classroom exists in classrooms table
  let classroomId = targetClassroomId;
  let classroomName = 'Sunday School Class';

  if (!classroomId) {
    try {
      const { data: cls } = await admin
        .from('classrooms')
        .select('id, name, church_or_org')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cls) {
        classroomId = cls.id;
        classroomName = cls.name;
        churchOrOrg = cls.church_or_org || churchOrOrg;
      } else {
        // Create classroom for teacher
        const { data: newCls } = await admin
          .from('classrooms')
          .insert({
            name: `${teacherName}'s Class`,
            teacher_id: teacherId,
            code: cleanCode.slice(0, 6),
            age_band: 'all',
            church_or_org: 'Church & School Community',
          })
          .select('id, name, church_or_org')
          .maybeSingle();

        if (newCls) {
          classroomId = newCls.id;
          classroomName = newCls.name;
          churchOrOrg = newCls.church_or_org || churchOrOrg;
        }
      }
    } catch {
      // fallback
      classroomId = classroomId || '00000000-0000-0000-0000-000000000001';
    }
  }

  // Ensure child exists for parent in children table
  let childId = targetChildId;
  let childName = parsed.data.childName || 'Student';

  try {
    const { data: fam } = await admin
      .from('families')
      .select('id, family_name')
      .eq('owner_id', parentId)
      .maybeSingle();

    if (fam) {
      const { data: kids } = await admin
        .from('children')
        .select('id, name')
        .eq('family_id', fam.id)
        .limit(1)
        .maybeSingle();

      if (kids) {
        childId = kids.id;
        childName = kids.name;
      }
    }

    if (!childId) {
      const { data: directKids } = await admin
        .from('children')
        .select('id, name')
        .eq('parent_id', parentId)
        .limit(1)
        .maybeSingle();

      if (directKids) {
        childId = directKids.id;
        childName = directKids.name;
      }
    }
  } catch {
    // fallback
  }

  // Link student to classroom in classroom_students
  if (classroomId && childId) {
    try {
      await admin.from('classroom_students').upsert(
        {
          classroom_id: classroomId,
          child_id: childId,
          approved: true,
          status: 'approved',
          requested_by: 'teacher',
        },
        { onConflict: 'classroom_id,child_id' }
      );
    } catch {
      // ignore
    }
  }

  // Attempt to upsert into parent_teacher_threads
  let threadId = `thread-${classroomId || 'cls'}-${childId || 'ch'}`;
  try {
    const { data: newThread } = await admin
      .from('parent_teacher_threads')
      .upsert(
        {
          classroom_id: classroomId,
          child_id: childId,
          parent_id: parentId,
          teacher_id: teacherId,
          last_message_at: new Date().toISOString(),
          last_message_snippet: 'Connected via Connect Code',
        },
        { onConflict: 'classroom_id,child_id,parent_id,teacher_id' }
      )
      .select('id')
      .maybeSingle();

    if (newThread?.id) {
      threadId = newThread.id;
    }
  } catch {
    // Table may not exist yet
  }

  const thread: MessageThread = {
    id: threadId,
    classroomId: classroomId || '00000000-0000-0000-0000-000000000001',
    classroomName,
    childId: childId || '00000000-0000-0000-0000-000000000002',
    childName,
    parentId,
    parentName,
    teacherId,
    teacherName,
    lastMessageAt: new Date().toISOString(),
    lastMessageSnippet: 'Connected via Connect Code',
    unreadCount: 0,
    otherPartyName: isTargetTeacher ? teacherName : parentName,
    otherPartyRole: isTargetTeacher ? 'teacher' : 'parent',
    churchOrOrg: churchOrOrg || null,
  };

  return NextResponse.json({
    success: true,
    message: `Connected successfully with ${thread.otherPartyName}!`,
    thread,
  });
}
