import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeText, escapeHtml } from '../app/lib/sanitize.ts';

describe('Security: Input Sanitization and XSS Prevention', () => {
  it('strips dangerous HTML and script tags from text input', () => {
    const malicious = '<script>alert("XSS")</script>Hello World<b>!</b>';
    const clean = sanitizeText(malicious);

    assert.equal(clean, 'Hello World!');
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('</script>'));
  });

  it('neutralizes javascript: pseudo-protocols', () => {
    const malicious = 'Check this link: javascript:void(document.cookie)';
    const clean = sanitizeText(malicious);

    assert.ok(!clean.toLowerCase().includes('javascript:'));
  });

  it('removes null bytes and control characters', () => {
    const inputWithNulls = 'Hello\x00\x01\x02World';
    const clean = sanitizeText(inputWithNulls);

    assert.equal(clean, 'HelloWorld');
  });

  it('escapes special HTML characters accurately', () => {
    const raw = `<img src="x" onerror='alert(1)'> & "friends"`;
    const escaped = escapeHtml(raw);

    assert.equal(escaped, '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt; &amp; &quot;friends&quot;');
  });

  it('respects maxLength and truncates excessive payload sizes', () => {
    const longString = 'a'.repeat(500);
    const clean = sanitizeText(longString, 50);

    assert.equal(clean.length, 50);
  });
});
