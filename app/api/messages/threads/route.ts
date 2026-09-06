import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import type { MessageThread } from '../../../lib/messages/types';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to access messages.' }, { status: 401 });
  }

  try {
    const admin = createServerAdminClient();

    // 1. Check if user is a teacher with classrooms
    const { data: teacherClassrooms } = await admin
      .from('classrooms')
      .select('id, name, church_or_org')
      .eq('teacher_id', user.id);
    const isTeacher = (teacherClassrooms || []).length > 0;

    // 2. Check if user is a parent owning a family
    const { data: family } = await admin
      .from('families')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();
    const isParent = !!family;

    // 3. Fetch existing persisted threads for this user (as parent or teacher)
    const threadsMap = new Map<string, any>();
    try {
      const { data: existingThreads } = await admin
        .from('parent_teacher_threads')
        .select('id, classroom_id, child_id, parent_id, teacher_id, last_message_at, last_message_snippet, parent_unread_count, teacher_unread_count, classrooms(name, church_or_org), children(name)')
        .or(`parent_id.eq.${user.id},teacher_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      for (const t of existingThreads || []) {
        const key = `${t.classroom_id}_${t.child_id}_${t.parent_id}_${t.teacher_id}`;
        threadsMap.set(key, t);
      }
    } catch {
      // Table may not exist yet, continue to classroom_students
    }

    // 4. Resolve threads for all approved classroom connections
    // If teacher: find approved students in teacher's classrooms
    if (isTeacher && teacherClassrooms && teacherClassrooms.length > 0) {
      const classIds = teacherClassrooms.map((c) => c.id);
      const { data: approvedStudents } = await admin
        .from('classroom_students')
        .select('classroom_id, child_id, approved, status, children(id, name, family_id), classrooms(id, name, church_or_org)')
        .in('classroom_id', classIds)
        .or('approved.eq.true,status.eq.approved');

      for (const s of approvedStudents || []) {
        const child = s.children as unknown as { id: string; name: string; family_id: string } | null;
        const cls = s.classrooms as unknown as { id: string; name: string; church_or_org: string | null } | null;
        if (!child || !cls) continue;

        const { data: fam } = await admin.from('families').select('owner_id').eq('id', child.family_id).maybeSingle();
        const parentId = fam?.owner_id;
        if (!parentId) continue;

        const key = `${s.classroom_id}_${s.child_id}_${parentId}_${user.id}`;
        if (!threadsMap.has(key)) {
          let threadId = `thread-${s.classroom_id}-${s.child_id}`;
          try {
            const { data: newThread } = await admin
              .from('parent_teacher_threads')
              .insert({
                classroom_id: s.classroom_id,
                child_id: s.child_id,
                parent_id: parentId,
                teacher_id: user.id,
                last_message_at: new Date().toISOString(),
                last_message_snippet: 'Conversation started',
              })
              .select('id, classroom_id, child_id, parent_id, teacher_id, last_message_at, last_message_snippet, parent_unread_count, teacher_unread_count')
              .maybeSingle();

            if (newThread?.id) {
              threadId = newThread.id;
            }
          } catch {
            // fallback
          }

          threadsMap.set(key, {
            id: threadId,
            classroom_id: s.classroom_id,
            child_id: s.child_id,
            parent_id: parentId,
            teacher_id: user.id,
            last_message_at: new Date().toISOString(),
            last_message_snippet: 'Conversation started',
            parent_unread_count: 0,
            teacher_unread_count: 0,
            classrooms: { name: cls.name, church_or_org: cls.church_or_org },
            children: { name: child.name },
          });
        }
      }
    }

    // If parent: find approved classrooms for parent's children
    if (isParent && family) {
      const { data: children } = await admin.from('children').select('id, name').eq('family_id', family.id);
      const childIds = (children || []).map((c) => c.id);
      if (childIds.length > 0) {
        const { data: memberships } = await admin
          .from('classroom_students')
          .select('classroom_id, child_id, approved, status, classrooms(id, name, teacher_id, church_or_org)')
          .in('child_id', childIds)
          .or('approved.eq.true,status.eq.approved');

        for (const m of memberships || []) {
          const cls = m.classrooms as unknown as { id: string; name: string; teacher_id: string; church_or_org: string | null } | null;
          if (!cls || !cls.teacher_id) continue;

          const key = `${m.classroom_id}_${m.child_id}_${user.id}_${cls.teacher_id}`;
          if (!threadsMap.has(key)) {
            const childName = children?.find((c) => c.id === m.child_id)?.name || 'Student';
            let threadId = `thread-${m.classroom_id}-${m.child_id}`;
            try {
              const { data: newThread } = await admin
                .from('parent_teacher_threads')
                .insert({
                  classroom_id: m.classroom_id,
                  child_id: m.child_id,
                  parent_id: user.id,
                  teacher_id: cls.teacher_id,
                  last_message_at: new Date().toISOString(),
                  last_message_snippet: 'Conversation started',
                })
                .select('id, classroom_id, child_id, parent_id, teacher_id, last_message_at, last_message_snippet, parent_unread_count, teacher_unread_count')
                .maybeSingle();

              if (newThread?.id) {
                threadId = newThread.id;
              }
            } catch {
              // fallback
            }

            threadsMap.set(key, {
              id: threadId,
              classroom_id: m.classroom_id,
              child_id: m.child_id,
              parent_id: user.id,
              teacher_id: cls.teacher_id,
              last_message_at: new Date().toISOString(),
              last_message_snippet: 'Conversation started',
              parent_unread_count: 0,
              teacher_unread_count: 0,
              classrooms: { name: cls.name, church_or_org: cls.church_or_org },
              children: { name: childName },
            });
          }
        }
      }
    }

    // Gather unique user IDs to resolve names
    const userIds = new Set<string>();
    for (const t of threadsMap.values()) {
      userIds.add(t.parent_id);
      userIds.add(t.teacher_id);
    }

    const userNameMap = new Map<string, string>();
    for (const uId of userIds) {
      try {
        const { data: u } = await admin.auth.admin.getUserById(uId);
        const name = (u?.user?.user_metadata?.name || u?.user?.user_metadata?.full_name || u?.user?.email?.split('@')[0] || 'User') as string;
        userNameMap.set(uId, name);
      } catch {
        userNameMap.set(uId, 'User');
      }
    }

    // Format final threads
    const formattedThreads: MessageThread[] = Array.from(threadsMap.values()).map((t) => {
      const isCallerTeacher = t.teacher_id === user.id;
      const otherId = isCallerTeacher ? t.parent_id : t.teacher_id;
      const otherRole = isCallerTeacher ? 'parent' : 'teacher';
      const otherName = userNameMap.get(otherId) || (isCallerTeacher ? 'Parent' : 'Teacher');
      const unread = isCallerTeacher ? (t.teacher_unread_count || 0) : (t.parent_unread_count || 0);

      const cls = t.classrooms || {};
      const ch = t.children || {};

      return {
        id: t.id,
        classroomId: t.classroom_id,
        classroomName: cls.name || 'Classroom',
        childId: t.child_id,
        childName: ch.name || 'Student',
        parentId: t.parent_id,
        parentName: userNameMap.get(t.parent_id) || 'Parent',
        teacherId: t.teacher_id,
        teacherName: userNameMap.get(t.teacher_id) || 'Teacher',
        lastMessageAt: t.last_message_at,
        lastMessageSnippet: t.last_message_snippet,
        unreadCount: unread,
        otherPartyName: otherName,
        otherPartyRole: otherRole,
        churchOrOrg: cls.church_or_org || null,
      };
    });

    // Sort newest messages first
    formattedThreads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ threads: formattedThreads });
  } catch (err: unknown) {
    console.error('Error in GET /api/messages/threads:', err);
    return NextResponse.json({ error: 'Failed to fetch messages threads.' }, { status: 500 });
  }
}
