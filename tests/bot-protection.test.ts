import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkBotProtection, type HeaderCarrier } from '../app/lib/bot-protection.ts';

function createMockRequest(headers: Record<string, string> = {}): HeaderCarrier {
  const reqHeaders = new Headers(headers);
  return {
    headers: reqHeaders,
  };
}

describe('Security: Bot Protection and Honeypot Verification', () => {
  it('allows genuine human browser requests with clean body', () => {
    const req = createMockRequest({
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    });

    const result = checkBotProtection(req, { username: 'timmy', pin: '1234' });
    assert.equal(result.isBot, false);
  });

  it('detects and flags filled honeypot fields', () => {
    const req = createMockRequest({
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    const result = checkBotProtection(req, { username: 'spammer', website: 'https://spam.com' });
    assert.equal(result.isBot, true);
    assert.equal(result.reason, 'Honeypot field triggered');
  });

  it('detects and flags suspicious scraping / automated attack user agents', () => {
    const automatedAgents = [
      'HeadlessChrome/90.0.4430.212',
      'python-requests/2.25.1',
      'Puppeteer Extra Stealth',
      'sqlmap/1.5#stable',
    ];

    for (const agent of automatedAgents) {
      const req = createMockRequest({ 'user-agent': agent });
      const result = checkBotProtection(req);
      assert.equal(result.isBot, true, `Should flag ${agent} as a bot`);
    }
  });

  it('flags requests with missing User-Agent headers', () => {
    const req = createMockRequest({});
    const result = checkBotProtection(req);
    assert.equal(result.isBot, true);
    assert.equal(result.reason, 'Missing User-Agent header');
  });
});
