import type { SupabaseClient } from '@supabase/supabase-js';

/** Server-side event types this feature tracks. Kept minimal — data minimization by design. */
export type ActivityEventType =
  | 'USER_LOGIN'
  | 'SESSION_STARTED'
  | 'SESSION_RESUMED'
  | 'SESSION_IDLE'
  | 'SESSION_ENDED'
  | 'GAME_STARTED'
  | 'GAME_COMPLETED'
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'ACHIEVEMENT_EARNED'
  | 'XP_EARNED';

/** Returns YYYY-MM-DD for "today" in the given IANA timezone (never the server's own TZ). */
export function activityDateKey(timezone: string, at: Date = new Date()): string {
  try {
    return at.toLocaleDateString('en-CA', { timeZone: timezone || 'UTC' });
  } catch {
    return at.toLocaleDateString('en-CA', { timeZone: 'UTC' });
  }
}

export async function getFamilyForChild(admin: SupabaseClient, childId: string) {
  const { data: child, error: childError } = await admin
    .from('children')
    .select('id, family_id')
    .eq('id', childId)
    .maybeSingle();
  if (childError || !child) return null;

  const { data: family, error: familyError } = await admin
    .from('families')
    .select('id, owner_id, timezone')
    .eq('id', child.family_id)
    .maybeSingle();
  if (familyError || !family) return null;

  return { childId: child.id as string, familyId: family.id as string, ownerId: family.owner_id as string, timezone: (family.timezone as string) || 'UTC' };
}

export async function recordActivityEvent(
  admin: SupabaseClient,
  params: {
    childId: string;
    familyId: string;
    sessionId?: string | null;
    eventType: ActivityEventType;
    durationSeconds?: number | null;
    metadata?: Record<string, unknown>;
  }
) {
  await admin.from('activity_events').insert({
    child_id: params.childId,
    family_id: params.familyId,
    session_id: params.sessionId ?? null,
    event_type: params.eventType,
    duration_seconds: params.durationSeconds ?? null,
    metadata: params.metadata ?? {},
  });
}

type SummaryIncrement = Partial<{
  active_seconds: number;
  session_count: number;
  games_played: number;
  games_completed: number;
  lessons_completed: number;
  quests_completed: number;
  xp_earned: number;
  achievements_earned: number;
}>;

/**
 * Incrementally upserts today's row instead of recomputing from the full
 * event history on every read — the aggregation layer the dashboards read.
 */
export async function bumpDailySummary(
  admin: SupabaseClient,
  childId: string,
  timezone: string,
  increments: SummaryIncrement,
  extra: Partial<{ first_login_at: string; last_activity_at: string; top_activity: string }> = {}
) {
  const dateKey = activityDateKey(timezone);
  const { data: existing } = await admin
    .from('daily_activity_summary')
    .select('*')
    .eq('child_id', childId)
    .eq('activity_date', dateKey)
    .maybeSingle();

  const merged: Record<string, unknown> = {
    child_id: childId,
    activity_date: dateKey,
    active_seconds: (existing?.active_seconds || 0) + (increments.active_seconds || 0),
    session_count: (existing?.session_count || 0) + (increments.session_count || 0),
    games_played: (existing?.games_played || 0) + (increments.games_played || 0),
    games_completed: (existing?.games_completed || 0) + (increments.games_completed || 0),
    lessons_completed: (existing?.lessons_completed || 0) + (increments.lessons_completed || 0),
    quests_completed: (existing?.quests_completed || 0) + (increments.quests_completed || 0),
    xp_earned: (existing?.xp_earned || 0) + (increments.xp_earned || 0),
    achievements_earned: (existing?.achievements_earned || 0) + (increments.achievements_earned || 0),
    first_login_at: existing?.first_login_at ?? extra.first_login_at ?? null,
    last_activity_at: extra.last_activity_at ?? existing?.last_activity_at ?? null,
    top_activity: extra.top_activity ?? existing?.top_activity ?? null,
  };

  await admin.from('daily_activity_summary').upsert(merged, { onConflict: 'child_id,activity_date' });
  return merged;
}

/** Inserts a notification at most once per (recipient, dedupeKey) — the anti-spam guarantee. */
export async function notifyOnce(
  admin: SupabaseClient,
  params: {
    recipientId: string;
    childId?: string | null;
    type: 'LOGIN' | 'DAILY_SUMMARY' | 'ACHIEVEMENT' | 'QUEST' | 'LEARNING';
    title: string;
    body: string;
    payload?: Record<string, unknown>;
    dedupeKey: string;
  }
) {
  await admin.from('notifications').upsert(
    {
      recipient_id: params.recipientId,
      child_id: params.childId ?? null,
      type: params.type,
      title: params.title,
      body: params.body,
      payload: params.payload ?? {},
      dedupe_key: params.dedupeKey,
    },
    { onConflict: 'recipient_id,dedupe_key', ignoreDuplicates: true }
  );
}
