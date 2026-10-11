import crypto from 'node:crypto';

// Password hashing with Node's built-in scrypt — no external dependency, and a
// per-password random salt. Stored as "scrypt$N$saltHex$keyHex" so the cost
// parameter travels with the hash and old hashes stay verifiable if we tune it.
const N = 16384; // CPU/memory cost (2^14)
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${salt.toString('hex')}$${key.toString('hex')}`;
}

/** Constant-time verify of a password against a stored "scrypt$N$salt$key" hash. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, nStr, saltHex, keyHex] = stored.split('$');
    if (scheme !== 'scrypt' || !nStr || !saltHex || !keyHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    const key = crypto.scryptSync(password, salt, expected.length, { N: Number(nStr), r: R, p: P });
    return key.length === expected.length && crypto.timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
