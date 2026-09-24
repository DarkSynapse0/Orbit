import { config } from './config.js';
import { deliverUsdc, depositOnChain } from './onchain.js';

/**
 * HACKATHON MOCK — stands in for the one faked hop in the locked architecture:
 * Stripe pulling fiat from the bank, converting to USDC, and delivering it to
 * Orbit's settlement wallet (the funder). In production this becomes a real Stripe
 * call; nothing else in the pipeline changes. See doc "Money Movement Architecture".
 *
 * Here we mint test USDC into the server's (funder's) token account, ready to be
 * deposited into the user's own vault.
 */
export async function simulateStripeDeposit(amountUsd: number): Promise<void> {
  try {
    await deliverUsdc(amountUsd);
    console.log(`[stripe->usdc] minted ${amountUsd} test USDC to the funder wallet on ${config.solana.cluster}`);
  } catch (e) {
    console.error('[stripe->usdc] on-chain mint failed (continuing):', (e as Error).message);
  }
}

/**
 * Deposit USDC from the funder into the user's own on-chain vault and return the tx
 * signature. The user (owner) is the only key that can withdraw.
 */
export async function depositToVault(ownerAddress: string, amountUsd: number): Promise<string> {
  try {
    const sig = await depositOnChain(ownerAddress, amountUsd);
    console.log(`[deposit] ${amountUsd} USDC -> ${ownerAddress}'s vault, sig=${sig}`);
    return sig;
  } catch (e) {
    console.error('[deposit] on-chain deposit failed, using mock sig:', (e as Error).message);
    return `mock-sig-${Date.now()}`;
  }
}
