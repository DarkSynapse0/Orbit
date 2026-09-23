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

/** One tier of the set-aside rule: a purchase >= minAmountUsd sets aside setAsideUsd. */
export interface SetAsideTier {
  minAmountUsd: number;
  setAsideUsd: number;
}

/**
 * Orbit's default tiered rule (not literal round-ups — those are too small to matter).
 * Tunable; see the doc's "Product Direction" open question on final numbers.
 */
export const DEFAULT_TIERS: SetAsideTier[] = [
  { minAmountUsd: 500, setAsideUsd: 10 },
  { minAmountUsd: 100, setAsideUsd: 5 },
];

/** USDC that must accumulate before we convert + deposit on-chain (the batching threshold). */
export const DEFAULT_THRESHOLD_USD = 10;

/**
 * How much to set aside for a purchase under the tiered rule.
 * Tiers are evaluated highest-first; returns 0 when no tier matches.
 */
export function computeSetAside(
  amountUsd: number,
  tiers: SetAsideTier[] = DEFAULT_TIERS,
): number {
  const sorted = [...tiers].sort((a, b) => b.minAmountUsd - a.minAmountUsd);
  for (const tier of sorted) {
    if (amountUsd >= tier.minAmountUsd) return tier.setAsideUsd;
  }
  return 0;
}

/**
 * Per-user savings state.
 * - pendingUsd  = earmarked but NOT yet moved on-chain (the dollars still sit in the user's bank).
 * - investedUsd = delivered as USDC and deposited into the yield vault (the chamber).
 */
export interface SavingsState {
  userId: string;
  pendingUsd: number;
  investedUsd: number;
  lastDepositSig?: string;
}
