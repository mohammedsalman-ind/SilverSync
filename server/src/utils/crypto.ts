import crypto from 'crypto';

// Unambiguous alphabet (excluding 0, O, 1, I, l) to prevent visual confusion for elderly and family members
const UNAMBIGUOUS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates an 8-character cryptographically secure random invite code.
 */
export function generateInviteCode(): string {
  let code = '';
  const alphabetLength = UNAMBIGUOUS_ALPHABET.length;
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, alphabetLength);
    code += UNAMBIGUOUS_ALPHABET[randomIndex];
  }
  return code;
}

/**
 * Computes the SHA-256 hash of an invite code.
 */
export function hashInviteCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Constant-time comparison of a provided code with a stored hash.
 */
export function verifyInviteCode(providedCode: string, storedHash: string): boolean {
  if (!providedCode || !storedHash) {
    return false;
  }
  const computedHash = hashInviteCode(providedCode);
  const bufA = Buffer.from(computedHash, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Constant-time comparison for secrets (e.g. CRON_SECRET).
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
