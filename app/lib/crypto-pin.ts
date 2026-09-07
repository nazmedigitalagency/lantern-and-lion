import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(pbkdf2);

const HASH_PREFIX = '$pbkdf2$v1$';
const ITERATIONS = 100_000;
const KEY_LEN = 32;
const DIGEST = 'sha256';

/**
 * Hashes a 4-digit PIN using PBKDF2 with SHA-256 and a random 16-byte salt.
 * Output format: $pbkdf2$v1$<iterations>$<saltHex>$<hashHex>
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await pbkdf2Async(pin, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `${HASH_PREFIX}${ITERATIONS}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Checks if a stored PIN string is already in the PBKDF2 hashed format.
 */
export function isHashedPin(storedPin: string | null | undefined): boolean {
  if (!storedPin) return false;
  return storedPin.startsWith(HASH_PREFIX);
}

/**
 * Verifies a candidate PIN against stored PIN string.
 * Supports:
 * 1. Modern PBKDF2 hashed format ($pbkdf2$v1$...) using timing-safe comparison.
 * 2. Legacy plaintext 4-digit string, signaling `needsUpgrade: true` so caller can upgrade it.
 */
export async function verifyPin(
  candidatePin: string,
  storedPin: string | null | undefined
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (!candidatePin || !storedPin) {
    return { valid: false, needsUpgrade: false };
  }

  // 1. If stored in PBKDF2 format
  if (storedPin.startsWith(HASH_PREFIX)) {
    const parts = storedPin.slice(HASH_PREFIX.length).split('$');
    if (parts.length !== 3) {
      return { valid: false, needsUpgrade: false };
    }

    const [iterStr, salt, expectedHashHex] = parts;
    const iterations = parseInt(iterStr, 10);
    if (isNaN(iterations) || !salt || !expectedHashHex) {
      return { valid: false, needsUpgrade: false };
    }

    try {
      const derivedKey = await pbkdf2Async(candidatePin, salt, iterations, KEY_LEN, DIGEST);
      const expectedBuf = Buffer.from(expectedHashHex, 'hex');

      if (derivedKey.length !== expectedBuf.length) {
        return { valid: false, needsUpgrade: false };
      }

      const valid = timingSafeEqual(derivedKey, expectedBuf);
      return { valid, needsUpgrade: false };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  // 2. Legacy Plaintext check (timing-safe comparison)
  const candidateBuf = Buffer.from(candidatePin);
  const storedBuf = Buffer.from(storedPin);

  if (candidateBuf.length === storedBuf.length && timingSafeEqual(candidateBuf, storedBuf)) {
    return { valid: true, needsUpgrade: true };
  }

  return { valid: false, needsUpgrade: false };
}
