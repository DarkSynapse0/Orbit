import { Router } from 'express';
import { computeSetAside, DEFAULT_TIERS } from '@orbit/shared';
import { addPending, moveToInvested, getState, resetState } from '../ledger.js';
import { simulateStripeDeposit, depositToVault } from '../solana.js';
import { withdrawAllOnChain } from '../onchain.js';
import { isConfigured, hasItem, connectSandbox, syncTransactions, clearItem } from '../plaidClient.js';
import { config } from '../config.js';

export const plaidRouter = Router();

// Shared pipeline: earmark -> threshold -> (mock Stripe) -> real on-chain deposit.
async function runPipeline(userId: string, amountUsd: number) {
  const setAside = computeSetAside(amountUsd, DEFAULT_TIERS);
  if (setAside > 0) addPending(userId, setAside);

  const state = getState(userId);
  let deposited = false;
  let batch = 0;
  if (state.pendingUsd >= config.thresholdUsd) {
    batch = state.pendingUsd;
    await simulateStripeDeposit(userId, batch);
    const sig = await depositToVault(userId, batch);
    moveToInvested(userId, batch, sig);
    deposited = true;
  }
  return { setAside, deposited, batch };
}

/** Is Plaid configured (keys present) and is a sandbox bank connected? */
plaidRouter.get('/status', (_req, res) => {
  res.json({ configured: isConfigured(), connected: hasItem() });
});

/** Plaid webhook (SYNC_UPDATES_AVAILABLE). For the demo we sync on demand instead. */
plaidRouter.post('/webhook', async (_req, res) => {
  res.json({ received: true });
});

/** Connect a sandbox bank via Plaid. */
plaidRouter.post('/connect', async (_req, res) => {
  if (!isConfigured()) {
    res.status(400).json({ error: 'Plaid keys not set in server/.env' });
    return;
  }
  try {
    await connectSandbox();
    res.json({ connected: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Pull real transactions from Plaid sandbox and run each purchase through the pipeline. */
plaidRouter.post('/sync', async (req, res) => {
  const userId = (req.body?.userId as string) ?? 'demo';
  if (!isConfigured()) {
    res.status(400).json({ error: 'Plaid keys not set in server/.env' });
    return;
  }
  try {
    const purchases = await syncTransactions();
    const processed = [];
    for (const p of purchases) {
      const r = await runPipeline(userId, p.amountUsd);
      processed.push({ name: p.name, amountUsd: p.amountUsd, setAside: r.setAside, deposited: r.deposited });
      if (r.deposited) await new Promise((res) => setTimeout(res, 800)); // ease off the RPC between deposits
    }
    res.json({ processed, state: getState(userId) });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Demo endpoint: push one purchase through the pipeline. */
plaidRouter.post('/simulate-purchase', async (req, res) => {
  const userId = (req.body?.userId as string) ?? 'demo';
  const amountUsd = Number(req.body?.amountUsd);
  const r = await runPipeline(userId, amountUsd);
  res.json({ setAside: r.setAside, deposited: r.deposited, state: getState(userId) });
});

/** Reset a user's savings state (demo replay). */
plaidRouter.post('/reset', async (req, res) => {
  const userId = (req.body?.userId as string) ?? 'demo';
  try {
    await withdrawAllOnChain();
  } catch (e) {
    console.error('[reset] on-chain withdraw failed:', (e as Error).message);
  }
  clearItem();
  res.json({ state: resetState(userId) });
});
