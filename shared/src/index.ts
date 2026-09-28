// Orbit shared domain types + the set-aside logic.
// Imported by both the frontend (app) and the backend (server) so the rule
// lives in exactly one place. See the doc "Product Direction" + "Money Movement Architecture".

/** A detected purchase from the user's spending source (Plaid now; on-chain activity later). */
export interface Purchase {
  id: string;
  userId: string;
  amountUsd: number; // positive = money spent
  merchantName?: string;
  detectedAt: string; // ISO timestamp
}

/**
 * Orbit's set-aside rule: a percentage of each purchase (not a fixed amount, and not
 * literal round-ups — those are too small to matter). The user picks their own rate
 * within a safe band; higher saves faster, lower is gentler on cash flow.
 */
export const DEFAULT_SET_ASIDE_PCT = 2; // 2% of each purchase
export const MIN_SET_ASIDE_PCT = 0.5;
export const MAX_SET_ASIDE_PCT = 5;

/** Keep a chosen rate inside the allowed 0.5%–5% band. */
export const clampSetAsidePct = (pct: number): number =>
  Math.min(MAX_SET_ASIDE_PCT, Math.max(MIN_SET_ASIDE_PCT, Number.isFinite(pct) ? pct : DEFAULT_SET_ASIDE_PCT));

/** USDC that must accumulate before we convert + deposit on-chain (the batching threshold). */
export const DEFAULT_THRESHOLD_USD = 10;

/**
 * How much to set aside for a purchase: `pct` percent of the amount, rounded to cents.
 * `pct` is clamped to the 0.5%–5% band; a non-positive amount sets aside nothing.
 */
export function computeSetAside(amountUsd: number, pct: number = DEFAULT_SET_ASIDE_PCT): number {
  if (!(amountUsd > 0)) return 0;
  const p = clampSetAsidePct(pct);
  return Math.round(amountUsd * p) / 100; // amountUsd * (p/100), rounded to cents
}

/**
 * Per-user savings state.
 * - pendingUsd  = earmarked but NOT yet moved on-chain (the dollars still sit in the user's bank).
 * - investedUsd = delivered as USDC and deposited into the yield vault (the chamber).
 * - setAsidePct = the user's chosen set-aside rate (% of each purchase, 0.5–5).
 */
export interface SavingsState {
  userId: string;
  pendingUsd: number;
  investedUsd: number;
  setAsidePct?: number;
  lastDepositSig?: string;
}
