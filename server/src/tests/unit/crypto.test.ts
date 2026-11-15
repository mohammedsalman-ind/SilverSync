import { describe, it, expect } from 'vitest';
import {
  generateInviteCode,
  hashInviteCode,
  verifyInviteCode,
  constantTimeCompare,
} from '../../utils/crypto';

describe('Crypto & Invite Security Unit Tests', () => {
  it('should generate an 8-character invite code', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
  });

  it('should strictly use unambiguous characters (no 0, O, 1, I, l)', () => {
    const ambiguousChars = ['0', 'O', '1', 'I', 'l'];
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode();
      for (const char of ambiguousChars) {
        expect(code).not.toContain(char);
      }
    }
  });

  it('should generate unique codes across multiple calls', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateInviteCode());
    }
    expect(codes.size).toBe(100);
  });

  it('should deterministically hash invite codes with SHA-256', () => {
    const code = 'ABCDEFGH';
    const hash1 = hashInviteCode(code);
    const hash2 = hashInviteCode(code);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it('should normalize lowercase and whitespace when hashing', () => {
    const hashUpper = hashInviteCode('ABCDEFGH');
    const hashLower = hashInviteCode('  abcdefgh  ');
    expect(hashLower).toBe(hashUpper);
  });

  it('should verify matching invite code in constant time', () => {
    const code = generateInviteCode();
    const hash = hashInviteCode(code);
    expect(verifyInviteCode(code, hash)).toBe(true);
    expect(verifyInviteCode('WRONGCOD', hash)).toBe(false);
  });

  it('should return false when verifying with empty or invalid parameters', () => {
    expect(verifyInviteCode('', 'somehash')).toBe(false);
    expect(verifyInviteCode('CODE', '')).toBe(false);
  });

  it('should correctly compare strings in constant time', () => {
    const secret = 'super-secret-cron-key-12345';
    expect(constantTimeCompare(secret, secret)).toBe(true);
    expect(constantTimeCompare(secret, 'wrong-secret-key-12345')).toBe(false);
    expect(constantTimeCompare('', secret)).toBe(false);
  });
});
