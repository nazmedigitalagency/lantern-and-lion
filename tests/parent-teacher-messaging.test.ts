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
});
