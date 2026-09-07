import { randomUUID } from 'crypto';

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  detectedMimeType?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

/**
 * Sniffs buffer header magic bytes to detect actual binary format.
 */
export function detectMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF ... WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}

/**
 * Validates an uploaded file buffer and metadata against security constraints:
 * 1. File size limit
 * 2. Magic byte binary verification (anti-spoofing)
 * 3. MIME type allowlist (strict - blocks SVG and executables)
 * 4. Generates a secure, sanitized UUID filename
 */
export function validateUploadedFile(
  buffer: Buffer,
  declaredMimeType: string,
  originalFilename?: string,
  options: FileValidationOptions = {}
): ValidationResult {
  const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE;
  const allowedTypes = options.allowedMimeTypes || ALLOWED_MIME_TYPES;

  // 1. Check file size
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file payload' };
  }

  if (buffer.length > maxSize) {
    return { valid: false, error: `File exceeds maximum allowed size of ${Math.round(maxSize / (1024 * 1024))}MB` };
  }

  // 2. Explicitly reject SVG to prevent Stored XSS
  const lowerDeclared = declaredMimeType.toLowerCase().trim();
  if (
    lowerDeclared.includes('svg') ||
    (originalFilename && originalFilename.toLowerCase().endsWith('.svg'))
  ) {
    return { valid: false, error: 'SVG files are not permitted for security reasons' };
  }

  // 3. Verify magic bytes
  const detectedMime = detectMagicBytes(buffer);
  if (!detectedMime) {
    return { valid: false, error: 'File format could not be verified or binary signature is unrecognized' };
  }

  // 4. Verify against allowlist
  if (!allowedTypes.includes(detectedMime)) {
    return { valid: false, error: `File type ${detectedMime} is not allowed` };
  }

  // 5. Generate secure randomized filename to prevent directory traversal
  const safeExtension = MIME_EXTENSION_MAP[detectedMime] || '.bin';
  const sanitizedFilename = `${randomUUID()}${safeExtension}`;

  return {
    valid: true,
    sanitizedFilename,
    detectedMimeType: detectedMime,
  };
}
