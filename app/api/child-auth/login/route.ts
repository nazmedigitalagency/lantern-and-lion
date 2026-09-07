import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, isLockedOut, recordFailedAttempt, resetFailedAttempts } from '../../../lib/rate-limit';
import { checkBotProtection } from '../../../lib/bot-protection';
import { verifyPin, hashPin } from '../../../lib/crypto-pin';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { createChildSessionToken, newSessionId, setChildSessionCookie } from '../../../lib/child-session';
import { activityDateKey, bumpDailySummary, notifyOnce, recordActivityEvent } from '../../../lib/activity/server';

const LoginSchema = z.object({
  username: z.string().min(1).max(32),
  pin: z.string().regex(/^\d{4}$/),
  website: z.string().optional(), // Honeypot field
});

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`child-login:${clientIp}`, { maxRequests: 20, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a moment.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.resetSeconds) } });
  }

  const rawBody = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  // Bot Protection
  const botCheck = checkBotProtection(req, rawBody);
  if (botCheck.isBot) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a username and 4-digit PIN.' }, { status: 400 });
  }

  const cleanUsername = parsed.data.username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const lockoutKey = `child-lockout:${clientIp}:${cleanUsername}`;

  const lockoutStatus = isLockedOut(lockoutKey);
  if (lockoutStatus.locked) {
    return NextResponse.json(
      { error: `Account temporarily locked due to failed attempts. Please try again in ${Math.ceil(lockoutStatus.resetSeconds / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(lockoutStatus.resetSeconds) } }
    );
  }

  const admin = createServerAdminClient();

  const { data: child } = await admin
    .from('children')
    .select('id, family_id, name, username, age, avatar, pin')
    .ilike('username', cleanUsername)
    .maybeSingle();

  if (!child) {
    recordFailedAttempt(lockoutKey);
    return NextResponse.json({ error: 'That username or PIN is not quite right.' }, { status: 401 });
  }

  const pinCheck = await verifyPin(parsed.data.pin, child.pin);
  if (!pinCheck.valid) {
    const attempt = recordFailedAttempt(lockoutKey, { maxAttempts: 5, lockoutSeconds: 900 });
    if (attempt.locked) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Account locked for 15 minutes.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }
    return NextResponse.json({ error: 'That username or PIN is not quite right.' }, { status: 401 });
  }

  // Reset lockout tracking on success
  resetFailedAttempts(lockoutKey);

  // Transparent, non-breaking upgrade of legacy plaintext PINs to PBKDF2 hash
  if (pinCheck.needsUpgrade) {
    const hashed = await hashPin(parsed.data.pin);
    await admin.from('children').update({ pin: hashed }).eq('id', child.id);
  }

  const { data: family } = await admin
    .from('families')
    .select('id, owner_id, timezone')
    .eq('id', child.family_id)
    .maybeSingle();
  if (!family) {
    return NextResponse.json({ error: 'This account is not fully set up yet.' }, { status: 409 });
  }

  const sessionId = newSessionId();
  const { token } = createChildSessionToken({ sessionId, childId: child.id, familyId: family.id });

  await admin.from('child_sessions').insert({ id: sessionId, child_id: child.id, token_hash: sessionId });
  await admin.from('children').update({ last_login_at: new Date().toISOString() }).eq('id', child.id);

  await recordActivityEvent(admin, { childId: child.id, familyId: family.id, sessionId, eventType: 'USER_LOGIN' });
  await recordActivityEvent(admin, { childId: child.id, familyId: family.id, sessionId, eventType: 'SESSION_STARTED' });

  const nowIso = new Date().toISOString();
  await bumpDailySummary(admin, child.id, family.timezone || 'UTC', { session_count: 1 }, { first_login_at: nowIso, last_activity_at: nowIso });

  const loginTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: family.timezone || 'UTC' });
  await notifyOnce(admin, {
    recipientId: family.owner_id,
    childId: child.id,
    type: 'LOGIN',
    title: `${child.name} is learning!`,
    body: `${child.name} logged into Lantern & Lion at ${loginTime}.`,
    payload: { childId: child.id, loginTime },
    dedupeKey: `login:${child.id}:${activityDateKey(family.timezone || 'UTC')}`,
  });

  await setChildSessionCookie(token);

  return NextResponse.json({
    success: true,
    child: { id: child.id, name: child.name, username: child.username, age: child.age, avatar: child.avatar },
  });
}
