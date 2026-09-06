import type { SupabaseClient } from '@supabase/supabase-js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function generateConnectCode(role: 'teacher' | 'parent'): string {
  const prefix = role === 'teacher' ? 'TCH' : 'PAR';
  return `${prefix}-${randomSegment(6)}`;
}

export function normalizeConnectCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidConnectCode(code: string): boolean {
  const norm = normalizeConnectCode(code);
  return /^([A-Z0-9]{3,6}-[A-Z0-9]{4,10}|[A-Z0-9]{4,12})$/.test(norm);
}

/**
 * Ensures a user (parent or teacher) has an active Connect Code, creating one if not present.
 * Uses auth.users user_metadata as primary source of truth so it works out of the box
 * on every Supabase instance without requiring custom table migrations.
 */
export async function ensureConnectCode(
  admin: SupabaseClient,
  userId: string,
  role: 'teacher' | 'parent',
  displayName: string,
  classroomId?: string | null
): Promise<{ code: string; displayName: string }> {
  // 1. Check user_metadata in auth.users
  try {
    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const existingCode = userRes?.user?.user_metadata?.connect_code as string | undefined;
    if (existingCode && typeof existingCode === 'string' && existingCode.length >= 4) {
      return { code: existingCode, displayName };
    }
  } catch {
    // continue to generation
  }

  // 2. Check if existing code exists in parent_teacher_connect_codes table if available
  try {
    const { data: existing } = await admin
      .from('parent_teacher_connect_codes')
      .select('code, display_name')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (existing?.code) {
      // Sync to user_metadata for future instant lookups
      try {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { connect_code: existing.code, connect_role: role, full_name: displayName },
        });
      } catch {
        // ignore
      }
      return { code: existing.code, displayName: existing.display_name };
    }
  } catch {
    // Table may not exist yet, continue
  }

  // 3. Generate new unique code
  const newCode = generateConnectCode(role);

  // 4. Save to auth.users user_metadata (guaranteed to succeed on all Supabase projects)
  try {
    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const currentMeta = userRes?.user?.user_metadata || {};
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...currentMeta,
        connect_code: newCode,
        connect_role: role,
        full_name: displayName || currentMeta.full_name || (role === 'teacher' ? 'Teacher' : 'Parent'),
      },
    });
  } catch (err) {
    console.error('Failed to save connect_code to user_metadata:', err);
  }

  // 5. Also attempt to save to parent_teacher_connect_codes table if table exists
  try {
    await admin.from('parent_teacher_connect_codes').upsert(
      {
        user_id: userId,
        role,
        code: newCode,
        display_name: displayName,
        classroom_id: classroomId || null,
      },
      { onConflict: 'user_id,role' }
    );
  } catch {
    // Table may not exist yet
  }

  return { code: newCode, displayName };
}
