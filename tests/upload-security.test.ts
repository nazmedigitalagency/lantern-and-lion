import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateUploadedFile, detectMagicBytes } from '../app/lib/upload-security.ts';

describe('Security: File Upload Restrictions & Binary Verification', () => {
  // Mock genuine PNG buffer: 89 50 4E 47 0D 0A 1A 0A
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);

  // Mock genuine JPEG buffer: FF D8 FF E0
  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

  it('detects magic bytes for genuine PNG image', () => {
    const mime = detectMagicBytes(validPngBuffer);
    assert.equal(mime, 'image/png');
  });

  it('detects magic bytes for genuine JPEG image', () => {
    const mime = detectMagicBytes(validJpegBuffer);
    assert.equal(mime, 'image/jpeg');
  });

  it('approves a valid PNG upload and generates secure UUID filename', () => {
    const result = validateUploadedFile(validPngBuffer, 'image/png', 'my-avatar.png');
    assert.equal(result.valid, true);
    assert.ok(result.sanitizedFilename?.endsWith('.png'));
    assert.notEqual(result.sanitizedFilename, 'my-avatar.png', 'Filename must be randomized UUID');
  });

  it('rejects spoofed files (text file disguised with image/png)', () => {
    const fakeBuffer = Buffer.from('console.log("malicious code");');
    const result = validateUploadedFile(fakeBuffer, 'image/png', 'innocent.png');

    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('signature is unrecognized'));
  });

  it('strictly rejects SVG files to prevent stored XSS attacks', () => {
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const result = validateUploadedFile(svgBuffer, 'image/svg+xml', 'vector.svg');

    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('SVG files are not permitted'));
  });

  it('rejects files exceeding maximum size limit', () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    // Set PNG header
    bigBuffer[0] = 0x89;
    bigBuffer[1] = 0x50;
    bigBuffer[2] = 0x4e;
    bigBuffer[3] = 0x47;
    bigBuffer[4] = 0x0d;
    bigBuffer[5] = 0x0a;
    bigBuffer[6] = 0x1a;
    bigBuffer[7] = 0x0a;

    const result = validateUploadedFile(bigBuffer, 'image/png', 'big.png', { maxSizeBytes: 5 * 1024 * 1024 });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('maximum allowed size'));
  });
});
