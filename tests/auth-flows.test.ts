import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function sanitizeNextUrl(nextParam: string | null, defaultPath = '/teacher-dashboard'): string {
  if (!nextParam) return defaultPath;
  if (nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\')) {
    return nextParam;
  }
  return defaultPath;
}

function normalizeSession(user: { email: string; user_metadata?: { full_name?: string; name?: string } }, defaultRole = 'Teacher') {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email.split('@')[0] ||
    defaultRole;
  return { name, email: user.email.trim().toLowerCase() };
}

describe('Auth Flows & Security', () => {
  describe('OAuth Redirect URL Sanitization', () => {
    it('allows valid relative internal paths', () => {
      assert.equal(sanitizeNextUrl('/teacher-dashboard'), '/teacher-dashboard');
      assert.equal(sanitizeNextUrl('/parent-dashboard'), '/parent-dashboard');
      assert.equal(sanitizeNextUrl('/parent-access'), '/parent-access');
      assert.equal(sanitizeNextUrl('/teacher-dashboard?tab=classes'), '/teacher-dashboard?tab=classes');
    });

    it('falls back to default path when next is null or empty', () => {
      assert.equal(sanitizeNextUrl(null), '/teacher-dashboard');
      assert.equal(sanitizeNextUrl(''), '/teacher-dashboard');
      assert.equal(sanitizeNextUrl(null, '/parent-dashboard'), '/parent-dashboard');
    });

    it('blocks protocol-relative open redirect attacks', () => {
      assert.equal(sanitizeNextUrl('//evil.com/phishing'), '/teacher-dashboard');
      assert.equal(sanitizeNextUrl('//google.com'), '/teacher-dashboard');
    });

    it('blocks absolute external URLs', () => {
      assert.equal(sanitizeNextUrl('https://evil.com'), '/teacher-dashboard');
      assert.equal(sanitizeNextUrl('http://evil.com'), '/teacher-dashboard');
      assert.equal(sanitizeNextUrl('javascript:alert(1)'), '/teacher-dashboard');
    });

    it('blocks backslash escape sequences', () => {
      assert.equal(sanitizeNextUrl('/\\evil.com'), '/teacher-dashboard');
    });
  });

  describe('Session Normalization', () => {
    it('prefers full_name over email prefix', () => {
      const session = normalizeSession({
        email: 'teacher@lanternandlion.com',
        user_metadata: { full_name: 'Pastor Grace' }
      });
      assert.equal(session.name, 'Pastor Grace');
      assert.equal(session.email, 'teacher@lanternandlion.com');
    });

    it('falls back to name or email prefix if full_name is missing', () => {
      const session = normalizeSession({
        email: 'john.doe@example.com',
        user_metadata: {}
      });
      assert.equal(session.name, 'john.doe');
      assert.equal(session.email, 'john.doe@example.com');
    });

    it('lowercases and trims email addresses', () => {
      const session = normalizeSession({
        email: '  TEACHER@LanternAndLion.COM  ',
        user_metadata: { name: 'Teacher Dave' }
      });
      assert.equal(session.email, 'teacher@lanternandlion.com');
    });
  });
});
