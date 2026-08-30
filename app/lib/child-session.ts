import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Children/teens don't have real Supabase Auth accounts (PIN login only), so
 * this is their equivalent of a session: a compact HMAC-signed token the
 * server can verify without a DB round trip, backed by a `child_sessions`
 * row for activity tracking. Never trust a client-supplied child/family id
 * without verifying it through this token.
 */

const COOKIE_NAME = 'll_child_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type ChildSessionPayload = {
  sessionId: string;
  childId: string;
  familyId: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.CHILD_SESSION_SECRET;
  if (!secret) {
    throw new Error('CHILD_SESSION_SECRET is not configured on the server.');
  }
  return secret;
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createChildSessionToken(payload: Omit<ChildSessionPayload, 'exp'>): { token: string; sessionId: string; expiresAt: Date } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const full: ChildSessionPayload = { ...payload, exp };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  const signature = sign(body);
  return { token: `${body}.${signature}`, sessionId: full.sessionId, expiresAt: new Date(exp * 1000) };
}

export function verifyChildSessionToken(token: string | undefined | null): ChildSessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ChildSessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sessionId || !payload.childId || !payload.familyId) return null;
    return payload;
  } catch {
    return null;
  }
}

export function newSessionId(): string {
  return randomUUID();
}

export async function setChildSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearChildSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getChildSessionFromCookies(): Promise<ChildSessionPayload | null> {
  const cookieStore = await cookies();
  return verifyChildSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}
