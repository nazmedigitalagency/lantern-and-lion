import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPin, verifyPin, isHashedPin } from '../app/lib/crypto-pin.ts';

describe('Security: PIN Hashing and Timing-Safe Verification', () => {
  it('hashes a 4-digit PIN in PBKDF2 format', async () => {
    const pin = '2468';
    const hash = await hashPin(pin);

    assert.ok(isHashedPin(hash), 'Hash should start with PBKDF2 prefix');
    assert.notEqual(hash, pin, 'Hash must not equal plaintext PIN');
    assert.ok(hash.includes('$100000$'), 'Hash should contain 100,000 iterations');
  });

  it('verifies a valid candidate PIN against hashed PIN', async () => {
    const pin = '1357';
    const hash = await hashPin(pin);

    const result = await verifyPin(pin, hash);
    assert.equal(result.valid, true);
    assert.equal(result.needsUpgrade, false);
  });

  it('rejects an invalid candidate PIN', async () => {
    const pin = '1357';
    const hash = await hashPin(pin);

    const result = await verifyPin('9999', hash);
    assert.equal(result.valid, false);
  });

  it('handles legacy plaintext PIN and flags for upgrade', async () => {
    const legacyPlainPin = '4321';

    const result = await verifyPin('4321', legacyPlainPin);
    assert.equal(result.valid, true);
    assert.equal(result.needsUpgrade, true, 'Legacy plaintext PIN should signal needsUpgrade: true');
  });

  it('rejects empty or null candidate PINs gracefully', async () => {
    const result1 = await verifyPin('', '2468');
    assert.equal(result1.valid, false);

    const result2 = await verifyPin('2468', null);
    assert.equal(result2.valid, false);
  });
});
