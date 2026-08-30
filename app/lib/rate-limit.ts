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
