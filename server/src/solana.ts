import { config } from './config.js';
import { deliverUsdc, depositOnChain } from './onchain.js';

/**
 * HACKATHON MOCK — stands in for the one faked hop in the locked architecture:
 * Stripe pulling fiat from the bank, converting to USDC, and delivering it to
 * Orbit's on-chain vault. In production this becomes a real Stripe call; nothing
 * else in the pipeline changes. See doc "Money Movement Architecture (locked)".
 *
 * TODO (Week 2): drop real devnet USDC into the vault for this user.
 */
export async function simulateStripeDeposit(userId: string, amountUsd: number): Promise<void> {
  try {
    await deliverUsdc(amountUsd);
    console.log(`[stripe->usdc] minted ${amountUsd} USDC to the user wallet on ${config.solana.cluster}`);
  } catch (e) {
    console.error('[stripe->usdc] on-chain mint failed (continuing):', (e as Error).message);
  }
}

/**
 * Deposit the vault's USDC into the yield venue and return the tx signature.
 * TODO (Week 1): real deposit via the Anchor vault program (CPI to Kamino) or the
 * mock yield vault on devnet — decided by the Day-1 Kamino-devnet check.
 */
export async function depositToVault(userId: string, amountUsd: number): Promise<string> {
  try {
    const sig = await depositOnChain(amountUsd);
    console.log(`[deposit] ${amountUsd} USDC -> vault on-chain sig=${sig}`);
    return sig;
  } catch (e) {
    console.error('[deposit] on-chain deposit failed, using mock sig:', (e as Error).message);
    return `mock-sig-${Date.now()}`;
  }
}
