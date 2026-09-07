import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic garbage collection to prevent memory leaks from expired rate limit entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60 * 1000);
}

export interface RateLimitOptions {
  /** Maximum requests allowed within window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Extracts a client identifier from NextRequest (IP, CF connecting IP, or x-forwarded-for).
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  return '127.0.0.1';
}

/**
 * Checks if the request exceeds the rate limit for the given key/IP.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 60, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const existing = rateLimitMap.get(identifier);

  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetSeconds: options.windowSeconds,
    };
  }

  if (existing.count >= options.maxRequests) {
    const resetSeconds = Math.ceil((existing.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  existing.count += 1;
  const resetSeconds = Math.ceil((existing.resetTime - now) / 1000);
  return {
    allowed: true,
    remaining: options.maxRequests - existing.count,
    resetSeconds: Math.max(1, resetSeconds),
  };
}

interface LockoutRecord {
  failedCount: number;
  lockoutUntil: number;
}

const lockoutMap = new Map<string, LockoutRecord>();

/**
 * Checks if an identifier is currently locked out from login attempts.
 */
export function isLockedOut(identifier: string): { locked: boolean; resetSeconds: number } {
  const now = Date.now();
  const record = lockoutMap.get(identifier);
  if (!record) return { locked: false, resetSeconds: 0 };

  if (record.lockoutUntil > now) {
    const resetSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
    return { locked: true, resetSeconds: Math.max(1, resetSeconds) };
  }

  // Lockout expired
  if (record.lockoutUntil !== 0) {
    lockoutMap.delete(identifier);
  }

  return { locked: false, resetSeconds: 0 };
}

/**
 * Records a failed credential attempt and locks out if threshold is reached.
 */
export function recordFailedAttempt(
  identifier: string,
  options: { maxAttempts: number; lockoutSeconds: number } = { maxAttempts: 5, lockoutSeconds: 900 }
): { locked: boolean; remainingAttempts: number; lockoutResetSeconds: number } {
  const now = Date.now();
  const record = lockoutMap.get(identifier) || { failedCount: 0, lockoutUntil: 0 };

  record.failedCount += 1;
  if (record.failedCount >= options.maxAttempts) {
    record.lockoutUntil = now + options.lockoutSeconds * 1000;
    lockoutMap.set(identifier, record);
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutResetSeconds: options.lockoutSeconds,
    };
  }

  lockoutMap.set(identifier, record);
  return {
    locked: false,
    remainingAttempts: Math.max(0, options.maxAttempts - record.failedCount),
    lockoutResetSeconds: 0,
  };
}

/**
 * Resets failed attempts after a successful authentication.
 */
export function resetFailedAttempts(identifier: string): void {
  lockoutMap.delete(identifier);
}

