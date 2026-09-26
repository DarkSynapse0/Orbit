import { PublicKey } from '@solana/web3.js';

// Small input-validation helpers. Every amount/address that reaches the ledger or
// the chain must pass through here so NaN/negative/huge/malformed values can't
// corrupt state or throw raw web3 errors at the edge.

export class BadRequest extends Error {}

/** Parse a USD amount: finite, > 0, and within a sane ceiling. */
export function parseAmount(v: unknown, { max = 1_000_000, min = 0.01 }: { max?: number; min?: number } = {}): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) throw new BadRequest('amount must be a number');
  if (n < min) throw new BadRequest(`amount must be at least ${min}`);
  if (n > max) throw new BadRequest(`amount must be at most ${max}`);
  // Clamp to cents to avoid float dust flowing into base-unit conversion.
  return Math.round(n * 100) / 100;
}

/** Validate a base58 Solana address and return its canonical form. */
export function parseAddress(v: unknown): string {
  if (typeof v !== 'string' || v.length < 32 || v.length > 44) throw new BadRequest('invalid address');
  try {
    return new PublicKey(v).toBase58();
  } catch {
    throw new BadRequest('invalid address');
  }
}

/** Validate a userId-like string (bounded, safe characters). */
export function parseUserId(v: unknown, fallback = 'demo'): string {
  if (v == null) return fallback;
  if (typeof v !== 'string' || v.length > 128 || !/^[\w.@:-]+$/.test(v)) throw new BadRequest('invalid userId');
  return v;
}
