import { Router } from 'express';
import { computeSetAside, DEFAULT_TIERS } from '@orbit/shared';
import { addPending, moveToInvested, getState, resetState } from '../ledger.js';
import { simulateStripeDeposit, depositToVault } from '../solana.js';
import { isConfigured, hasItem, connectSandbox, syncTransactions, clearItem } from '../plaidClient.js';
import { config } from '../config.js';

export const plaidRouter = Router();

// Shared pipeline: earmark -> threshold -> (mock Stripe) -> real deposit into the user's vault.
// `wallet` is the connected user's address (the vault owner). Without it we can still earmark,
// but the deposit waits until a wallet is connected — the money stays in the bank until then.
async function runPipeline(userId: string, amountUsd: number, wallet?: string) {
  const setAside = computeSetAside(amountUsd, DEFAULT_TIERS);
  if (setAside > 0) addPending(userId, setAside);

  const state = getState(userId);
  let deposited = false;
  let needsWallet = false;
  let depositError: string | undefined;
  let batch = 0;
  if (state.pendingUsd >= config.thresholdUsd) {
    if (!wallet) {
      needsWallet = true;
    } else {
      batch = state.pendingUsd;
      try {
        await simulateStripeDeposit(batch);
        const sig = await depositToVault(wallet, batch);
        // Only mark invested once the on-chain deposit actually succeeded.
        moveToInvested(userId, batch, sig);
        deposited = true;
      } catch (e) {
        // Leave the batch pending so it retries on the next threshold hit; surface the error.
        depositError = (e as Error).message;
        console.error('[pipeline] deposit failed, keeping funds pending:', depositError);
        batch = 0;
      }
    }
  }
  return { setAside, deposited, needsWallet, depositError, batch };
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
  const wallet = req.body?.wallet as string | undefined;
  if (!isConfigured()) {
    res.status(400).json({ error: 'Plaid keys not set in server/.env' });
    return;
  }
  try {
    const purchases = await syncTransactions();
    const processed = [];
    let needsWallet = false;
    for (const p of purchases) {
      const r = await runPipeline(userId, p.amountUsd, wallet);
      processed.push({ name: p.name, amountUsd: p.amountUsd, setAside: r.setAside, deposited: r.deposited, depositError: r.depositError });
      if (r.needsWallet) needsWallet = true;
      if (r.deposited) await new Promise((res) => setTimeout(res, 800)); // ease off the RPC between deposits
    }
    res.json({ processed, needsWallet, state: getState(userId) });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Demo endpoint: push one purchase through the pipeline. */
plaidRouter.post('/simulate-purchase', async (req, res) => {
  const userId = (req.body?.userId as string) ?? 'demo';
  const wallet = req.body?.wallet as string | undefined;
  const amountUsd = Number(req.body?.amountUsd);
  const r = await runPipeline(userId, amountUsd, wallet);
  res.json({ setAside: r.setAside, deposited: r.deposited, needsWallet: r.needsWallet, depositError: r.depositError, state: getState(userId) });
});

/** Reset a user's earmark/bank state (demo replay). The on-chain vault is the user's own
 * money — only they can withdraw it, via the vault's Withdraw button. Reset never touches it. */
plaidRouter.post('/reset', async (req, res) => {
  const userId = (req.body?.userId as string) ?? 'demo';
  clearItem();
  res.json({ state: resetState(userId) });
});
