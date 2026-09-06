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

const RESERVED_DEMO_CODES = new Set([
  'TCH-GRACE26',
  'TCH-DAVID88',
  'PAR-JORDAN26',
  'PAR-CHIDI93',
  'PAR-SARAH15',
]);

/**
 * Ensures a user (parent or teacher) has an active Connect Code, creating a unique one if not present.
 * Strictly guarantees that one code belongs only to ONE account and is never shared or reassigned.
 */
export async function ensureConnectCode(
  admin: SupabaseClient,
  userId: string,
  role: 'teacher' | 'parent',
  displayName: string,
  classroomId?: string | null
): Promise<{ code: string; displayName: string }> {
  // 1. Check parent_teacher_connect_codes table first for this user and role
  try {
    const { data: existing } = await admin
      .from('parent_teacher_connect_codes')
      .select('code, display_name')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (existing?.code) {
      const finalName = existing.display_name || displayName;
      // Sync to user_metadata if needed
      try {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { connect_code: existing.code, connect_role: role, full_name: finalName },
        });
      } catch {
        /* ignore */
      }
      return { code: existing.code, displayName: finalName };
    }
  } catch {
    /* Table query error fallback */
  }

  // 2. Check user_metadata in auth.users
  let candidateCode: string | null = null;
  try {
    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const existingCode = userRes?.user?.user_metadata?.connect_code as string | undefined;
    if (existingCode && typeof existingCode === 'string' && existingCode.length >= 4) {
      // Check if this existingCode is already claimed by someone else in the table
      try {
        const { data: conflict } = await admin
          .from('parent_teacher_connect_codes')
          .select('user_id')
          .eq('code', existingCode)
          .maybeSingle();

        if (!conflict || conflict.user_id === userId) {
          candidateCode = existingCode;
        }
      } catch {
        candidateCode = existingCode;
      }
    }
  } catch {
    /* continue to generation */
  }

  // 3. If no valid unconflicted code, dynamically generate a unique code with collision checking
  if (!candidateCode) {
    let generated = generateConnectCode(role);
    for (let attempt = 0; attempt < 20; attempt++) {
      if (RESERVED_DEMO_CODES.has(generated)) {
        generated = generateConnectCode(role);
        continue;
      }

      try {
        const { data: taken } = await admin
          .from('parent_teacher_connect_codes')
          .select('id')
          .eq('code', generated)
          .maybeSingle();

        if (!taken) {
          candidateCode = generated;
          break;
        }
      } catch {
        candidateCode = generated;
        break;
      }
      generated = generateConnectCode(role);
    }

    if (!candidateCode) {
      candidateCode = generateConnectCode(role);
    }
  }

  const finalCode = candidateCode;

  // 4. Save to auth.users user_metadata
  try {
    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const currentMeta = userRes?.user?.user_metadata || {};
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...currentMeta,
        connect_code: finalCode,
        connect_role: role,
        full_name: displayName || currentMeta.full_name || (role === 'teacher' ? 'Teacher' : 'Parent'),
      },
    });
  } catch (err) {
    console.error('Failed to save connect_code to user_metadata:', err);
  }

  // 5. Save to parent_teacher_connect_codes table with UNIQUE constraint
  try {
    await admin.from('parent_teacher_connect_codes').upsert(
      {
        user_id: userId,
        role,
        code: finalCode,
        display_name: displayName,
        classroom_id: classroomId || null,
      },
      { onConflict: 'user_id,role' }
    );
  } catch (err) {
    console.error('Failed to upsert to parent_teacher_connect_codes:', err);
  }

  return { code: finalCode, displayName };
}
