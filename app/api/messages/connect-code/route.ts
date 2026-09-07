import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import {
  ensureConnectCode,
  normalizeConnectCode,
  isValidConnectCode,
} from '../../../lib/codes/connect-codes';
import type { MessageThread, SenderRole } from '../../../lib/messages/types';

const ConnectCodeBodySchema = z.object({
  code: z.string().trim().min(3).max(32),
  childName: z.string().trim().max(50).optional(),
  callerRole: z.enum(['teacher', 'parent']).optional(),
  sessionKey: z.string().trim().max(100).optional(),
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

  const user = await getAuthenticatedUser(req);
  if (!user) {
    const sessionKey = searchParams.get('sessionKey') || searchParams.get('email') || '';
    if (sessionKey) {
      const prefix = roleParam === 'teacher' ? 'TCH' : 'PAR';
      const hash = Math.abs(
        sessionKey.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      ).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
      return NextResponse.json({
        code: `${prefix}-${hash}`,
        role: roleParam,
        displayName: roleParam === 'teacher' ? 'Teacher' : 'Parent',
      });
    }

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
    const expectedPrefix = roleParam === 'teacher' ? 'TCH-' : 'PAR-';
    let finalCode = info.code;
    if (!finalCode.startsWith(expectedPrefix)) {
      finalCode = `${expectedPrefix}${finalCode.replace(/^(TCH|PAR)-/, '')}`;
    }
    return NextResponse.json({
      code: finalCode,
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
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`connect-code:${clientIp}`, { maxRequests: 15, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetSeconds) } }
    );
  }

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

  const isTargetTeacher = code.startsWith('TCH');
  const isTargetParent = code.startsWith('PAR');
  const cleanCode = code.replace(/^(TCH|PAR)-/, '');

  const user = await getAuthenticatedUser(req);
  const callerRole = parsed.data.callerRole || (user?.user_metadata?.role as SenderRole) || (user?.user_metadata?.connect_role as SenderRole) || (isTargetTeacher ? 'parent' : 'teacher');

  // Role validation: Teachers can only connect with parents, parents can only connect with teachers
  if (callerRole === 'teacher' && isTargetTeacher) {
    return NextResponse.json(
      { error: 'This code belongs to a teacher. Teachers can only connect with parents.' },
      { status: 400 }
    );
  }
  if (callerRole === 'parent' && isTargetParent) {
    return NextResponse.json(
      { error: 'This code belongs to a parent. Parents can only connect with teachers.' },
      { status: 400 }
    );
  }

  // If user is not authenticated, handle via demo registry & fallback
  if (!user) {
    const demoEntry = DEMO_REGISTRY[code];
    let thread: MessageThread;
    if (isTargetTeacher) {
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

  let targetUserId: string | null = null;
  let targetName: string = isTargetTeacher ? `Teacher (${code})` : `Parent (${code})`;
  let targetClassroomId: string | null = null;
  const targetChildId: string | null = null;
  let churchOrOrg: string | null = null;

  // 1. Check parent_teacher_connect_codes table (PRIMARY SOURCE OF TRUTH)
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
    /* Table query fallback */
  }

  // 1b. Check current caller's metadata (instant resolution when testing both roles on one account)
  if (!targetUserId && user) {
    const myMeta = user.user_metadata || {};
    const myTeacherCode = (myMeta.teacher_connect_code as string)?.toUpperCase();
    const myParentCode = (myMeta.parent_connect_code as string)?.toUpperCase();
    const myTeacherCodeLegacy = (myMeta.teacher_code as string)?.toUpperCase();
    const myParentCodeLegacy = (myMeta.parent_code as string)?.toUpperCase();
    const myLegacyCode = (myMeta.connect_code as string)?.toUpperCase();

    if (
      code === myTeacherCode ||
      code === myParentCode ||
      code === myTeacherCodeLegacy ||
      code === myParentCodeLegacy ||
      code === myLegacyCode
    ) {
      targetUserId = user.id;
      targetName = callerName;
    }
  }

  // 2. Search auth.users via admin client by exact connect_code
  if (!targetUserId) {
    try {
      const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const allUsers = listData?.users || [];

      // Look ONLY for an exact match to this code across all user metadata code fields
      const matchedUser = allUsers.find(
        (u) =>
          (u.user_metadata?.connect_code as string)?.toUpperCase() === code ||
          (u.user_metadata?.teacher_connect_code as string)?.toUpperCase() === code ||
          (u.user_metadata?.parent_connect_code as string)?.toUpperCase() === code ||
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

        // Sync to parent_teacher_connect_codes table so subsequent lookups are instant
        try {
          await admin.from('parent_teacher_connect_codes').upsert(
            {
              user_id: matchedUser.id,
              role: isTargetTeacher ? 'teacher' : 'parent',
              code,
              display_name: targetName,
            },
            { onConflict: 'user_id,role' }
          );
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.error('Error listing auth users for connect code:', err);
    }
  }

  // 3. Check classrooms table by join code (if teacher shared class code)
  if (!targetUserId && !targetClassroomId) {
    try {
      const { data: cls } = await admin
        .from('classrooms')
        .select('id, name, teacher_id, church_or_org')
        .in('code', [cleanCode, code])
        .maybeSingle();

      if (cls) {
        targetClassroomId = cls.id;
        churchOrOrg = cls.church_or_org || null;
        targetUserId = cls.teacher_id;
        targetName = cls.name;
      }
    } catch {
      /* ignore */
    }
  }

  // 4. Check DEMO_REGISTRY fallback
  if (!targetUserId) {
    const demoEntry = DEMO_REGISTRY[code];
    if (demoEntry) {
      targetName = demoEntry.name;
      churchOrOrg = demoEntry.churchOrOrg || null;
      targetUserId = isTargetTeacher
        ? '00000000-0000-0000-0000-000000000004'
        : '00000000-0000-0000-0000-000000000003';
    }
  }

  // 5. IF STILL NOT FOUND: Return 404 error! NEVER reassign another user's account!
  if (!targetUserId) {
    return NextResponse.json(
      { error: `No account found with connect code "${code}". Please verify the code with your parent/teacher.` },
      { status: 404 }
    );
  }

  const isSelf = targetUserId === user.id;
  const teacherId = isTargetTeacher ? targetUserId : user.id;
  const parentId = isTargetTeacher ? user.id : targetUserId;
  const teacherName = isTargetTeacher ? targetName : (isSelf ? `${callerName} (Teacher)` : callerName);
  const parentName = isTargetTeacher ? (isSelf ? `${callerName} (Parent)` : callerName) : targetName;

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
