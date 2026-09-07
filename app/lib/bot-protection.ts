/**
 * Common bot / automated crawler signatures that should never be submitting user forms.
 */
const BOT_USER_AGENTS = [
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /python-requests/i,
  /curl\//i,
  /wget\//i,
  /httpclient/i,
  /go-http-client/i,
  /scrapy/i,
  /sqlmap/i,
];

export interface HeaderCarrier {
  headers: {
    get(name: string): string | null;
  };
}

/**
 * Validates request for signs of bot activity:
 * 1. Checks honeypot field in body (if provided)
 * 2. Checks User-Agent for known scraping/attack tooling
 */
export function checkBotProtection(
  req: HeaderCarrier,
  body?: Record<string, unknown> | null
): { isBot: boolean; reason?: string } {
  // 1. Check Honeypot Fields
  if (body && typeof body === 'object') {
    const honeypotKeys = ['_hp', 'honeypot', 'website', 'hp_email', '_trap'];
    for (const key of honeypotKeys) {
      if (key in body && body[key]) {
        const val = String(body[key]).trim();
        if (val.length > 0) {
          return { isBot: true, reason: 'Honeypot field triggered' };
        }
      }
    }
  }

  // 2. Check User-Agent
  const userAgent = req.headers.get('user-agent');
  if (!userAgent || userAgent.trim().length === 0) {
    // Missing user agent on interactive POST endpoints is suspicious
    return { isBot: true, reason: 'Missing User-Agent header' };
  }

  for (const botRegex of BOT_USER_AGENTS) {
    if (botRegex.test(userAgent)) {
      return { isBot: true, reason: `Disallowed bot user-agent pattern` };
    }
  }

  return { isBot: false };
}
