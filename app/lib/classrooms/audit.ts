import type { SupabaseClient } from '@supabase/supabase-js';

export type ConnectionAuditAction = 'requested' | 'approved' | 'declined' | 'revoked' | 'removed';
export type ConnectionAuditActorRole = 'teacher' | 'parent' | 'student' | 'admin' | 'system';

export type RecordConnectionAuditParams = {
  classroomId: string;
  childId: string;
  teacherId: string;
  actorId: string;
  actorRole: ConnectionAuditActorRole;
  action: ConnectionAuditAction;
  metadata?: Record<string, unknown>;
};

/**
 * Appends an immutable record to `connection_audit_logs`.
 * Captures all connection requests, approvals, declines, revocations, and removals.
 * Fails gracefully so an audit write error doesn't completely block user action,
 * while logging errors for administrative visibility.
 */
export async function recordConnectionAudit(
  admin: SupabaseClient,
  params: RecordConnectionAuditParams
): Promise<void> {
  try {
    const { error } = await admin.from('connection_audit_logs').insert({
      classroom_id: params.classroomId,
      child_id: params.childId,
      teacher_id: params.teacherId,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      action: params.action,
      metadata: params.metadata ?? {},
    });
    if (error) {
      console.error('[ConnectionAudit] Failed to record audit entry:', error.message, params);
    }
  } catch (err) {
    console.error('[ConnectionAudit] Unexpected error recording audit entry:', err, params);
  }
}
