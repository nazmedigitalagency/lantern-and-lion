import type { SupabaseClient } from '@supabase/supabase-js';

/** Ambiguity-free alphabet — same set already used by classroom join codes (generateClassCode). */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

function generateTeacherCode(): string {
  return `LNL-TCH-${randomSegment(6)}`;
}

function generateGameCode(): string {
  return randomSegment(6);
}

async function uniqueCode(admin: SupabaseClient, column: 'teacher_code' | 'game_code', generate: () => string): Promise<string> {
  let code = generate();
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: taken } = await admin.from('children').select('id').eq(column, code).maybeSingle();
    if (!taken) return code;
    code = generate();
  }
  // Astronomically unlikely at ~1B-code entropy, but never loop forever.
  throw new Error(`Could not generate a unique ${column} after several attempts.`);
}

export type ChildCodes = { teacherCode: string; gameCode: string };

/**
 * Returns this child's Teacher Code and Game Code, generating and persisting
 * whichever is missing. Idempotent — safe to call on every "My Codes" page load.
 */
export async function ensureChildCodes(admin: SupabaseClient, childId: string): Promise<ChildCodes> {
  const { data: child, error } = await admin.from('children').select('teacher_code, game_code').eq('id', childId).maybeSingle();
  if (error || !child) throw new Error('Student not found.');

  const updates: Record<string, string> = {};
  let teacherCode = child.teacher_code as string | null;
  let gameCode = child.game_code as string | null;

  if (!teacherCode) {
    teacherCode = await uniqueCode(admin, 'teacher_code', generateTeacherCode);
    updates.teacher_code = teacherCode;
  }
  if (!gameCode) {
    gameCode = await uniqueCode(admin, 'game_code', generateGameCode);
    updates.game_code = gameCode;
  }

  if (Object.keys(updates).length > 0) {
    await admin.from('children').update(updates).eq('id', childId);
  }

  return { teacherCode, gameCode };
}

/** Rotates the Game Code. The previous code stops working immediately since lookups are exact-match. */
export async function regenerateGameCode(admin: SupabaseClient, childId: string): Promise<string> {
  const gameCode = await uniqueCode(admin, 'game_code', generateGameCode);
  await admin.from('children').update({ game_code: gameCode }).eq('id', childId);
  return gameCode;
}

/** Normalizes user-entered Teacher Code input for lookup (trim, uppercase, collapse whitespace). */
export function normalizeTeacherCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
