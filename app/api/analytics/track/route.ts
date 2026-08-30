import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { bumpDailySummary, getFamilyForChild, notifyOnce, recordActivityEvent, type ActivityEventType } from '../../../lib/activity/server';
import { isStreakEligibleEvent } from '../../../lib/streak/config';
import { qualifyStreakDay } from '../../../lib/streak/server';
import { getConcept, resolveConceptId } from '../../../lib/adaptive/concepts';
import { recordConceptPractice } from '../../../lib/adaptive/server';

const AnalyticsTrackSchema = z.object({
  event: z.string().min(1).max(64),
  gameId: z.string().max(64).optional(),
  activityId: z.string().max(128).optional(),
  difficulty: z.string().max(32).optional(),
  category: z.string().max(64).optional(),
  score: z.number().int().min(0).max(1000000).optional(),
  accuracy: z.number().min(0).max(100).optional(),
  timeSeconds: z.number().int().min(0).max(86400).optional(),
  mistakes: z.number().int().min(0).max(10000).optional(),
  hintsUsed: z.number().int().min(0).max(100).optional(),
  attempts: z.number().int().min(0).max(1000).optional(),
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

    const { event, gameId, activityId, category, timeSeconds, mistakes, accuracy, hintsUsed, attempts, xpEarned } = parseResult.data;
    let streakResult: Awaited<ReturnType<typeof qualifyStreakDay>> | null = null;
    let masteryResult: Awaited<ReturnType<typeof recordConceptPractice>> | null = null;

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

          if (event === 'GAME_COMPLETED' || event === 'LESSON_COMPLETED') {
            const conceptId = resolveConceptId(gameId, category);
            if (conceptId) {
              // LESSON_COMPLETED has no graded accuracy today — fewer attempts
              // stands in as the correctness signal (first-try = strong, more
              // retries = still positive but weaker), never a raw fail/pass.
              const score = accuracy ?? (attempts ? Math.max(40, 100 - (attempts - 1) * 20) : 80);
              masteryResult = await recordConceptPractice(admin, session.childId, conceptId, { score, hintsUsed });

              if (masteryResult.justMastered) {
                const { data: child } = await admin.from('children').select('name').eq('id', session.childId).maybeSingle();
                const label = getConcept(masteryResult.row.concept_id)?.label || masteryResult.row.concept_id;
                await notifyOnce(admin, {
                  recipientId: family.ownerId,
                  childId: session.childId,
                  type: 'ACHIEVEMENT',
                  title: `🎉 ${child?.name || 'Your child'} mastered a concept!`,
                  body: `${child?.name || 'Your child'} has mastered "${label}" through consistent, correct practice.`,
                  payload: { conceptId: masteryResult.row.concept_id },
                  dedupeKey: `mastery:${session.childId}:${masteryResult.row.concept_id}`,
                });
              }
            }
          }

          if (isStreakEligibleEvent(event)) {
            streakResult = await qualifyStreakDay(admin, session.childId, family.timezone);
            if (streakResult.isNewQualification) {
              await recordActivityEvent(admin, { childId: session.childId, familyId: family.familyId, sessionId: session.sessionId, eventType: 'STREAK_EXTENDED', metadata: { streakDay: streakResult.streak.current_streak, graceUsed: streakResult.graceUsed } });
            }
            if (streakResult.newMilestone) {
              const { data: child } = await admin.from('children').select('name').eq('id', session.childId).maybeSingle();
              await notifyOnce(admin, {
                recipientId: family.ownerId,
                childId: session.childId,
                type: 'STREAK',
                title: `🔥 ${child?.name || 'Your child'} hit a ${streakResult.newMilestone.days}-day streak!`,
                body: `${child?.name || 'Your child'} has learned consistently for ${streakResult.newMilestone.days} days in a row — "${streakResult.newMilestone.label}".`,
                payload: { days: streakResult.newMilestone.days, coins: streakResult.newMilestone.coins, gems: streakResult.newMilestone.gems },
                dedupeKey: `streak:${session.childId}:${streakResult.newMilestone.days}`,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      recorded: true,
      event,
      timestamp: new Date().toISOString(),
      streak: streakResult
        ? {
            currentStreak: streakResult.streak.current_streak,
            longestStreak: streakResult.streak.longest_streak,
            graceDays: streakResult.streak.grace_days,
            isNewQualification: streakResult.isNewQualification,
            graceUsed: streakResult.graceUsed,
            streakReset: streakResult.streakReset,
            previousStreak: streakResult.previousStreak,
            newMilestone: streakResult.newMilestone,
          }
        : null,
      mastery: masteryResult
        ? { conceptId: masteryResult.row.concept_id, masteryScore: masteryResult.row.mastery_score, status: masteryResult.row.status, justMastered: masteryResult.justMastered }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    );
  }
}
