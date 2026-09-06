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
 */
export async function ensureConnectCode(
  admin: SupabaseClient,
  userId: string,
  role: 'teacher' | 'parent',
  displayName: string,
  classroomId?: string | null
): Promise<{ code: string; displayName: string }> {
  // Check if existing code exists
  const { data: existing } = await admin
    .from('parent_teacher_connect_codes')
    .select('code, display_name')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (existing) {
    return { code: existing.code, displayName: existing.display_name };
  }

  // Generate unique code
  let newCode = generateConnectCode(role);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: taken } = await admin
      .from('parent_teacher_connect_codes')
      .select('id')
      .eq('code', newCode)
      .maybeSingle();
    if (!taken) break;
    newCode = generateConnectCode(role);
  }

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

  return { code: newCode, displayName };
}
