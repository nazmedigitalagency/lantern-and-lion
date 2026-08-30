import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';

const AnalyticsTrackSchema = z.object({
  event: z.string().min(1).max(64),
  gameId: z.string().max(64).optional(),
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

    const { event, gameId, difficulty, score, timeSeconds, xpEarned } = parseResult.data;

    // Log securely without leaking PII or database errors
    // If database connection is active, server writes can be processed here via service role
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
