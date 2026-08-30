import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { bumpDailySummary, getFamilyForChild, recordActivityEvent, type ActivityEventType } from '../../../lib/activity/server';

const AnalyticsTrackSchema = z.object({
  event: z.string().min(1).max(64),
  gameId: z.string().max(64).optional(),
  activityId: z.string().max(128).optional(),
  difficulty: z.string().max(32).optional(),
  category: z.string().max(64).optional(),
  score: z.number().int().min(0).max(1000000).optional(),
  timeSeconds: z.number().int().min(0).max(86400).optional(),
  mistakes: z.number().int().min(0).max(10000).optional(),
  xpEarned: z.number().int().min(0).max(100000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** Honeypot field for bot detection (must be empty) */
  _hp: z.string().optional(),
});

/** Events this route persists server-side; anything else is only kept in the client's local log. */
const PERSISTED_EVENTS = new Set<ActivityEventType>([
  'GAME_STARTED',
  'GAME_COMPLETED',
  'LESSON_STARTED',
  'LESSON_COMPLETED',
  'QUEST_STARTED',
  'QUEST_COMPLETED',
  'ACHIEVEMENT_EARNED',
  'XP_EARNED',
]);

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. Rate limiting: 60 analytics events per minute per IP
    const rateLimit = checkRateLimit(`analytics:${clientIp}`, { maxRequests: 60, windowSeconds: 60 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.resetSeconds) },
        }
      );
    }

    // 2. Bot / automated scraper check
    const userAgent = req.headers.get('user-agent') || '';
    if (!userAgent || userAgent.toLowerCase().includes('bot') || userAgent.toLowerCase().includes('spider')) {
      // Discard bot traffic silently with a 200 OK to prevent scraping feedback
      return NextResponse.json({ success: true, recorded: false });
    }

    // 3. Schema validation
    const rawBody = await req.json().catch(() => null);
    const parseResult = AnalyticsTrackSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid analytics payload', details: parseResult.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    // Honeypot check: If bot filled the honeypot field, ignore
    if (parseResult.data._hp && parseResult.data._hp.length > 0) {
      return NextResponse.json({ success: true, recorded: false });
    }

    const { event, gameId, activityId, timeSeconds, mistakes, xpEarned } = parseResult.data;

    // 4. Persist to the child's activity log + daily summary, attributed via
    // their signed session cookie (never a client-supplied id).
    if (PERSISTED_EVENTS.has(event as ActivityEventType)) {
      const session = await getChildSessionFromCookies();
      if (session) {
        const admin = createServerAdminClient();
        const family = await getFamilyForChild(admin, session.childId);
        if (family) {
          await recordActivityEvent(admin, {
            childId: session.childId,
            familyId: family.familyId,
            sessionId: session.sessionId,
            eventType: event as ActivityEventType,
            durationSeconds: timeSeconds ?? null,
            metadata: { gameId, activityId, mistakes },
          });

          const nowIso = new Date().toISOString();
          if (event === 'GAME_STARTED') {
            await bumpDailySummary(admin, session.childId, family.timezone, { games_played: 1 }, { last_activity_at: nowIso, top_activity: gameId });
          } else if (event === 'GAME_COMPLETED') {
            await bumpDailySummary(admin, session.childId, family.timezone, { games_completed: 1, xp_earned: xpEarned || 0 }, { last_activity_at: nowIso, top_activity: gameId });
          } else if (event === 'LESSON_COMPLETED') {
            await bumpDailySummary(admin, session.childId, family.timezone, { lessons_completed: 1, xp_earned: xpEarned || 0 }, { last_activity_at: nowIso });
          } else if (event === 'QUEST_COMPLETED') {
            await bumpDailySummary(admin, session.childId, family.timezone, { quests_completed: 1, xp_earned: xpEarned || 0 }, { last_activity_at: nowIso });
          } else if (event === 'ACHIEVEMENT_EARNED') {
            await bumpDailySummary(admin, session.childId, family.timezone, { achievements_earned: 1, xp_earned: xpEarned || 0 }, { last_activity_at: nowIso });
          } else if (event === 'XP_EARNED') {
            await bumpDailySummary(admin, session.childId, family.timezone, { xp_earned: xpEarned || 0 }, { last_activity_at: nowIso });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      recorded: true,
      event,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    );
  }
}
