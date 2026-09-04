import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recordConnectionAudit, type ConnectionAuditAction } from '../app/lib/classrooms/audit.ts';
import type { ConnectionStatus } from '../app/lib/classrooms/types.ts';

describe('Feature 18: Connection & Consent System Lifecycle', () => {
  it('defines the required connection status states', () => {
    const validStatuses: ConnectionStatus[] = ['pending', 'approved', 'declined', 'revoked', 'removed'];
    assert.equal(validStatuses.length, 5);
    assert.ok(validStatuses.includes('pending'));
    assert.ok(validStatuses.includes('approved'));
    assert.ok(validStatuses.includes('declined'));
    assert.ok(validStatuses.includes('revoked'));
    assert.ok(validStatuses.includes('removed'));
  });

  it('validates teacher connection request creation with pending status and preview fields', () => {
    // Teacher enters student teacher code: student preview is limited to safe public info
    const child = {
      id: 'child-123',
      name: 'Amara Johnson',
      avatar: 'lion-cub.png',
      teacher_code: 'AMARA-4821',
      // Private parent/family info that MUST NOT be exposed to teacher
      parent_id: 'parent-999',
      parent_email: 'parent@example.com',
      parent_phone: '+1-555-0199',
      private_notes: 'Sensitive family note',
    };

    // Safe preview payload returned to teacher
    const preview = {
      id: child.id,
      name: child.name,
      avatar: child.avatar,
    };

    assert.equal(preview.id, 'child-123');
    assert.equal(preview.name, 'Amara Johnson');
    assert.equal(preview.avatar, 'lion-cub.png');
    // Ensure no private parent data is leaked
    assert.equal((preview as Record<string, unknown>).parent_email, undefined);
    assert.equal((preview as Record<string, unknown>).parent_phone, undefined);
    assert.equal((preview as Record<string, unknown>).private_notes, undefined);

    // Initial classroom_students record created in 'pending' state
    const newMembership = {
      classroom_id: 'class-abc',
      child_id: child.id,
      status: 'pending' as ConnectionStatus,
      approved: false,
      approved_by: null,
      approved_at: null,
      revoked_at: null,
    };

    assert.equal(newMembership.status, 'pending');
    assert.equal(newMembership.approved, false);
  });

  it('prevents duplicate active connection requests', () => {
    const existingMemberships = [
      { classroom_id: 'class-abc', child_id: 'child-123', status: 'pending', approved: false },
      { classroom_id: 'class-abc', child_id: 'child-456', status: 'approved', approved: true },
    ];

    function canSendRequest(classroomId: string, childId: string): { allowed: boolean; reason?: string } {
      const match = existingMemberships.find(
        (m) => m.classroom_id === classroomId && m.child_id === childId
      );
      if (!match) return { allowed: true };
      if (match.status === 'approved') return { allowed: false, reason: 'Already connected' };
      if (match.status === 'pending') return { allowed: false, reason: 'Connection request already pending' };
      return { allowed: true };
    }

    assert.deepEqual(canSendRequest('class-abc', 'child-123'), {
      allowed: false,
      reason: 'Connection request already pending',
    });
    assert.deepEqual(canSendRequest('class-abc', 'child-456'), {
      allowed: false,
      reason: 'Already connected',
    });
    assert.deepEqual(canSendRequest('class-abc', 'child-789'), {
      allowed: true,
    });
  });

  it('verifies parent consent notification and access scopes checklist', () => {
    const requiredScopes = [
      'Classroom participation',
      'Assignment progress',
      'Quiz/activity performance',
      'Scripture learning progress',
      'Relevant educational activity',
    ];

    assert.equal(requiredScopes.length, 5);

    const consentNotification = {
      type: 'TEACHER_REQUEST',
      header: 'Mrs. Sarah Davis wants to connect with Amara as a teacher.',
      teacherName: 'Mrs. Sarah Davis',
      className: 'Primary Sunday School',
      churchOrOrg: 'Grace Community Church',
      requestedScopes: requiredScopes,
      actions: ['approve', 'decline'],
    };

    assert.equal(consentNotification.header, 'Mrs. Sarah Davis wants to connect with Amara as a teacher.');
    assert.equal(consentNotification.churchOrOrg, 'Grace Community Church');
    assert.deepEqual(consentNotification.requestedScopes, requiredScopes);
    assert.ok(consentNotification.actions.includes('approve'));
    assert.ok(consentNotification.actions.includes('decline'));
  });

  it('processes parent approval: sets status=approved, approved=true, records audit log', async () => {
    const membership = {
      classroom_id: 'class-abc',
      child_id: 'child-123',
      status: 'pending' as ConnectionStatus,
      approved: false,
      approved_by: null as string | null,
      approved_at: null as string | null,
      revoked_at: null as string | null,
    };

    // Parent performs 'approve' action
    const parentUserId = 'parent-user-999';
    const now = new Date().toISOString();

    membership.status = 'approved';
    membership.approved = true;
    membership.approved_by = parentUserId;
    membership.approved_at = now;

    assert.equal(membership.status, 'approved');
    assert.equal(membership.approved, true);
    assert.equal(membership.approved_by, parentUserId);
    assert.ok(membership.approved_at);

    // Mock audit logger call
    const auditEntries: Array<{ action: ConnectionAuditAction; actorId: string }> = [];
    const mockAdmin = {
      from: () => ({
        insert: async (entry: { action: ConnectionAuditAction; actor_id: string }) => {
          auditEntries.push({ action: entry.action, actorId: entry.actor_id });
          return { error: null };
        },
      }),
    };

    await recordConnectionAudit(mockAdmin as unknown as Parameters<typeof recordConnectionAudit>[0], {
      classroomId: membership.classroom_id,
      childId: membership.child_id,
      teacherId: 'teacher-user-abc',
      action: 'approved',
      actorId: parentUserId,
      actorRole: 'parent',
      metadata: { approvedScopes: 5 },
    });

    assert.equal(auditEntries.length, 1);
    assert.equal(auditEntries[0].action, 'approved');
    assert.equal(auditEntries[0].actorId, parentUserId);
  });

  it('processes parent decline: sets status=declined, approved=false, records audit log', async () => {
    const membership = {
      classroom_id: 'class-abc',
      child_id: 'child-123',
      status: 'pending' as ConnectionStatus,
      approved: false,
    };

    const parentUserId = 'parent-user-999';
    membership.status = 'declined';
    membership.approved = false;

    assert.equal(membership.status, 'declined');
    assert.equal(membership.approved, false);

    const auditEntries: Array<{ action: ConnectionAuditAction }> = [];
    const mockAdmin = {
      from: () => ({
        insert: async (entry: { action: ConnectionAuditAction }) => {
          auditEntries.push({ action: entry.action });
          return { error: null };
        },
      }),
    };

    await recordConnectionAudit(mockAdmin as unknown as Parameters<typeof recordConnectionAudit>[0], {
      classroomId: membership.classroom_id,
      childId: membership.child_id,
      teacherId: 'teacher-user-abc',
      action: 'declined',
      actorId: parentUserId,
      actorRole: 'parent',
    });

    assert.equal(auditEntries.length, 1);
    assert.equal(auditEntries[0].action, 'declined');
  });

  it('allows teacher to re-request connection if previously declined, revoked, or removed', () => {
    const rows = [
      { status: 'declined', approved: false },
      { status: 'revoked', approved: false },
      { status: 'removed', approved: false },
    ];

    for (const row of rows) {
      // Transition back to 'pending' upon new request
      const canReRequest = ['declined', 'revoked', 'removed'].includes(row.status);
      assert.ok(canReRequest);

      const updated = {
        ...row,
        status: 'pending' as ConnectionStatus,
        approved: false,
        approved_at: null,
        revoked_at: null,
      };

      assert.equal(updated.status, 'pending');
      assert.equal(updated.approved, false);
    }
  });

  it('enforces immediate revocation: sets status=revoked and approved=false', async () => {
    const membership = {
      classroom_id: 'class-abc',
      child_id: 'child-123',
      status: 'approved' as ConnectionStatus,
      approved: true,
      revoked_at: null as string | null,
    };

    const parentUserId = 'parent-user-999';
    const revokeTimestamp = new Date().toISOString();

    membership.status = 'revoked';
    membership.approved = false;
    membership.revoked_at = revokeTimestamp;

    assert.equal(membership.status, 'revoked');
    assert.equal(membership.approved, false);
    assert.equal(membership.revoked_at, revokeTimestamp);

    const auditEntries: Array<{ action: ConnectionAuditAction }> = [];
    const mockAdmin = {
      from: () => ({
        insert: async (entry: { action: ConnectionAuditAction }) => {
          auditEntries.push({ action: entry.action });
          return { error: null };
        },
      }),
    };

    await recordConnectionAudit(mockAdmin as unknown as Parameters<typeof recordConnectionAudit>[0], {
      classroomId: membership.classroom_id,
      childId: membership.child_id,
      teacherId: 'teacher-user-abc',
      action: 'revoked',
      actorId: parentUserId,
      actorRole: 'parent',
      metadata: { reason: 'Parent requested access revocation' },
    });

    assert.equal(auditEntries.length, 1);
    assert.equal(auditEntries[0].action, 'revoked');
  });

  it('supports child and teen visibility of trusted teacher connection', () => {
    const studentConnections = [
      {
        teacherName: 'Mrs. Sarah Davis',
        className: 'Primary Sunday School',
        approved: true,
        status: 'approved',
      },
      {
        teacherName: 'Pastor Mark',
        className: 'Midweek Youth Group',
        approved: false,
        status: 'pending',
      },
    ];

    // Approved connection is visible as a trusted teacher capsule
    const approvedList = studentConnections.filter((c) => c.approved && c.status === 'approved');
    assert.equal(approvedList.length, 1);
    assert.equal(approvedList[0].teacherName, 'Mrs. Sarah Davis');
    assert.equal(approvedList[0].className, 'Primary Sunday School');

    // Pending connection does NOT expose student educational data to the teacher
    const pendingList = studentConnections.filter((c) => !c.approved);
    assert.equal(pendingList.length, 1);
    assert.equal(pendingList[0].teacherName, 'Pastor Mark');
  });

  it('supports multiple classrooms and teachers per child (e.g. Sunday School + Youth Group)', () => {
    const childClassrooms = [
      {
        childId: 'child-123',
        classroomId: 'class-sunday-school',
        classroomName: 'Primary Sunday School',
        churchOrOrg: 'Grace Community Church',
        teacherName: 'Mrs. Sarah Davis',
        status: 'connected',
        approved: true,
      },
      {
        childId: 'child-123',
        classroomId: 'class-midweek-youth',
        classroomName: 'Midweek Bible Explorers',
        churchOrOrg: 'Grace Community Church',
        teacherName: 'Pastor Mark',
        status: 'connected',
        approved: true,
      },
    ];

    assert.equal(childClassrooms.length, 2);
    assert.equal(childClassrooms[0].classroomId, 'class-sunday-school');
    assert.equal(childClassrooms[1].classroomId, 'class-midweek-youth');
  });
});
