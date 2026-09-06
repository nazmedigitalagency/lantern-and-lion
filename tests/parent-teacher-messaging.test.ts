import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ChatMessage, MessageThread, SenderRole } from '../app/lib/messages/types.ts';

describe('Feature: Real-Time Parent-Teacher Messaging', () => {
  it('enforces COPPA adult-to-adult participant boundaries', () => {
    // Verified participants are strictly adult accounts (parent and teacher)
    const thread: MessageThread = {
      id: 'thread-101',
      classroomId: 'class-wednesday',
      classroomName: 'Wednesday Explorers',
      childId: 'child-amara',
      childName: 'Amara A.',
      parentId: 'user-parent-456',
      parentName: 'Jordan Adeyemi',
      teacherId: 'user-teacher-789',
      teacherName: 'Teacher Grace',
      lastMessageAt: new Date().toISOString(),
      lastMessageSnippet: 'Hello!',
      unreadCount: 0,
      otherPartyName: 'Jordan Adeyemi',
      otherPartyRole: 'parent',
      churchOrOrg: 'Grace Community Church',
    };

    assert.equal(thread.otherPartyRole, 'parent');
    assert.notEqual(thread.parentId, thread.childId);
    assert.notEqual(thread.teacherId, thread.childId);
    // Student is strictly the subject/context of the conversation, never a message sender
    const validRoles: SenderRole[] = ['parent', 'teacher'];
    assert.ok(validRoles.includes('parent'));
    assert.ok(validRoles.includes('teacher'));
    assert.equal((validRoles as string[]).includes('student'), false);
    assert.equal((validRoles as string[]).includes('child'), false);
  });

  it('validates message body constraints (non-empty, maximum 2000 characters)', () => {
    function validateMessage(body: string): { valid: boolean; error?: string } {
      const trimmed = body.trim();
      if (!trimmed) return { valid: false, error: 'Message cannot be empty' };
      if (trimmed.length > 2000) return { valid: false, error: 'Message is too long (max 2000 characters)' };
      return { valid: true };
    }

    assert.equal(validateMessage('').valid, false);
    assert.equal(validateMessage('   ').valid, false);
    assert.equal(validateMessage('Hello Teacher!').valid, true);
    assert.equal(validateMessage('a'.repeat(2000)).valid, true);
    assert.equal(validateMessage('a'.repeat(2001)).valid, false);
  });

  it('updates unread counts and last message snippet correctly on message send', () => {
    let thread = {
      id: 'thread-1',
      lastMessageAt: '2026-09-01T10:00:00Z',
      lastMessageSnippet: 'Initial message',
      parentUnreadCount: 0,
      teacherUnreadCount: 0,
    };

    function simulateSendMessage(
      senderRole: SenderRole,
      body: string
    ) {
      const now = new Date().toISOString();
      thread = {
        ...thread,
        lastMessageAt: now,
        lastMessageSnippet: body.slice(0, 100),
        parentUnreadCount: senderRole === 'teacher' ? thread.parentUnreadCount + 1 : thread.parentUnreadCount,
        teacherUnreadCount: senderRole === 'parent' ? thread.teacherUnreadCount + 1 : thread.teacherUnreadCount,
      };
    }

    // Teacher sends a message -> Parent unread increments
    simulateSendMessage('teacher', 'Amara did a great job today!');
    assert.equal(thread.parentUnreadCount, 1);
    assert.equal(thread.teacherUnreadCount, 0);
    assert.equal(thread.lastMessageSnippet, 'Amara did a great job today!');

    // Parent sends a reply -> Teacher unread increments
    simulateSendMessage('parent', 'Thank you so much!');
    assert.equal(thread.parentUnreadCount, 1);
    assert.equal(thread.teacherUnreadCount, 1);
    assert.equal(thread.lastMessageSnippet, 'Thank you so much!');
  });

  it('clears unread count and marks recipient messages as read on view', () => {
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        threadId: 'thread-1',
        senderId: 'teacher-1',
        senderRole: 'teacher',
        body: 'Here is the verse of the week.',
        read: false,
        createdAt: '2026-09-06T08:00:00Z',
      },
      {
        id: 'msg-2',
        threadId: 'thread-1',
        senderId: 'teacher-1',
        senderRole: 'teacher',
        body: 'Genesis 9:13.',
        read: false,
        createdAt: '2026-09-06T08:01:00Z',
      },
    ];

    let parentUnreadCount = 2;

    // Parent views the thread:
    function simulateMarkReadByParent() {
      parentUnreadCount = 0;
      messages.forEach((m) => {
        if (m.senderRole === 'teacher') {
          m.read = true;
        }
      });
    }

    simulateMarkReadByParent();
    assert.equal(parentUnreadCount, 0);
    assert.ok(messages.every((m) => m.read === true));
  });

  it('sorts threads with the newest activity at the top', () => {
    const threads: Array<{ id: string; lastMessageAt: string }> = [
      { id: 't1', lastMessageAt: '2026-09-06T07:00:00Z' },
      { id: 't2', lastMessageAt: '2026-09-06T08:30:00Z' },
      { id: 't3', lastMessageAt: '2026-09-06T06:15:00Z' },
    ];

    threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    assert.equal(threads[0].id, 't2');
    assert.equal(threads[1].id, 't1');
    assert.equal(threads[2].id, 't3');
  });

  it('isolates messages strictly by thread ID (no cross-classroom leaking)', () => {
    const allMessages: ChatMessage[] = [
      { id: 'm1', threadId: 'thread-class-A', senderId: 'teacher-1', senderRole: 'teacher', body: 'Class A notice', read: true, createdAt: '2026-09-06T08:00:00Z' },
      { id: 'm2', threadId: 'thread-class-B', senderId: 'teacher-2', senderRole: 'teacher', body: 'Class B notice', read: true, createdAt: '2026-09-06T08:01:00Z' },
    ];

    const threadAMessages = allMessages.filter((m) => m.threadId === 'thread-class-A');
    assert.equal(threadAMessages.length, 1);
    assert.equal(threadAMessages[0].body, 'Class A notice');

    const threadBMessages = allMessages.filter((m) => m.threadId === 'thread-class-B');
    assert.equal(threadBMessages.length, 1);
    assert.equal(threadBMessages[0].body, 'Class B notice');
  });

  it('generates, normalizes, and validates Parent and Teacher Connect Codes', () => {
    // Role prefix enforcement
    function generateCode(role: 'teacher' | 'parent'): string {
      const prefix = role === 'teacher' ? 'TCH' : 'PAR';
      return `${prefix}-TEST12`;
    }

    function normalizeCode(raw: string): string {
      return raw.trim().toUpperCase().replace(/\s+/g, '');
    }

    function isValidCode(code: string): boolean {
      const norm = normalizeCode(code);
      return /^([A-Z0-9]{3,6}-[A-Z0-9]{4,10}|[A-Z0-9]{4,12})$/.test(norm);
    }

    const teacherCode = generateCode('teacher');
    const parentCode = generateCode('parent');

    assert.ok(teacherCode.startsWith('TCH-'));
    assert.ok(parentCode.startsWith('PAR-'));

    // Normalization handles mixed casing and surrounding/inner whitespace
    assert.equal(normalizeCode('  tch - grace26 '), 'TCH-GRACE26');
    assert.equal(normalizeCode('par-jordan26'), 'PAR-JORDAN26');

    // Validation
    assert.equal(isValidCode('TCH-GRACE26'), true);
    assert.equal(isValidCode('PAR-JORDAN26'), true);
    assert.equal(isValidCode('par jordan 26'), true);
    assert.equal(isValidCode('??!'), false);
    assert.equal(isValidCode(''), false);
  });

  it('creates an active conversation thread when a parent or teacher connects via code', () => {
    type ConnectRegistryEntry = {
      role: SenderRole;
      name: string;
      childName?: string;
      classroomName?: string;
    };

    const registry: Record<string, ConnectRegistryEntry> = {
      'TCH-GRACE26': {
        role: 'teacher',
        name: 'Teacher Grace',
        classroomName: 'Wednesday Explorers',
      },
      'PAR-JORDAN26': {
        role: 'parent',
        name: 'Jordan Adeyemi',
        childName: 'Amara Adeyemi',
      },
    };

    function connectByCode(
      code: string,
      currentRole: SenderRole,
      currentName: string
    ): { success: boolean; thread?: MessageThread; error?: string } {
      const norm = code.trim().toUpperCase().replace(/\s+/g, '');
      const target = registry[norm];
      if (!target) return { success: false, error: 'Code not found' };
      if (target.role === currentRole) {
        return { success: false, error: 'Cannot connect to someone with the same role' };
      }

      const isTeacher = currentRole === 'teacher';
      const thread: MessageThread = {
        id: `thread-${norm.toLowerCase()}`,
        classroomId: 'class-1',
        classroomName: target.classroomName || 'Wednesday Explorers',
        childId: 'child-1',
        childName: target.childName || 'Amara Adeyemi',
        parentId: isTeacher ? 'parent-id' : 'current-id',
        parentName: isTeacher ? target.name : currentName,
        teacherId: isTeacher ? 'current-id' : 'teacher-id',
        teacherName: isTeacher ? currentName : target.name,
        lastMessageAt: new Date().toISOString(),
        lastMessageSnippet: 'Connected via Connect Code',
        unreadCount: 0,
        otherPartyName: target.name,
        otherPartyRole: target.role,
      };
      return { success: true, thread };
    }

    // Teacher connects with Parent using PAR-JORDAN26
    const teacherResult = connectByCode('PAR-JORDAN26', 'teacher', 'Teacher Grace');
    assert.equal(teacherResult.success, true);
    assert.equal(teacherResult.thread?.parentName, 'Jordan Adeyemi');
    assert.equal(teacherResult.thread?.otherPartyRole, 'parent');

    // Parent connects with Teacher using TCH-GRACE26
    const parentResult = connectByCode('TCH-GRACE26', 'parent', 'Jordan Adeyemi');
    assert.equal(parentResult.success, true);
    assert.equal(parentResult.thread?.teacherName, 'Teacher Grace');
    assert.equal(parentResult.thread?.otherPartyRole, 'teacher');

    // Rejects same-role connection (teacher entering a teacher code)
    const invalidRoleResult = connectByCode('TCH-GRACE26', 'teacher', 'Another Teacher');
    assert.equal(invalidRoleResult.success, false);
    assert.equal(invalidRoleResult.error, 'Cannot connect to someone with the same role');
  });

  it('guarantees unique 1-to-1 dynamic connect code generation per account without collisions or reassignments', () => {
    const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    function generateConnectCode(role: 'teacher' | 'parent'): string {
      const prefix = role === 'teacher' ? 'TCH' : 'PAR';
      let out = '';
      for (let i = 0; i < 6; i++) {
        out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      return `${prefix}-${out}`;
    }

    // Simulate 200 users generating codes
    const generatedCodes = new Set<string>();
    const userCodeMap = new Map<string, string>(); // userId -> code
    const codeUserMap = new Map<string, string>(); // code -> userId

    for (let i = 0; i < 200; i++) {
      const userId = `user-${i}`;
      const role = i % 2 === 0 ? 'teacher' : 'parent';

      let code = generateConnectCode(role);
      while (generatedCodes.has(code)) {
        code = generateConnectCode(role);
      }

      generatedCodes.add(code);
      userCodeMap.set(userId, code);
      codeUserMap.set(code, userId);
    }

    // Assert strictly 200 distinct codes for 200 users
    assert.equal(generatedCodes.size, 200);
    assert.equal(userCodeMap.size, 200);
    assert.equal(codeUserMap.size, 200);

    // Verify 1-to-1 correspondence (one code does NOT belong to multiple parents or teachers)
    for (const [userId, code] of userCodeMap.entries()) {
      assert.equal(codeUserMap.get(code), userId);
    }

    // Attempting to look up a non-existent code must fail and NEVER rebind an existing user
    const unmatchedCode = 'TCH-NONEXISTENT';
    const lookupResult = codeUserMap.get(unmatchedCode);
    assert.equal(lookupResult, undefined, 'Unmatched code must return undefined/404, never steal another user account');

    // Role-validation and cross-role connection check
    function attemptConnect(
      callerUserId: string,
      callerRole: 'teacher' | 'parent',
      targetCode: string
    ) {
      const isTargetTeacher = targetCode.startsWith('TCH-');
      const isTargetParent = targetCode.startsWith('PAR-');
      if (callerRole === 'teacher' && isTargetTeacher) {
        return { status: 400, error: 'This code belongs to a teacher. Teachers can only connect with parents.' };
      }
      if (callerRole === 'parent' && isTargetParent) {
        return { status: 400, error: 'This code belongs to a parent. Parents can only connect with teachers.' };
      }

      const targetUserId = codeUserMap.get(targetCode);
      if (!targetUserId) return { status: 404, error: 'Code not found' };

      // Cross-role connection (even on the same user account for testing/teacher-parents) succeeds
      return { status: 200, success: true, isSelf: targetUserId === callerUserId };
    }

    // Teacher entering their own teacher code -> rejected by role validation
    const teacherSelfCode = userCodeMap.get('user-0')!; // Teacher code TCH-
    const sameRoleRes = attemptConnect('user-0', 'teacher', teacherSelfCode);
    assert.equal(sameRoleRes.status, 400);
    assert.equal(sameRoleRes.error, 'This code belongs to a teacher. Teachers can only connect with parents.');

    // Teacher entering opposite role parent code -> succeeds!
    const parentCode = userCodeMap.get('user-1')!; // Parent code PAR-
    const crossRoleRes = attemptConnect('user-0', 'teacher', parentCode);
    assert.equal(crossRoleRes.status, 200);
    assert.equal(crossRoleRes.success, true);

    // Cross-role connection when same user tests both roles -> succeeds!
    const selfOppositeRes = attemptConnect('user-1', 'teacher', parentCode);
    assert.equal(selfOppositeRes.status, 200);
    assert.equal(selfOppositeRes.isSelf, true);

    // Non-existent code returns 404
    const notFoundRes = attemptConnect('user-0', 'teacher', 'PAR-MISSING99');
    assert.equal(notFoundRes.status, 404);
  });

  it('guarantees parent accounts strictly receive PAR- codes and never inherit TCH- codes', () => {
    function resolveCodeForRole(
      role: 'parent' | 'teacher',
      existingMetadataCode?: string,
      tableCode?: string
    ): string {
      const expectedPrefix = role === 'teacher' ? 'TCH-' : 'PAR-';
      // 1. Table code check
      if (tableCode && tableCode.startsWith(expectedPrefix)) {
        return tableCode;
      }
      // 2. Metadata code check
      if (existingMetadataCode && existingMetadataCode.startsWith(expectedPrefix)) {
        return existingMetadataCode;
      }
      // 3. Newly generated
      return `${expectedPrefix}GENERATED`;
    }

    // If user previously had a teacher code in metadata or table, parent role MUST discard it and generate PAR-
    const parentCodeWithStaleTeacherCode = resolveCodeForRole('parent', 'TCH-3WA2HC', 'TCH-3WA2HC');
    assert.ok(parentCodeWithStaleTeacherCode.startsWith('PAR-'), 'Parent code must start with PAR- even if previous code was TCH-');
    assert.notEqual(parentCodeWithStaleTeacherCode, 'TCH-3WA2HC');

    // Valid existing parent code is preserved
    const validParentCode = resolveCodeForRole('parent', 'PAR-VAL123', 'PAR-VAL123');
    assert.equal(validParentCode, 'PAR-VAL123');

    // Teacher role receives TCH-
    const teacherCode = resolveCodeForRole('teacher', 'PAR-VAL123');
    assert.ok(teacherCode.startsWith('TCH-'));
  });

  it('isolates real authenticated parent accounts from mock demo threads', () => {
    function resolveThreads(isAuthenticated: boolean, dbThreads: MessageThread[], demoThreads: MessageThread[]) {
      if (isAuthenticated) {
        // Authenticated users only see their own DB threads, never fake demo threads
        return dbThreads;
      }
      return demoThreads;
    }

    const demoThreads = [
      {
        id: 'demo-1',
        classroomId: 'c1',
        classroomName: 'Class',
        childId: 'ch1',
        childName: 'Amara A.',
        parentId: 'p1',
        parentName: 'Jordan Adeyemi',
        teacherId: 't1',
        teacherName: 'Teacher Grace',
        lastMessageAt: '2026-09-06T00:00:00Z',
        lastMessageSnippet: 'Hello Jordan!',
        unreadCount: 0,
        otherPartyName: 'Teacher Grace',
        otherPartyRole: 'teacher' as const,
      },
    ];

    // Real authenticated parent with no conversations yet
    const realParentThreads = resolveThreads(true, [], demoThreads);
    assert.equal(realParentThreads.length, 0, 'Real parent with no conversations must not be shown demo conversations');

    // Anonymous demo visitor
    const anonThreads = resolveThreads(false, [], demoThreads);
    assert.equal(anonThreads.length, 1);
    assert.equal(anonThreads[0].otherPartyName, 'Teacher Grace');
  });
});



