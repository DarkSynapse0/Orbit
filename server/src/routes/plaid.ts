import { Router } from 'express';
import type { Response } from 'express';
import { computeSetAside } from '@orbit/shared';
import { addPending, moveToInvested, getState, resetState, recordTxn, getTransactions, setSetAsidePct } from '../ledger.js';
import { simulateStripeDeposit, depositToVault } from '../solana.js';
import { isConfigured, hasItem, connectSandbox, syncTransactions, clearItem } from '../plaidClient.js';
import { config } from '../config.js';
import { requireAuth } from '../auth.js';
import { parseAmount, parseAddress, BadRequest } from '../validate.js';

export const plaidRouter = Router();

// Bad input -> 400; everything else -> generic 5xx (never leak internals).
function fail(res: Response, e: unknown, status = 500) {
  if (e instanceof BadRequest) {
    res.status(400).json({ error: e.message });
    return;
  }
  console.error('[plaid] error:', (e as Error)?.message ?? e);
  res.status(status).json({ error: 'internal error' });
}

// Bucket a merchant name into a spending category for the dashboard breakdown.
function categorize(name: string): string {
  const n = name.toLowerCase();
  const has = (...k: string[]) => k.some((w) => n.includes(w));
  if (has('grocery', 'market', 'whole foods', 'walmart', 'costco', 'trader', 'aldi', 'kroger', 'food')) return 'Groceries';
  if (has('coffee', 'starbucks', 'cafe', 'restaurant', 'mcdonald', 'burger', 'pizza', 'dining', 'bar', 'grill', 'kfc', 'taco')) return 'Dining';
  if (has('uber', 'lyft', 'gas', 'shell', 'chevron', 'fuel', 'transit', 'airline', 'air', 'metro', 'parking', 'auto')) return 'Transport';
  if (has('amazon', 'shop', 'store', 'target', 'best buy', 'apple', 'nike', 'mall', 'sparkfun')) return 'Shopping';
  if (has('electric', 'utility', 'comcast', 'verizon', 'at&t', 'bill', 'insurance', 'rent', 'water', 'internet', 'phone')) return 'Bills';
  return 'Other';
}

// Shared pipeline: earmark -> threshold -> (mock Stripe) -> real deposit into the user's vault.
// `wallet` is the connected user's address (the vault owner). Without it we can still earmark,
// but the deposit waits until a wallet is connected — the money stays in the bank until then.
async function runPipeline(userId: string, amountUsd: number, wallet?: string, name = 'Purchase', ts = Date.now()) {
  // Set aside the user's chosen percentage of the purchase.
  const setAside = computeSetAside(amountUsd, getState(userId).setAsidePct);
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
  // Persist the transaction so the dashboard can chart real history.
  recordTxn(userId, {
    name,
    category: categorize(name),
    amountUsd,
    setAside,
    deposited,
    ts,
  });
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
plaidRouter.post('/connect', requireAuth, async (_req, res) => {
  if (!isConfigured()) {
    res.status(400).json({ error: 'Plaid keys not set in server/.env' });
    return;
  }
  try {
    await connectSandbox();
    res.json({ connected: true });
  } catch (e) {
    fail(res, e);
  }
});

/** Pull real transactions from Plaid sandbox and run each purchase through the pipeline. */
plaidRouter.post('/sync', requireAuth, async (req, res) => {
  const userId = req.userId!;
  if (!isConfigured()) {
    res.status(400).json({ error: 'Plaid keys not set in server/.env' });
    return;
  }
  let wallet: string | undefined;
  try {
    if (req.body?.wallet) wallet = parseAddress(req.body.wallet);
  } catch (e) {
    fail(res, e);
    return;
  }
  try {
    const purchases = await syncTransactions();
    const processed = [];
    let needsWallet = false;
    for (const p of purchases) {
      const r = await runPipeline(userId, p.amountUsd, wallet, p.name, p.date ? new Date(p.date).getTime() : Date.now());
      processed.push({ name: p.name, amountUsd: p.amountUsd, setAside: r.setAside, deposited: r.deposited, depositError: r.depositError });
      if (r.needsWallet) needsWallet = true;
      if (r.deposited) await new Promise((res) => setTimeout(res, 800)); // ease off the RPC between deposits
    }
    res.json({ processed, needsWallet, state: getState(userId) });
  } catch (e) {
    fail(res, e);
  }
});

/** Demo endpoint: push one purchase through the pipeline. */
plaidRouter.post('/simulate-purchase', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const amountUsd = parseAmount(req.body?.amountUsd);
    const wallet = req.body?.wallet ? parseAddress(req.body.wallet) : undefined;
    const name = (req.body?.name as string)?.slice(0, 120) || `Purchase · $${amountUsd}`;
    const r = await runPipeline(userId, amountUsd, wallet, name);
    res.json({ setAside: r.setAside, deposited: r.deposited, needsWallet: r.needsWallet, depositError: r.depositError, state: getState(userId) });
  } catch (e) {
    fail(res, e);
  }
});

/** Flush the pending set-aside into the user's vault now, without waiting for a new
 * purchase. Used when a wallet connects after money was already earmarked, or to
 * retry a deposit that failed earlier. Deposits the whole pending batch. */
plaidRouter.post('/invest-now', requireAuth, async (req, res) => {
  const userId = req.userId!;
  let wallet: string;
  try {
    wallet = parseAddress(req.body?.wallet);
  } catch (e) {
    fail(res, e);
    return;
  }
  const batch = getState(userId).pendingUsd;
  if (batch <= 0) {
    res.json({ deposited: false, batch: 0, state: getState(userId) });
    return;
  }
  try {
    await simulateStripeDeposit(batch);
    const sig = await depositToVault(wallet, batch);
    moveToInvested(userId, batch, sig);
    res.json({ deposited: true, sig, batch, state: getState(userId) });
  } catch (e) {
    // Keep the funds pending so it can be retried; don't leak the internal error.
    console.error('[plaid] invest-now deposit failed:', (e as Error)?.message ?? e);
    res.status(502).json({ error: 'deposit failed', deposited: false, state: getState(userId) });
  }
});

/** Current saved state (pending + invested) so the dashboard survives reloads. */
plaidRouter.get('/state', requireAuth, (req, res) => {
  res.json({ state: getState(req.userId!) });
});

/** Update the user's set-aside rate (% of each purchase). Clamped to 0.5%–5% server-side. */
plaidRouter.post('/set-aside-pct', requireAuth, (req, res) => {
  try {
    const pct = Number(req.body?.pct);
    if (!Number.isFinite(pct)) throw new BadRequest('pct must be a number');
    res.json({ state: setSetAsidePct(req.userId!, pct) });
  } catch (e) {
    fail(res, e);
  }
});

/** Real transaction history for the dashboard charts. */
plaidRouter.get('/transactions', requireAuth, (req, res) => {
  res.json({ transactions: getTransactions(req.userId!) });
});

/** Reset a user's earmark/bank state (demo replay). The on-chain vault is the user's own
 * money — only they can withdraw it, via the vault's Withdraw button. Reset never touches it. */
plaidRouter.post('/reset', requireAuth, async (req, res) => {
  clearItem();
  res.json({ state: resetState(req.userId!) });
});
