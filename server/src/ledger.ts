import type { SavingsState } from '@orbit/shared';

// In-memory earmark ledger for the demo. Swap for a real DB later.
// "pending" = earmarked, dollars still in the user's bank; "invested" = USDC in the vault.
const states = new Map<string, SavingsState>();

export function getState(userId: string): SavingsState {
  let s = states.get(userId);
  if (!s) {
    s = { userId, pendingUsd: 0, investedUsd: 0 };
    states.set(userId, s);
  }
  return s;
}

/** Earmark a set-aside. No money moves — it's just accounting until the threshold fires. */
export function addPending(userId: string, amountUsd: number): SavingsState {
  const s = getState(userId);
  s.pendingUsd += amountUsd;
  return s;
}

/** Move a batch from pending -> invested once it's been delivered on-chain. */
export function moveToInvested(userId: string, amountUsd: number, sig: string): SavingsState {
  const s = getState(userId);
  s.pendingUsd -= amountUsd;
  s.investedUsd += amountUsd;
  s.lastDepositSig = sig;
  return s;
}

/** Clear a user's state (demo replay). */
export function resetState(userId: string): SavingsState {
  states.delete(userId);
  return getState(userId);
}
