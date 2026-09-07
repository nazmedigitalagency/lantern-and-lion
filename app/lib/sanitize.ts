/**
 * HTML entities map for escaping untrusted content before rendering or storage.
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes characters with special meaning in HTML to prevent XSS.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitizes plain user-submitted text by:
 * 1. Removing null bytes and ASCII control characters (except newline/tab/carriage return).
 * 2. Stripping HTML tags (<script>, <iframe>, <style>, etc.).
 * 3. Neutralizing javascript: and data: pseudo-protocols.
 * 4. Trimming extraneous whitespace.
 */
export function sanitizeText(str: string, maxLength = 2000): string {
  if (!str || typeof str !== 'string') return '';

  let clean = str
    // Strip entire script, style, and iframe blocks including contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove null bytes and non-printable control characters (except \n, \r, \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip remaining HTML tags completely
    .replace(/<[^>]*>?/gm, '')
    // Neutralize script pseudo-protocols
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    .trim();

  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean;
}
