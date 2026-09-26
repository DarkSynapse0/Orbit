import fs from 'node:fs';
import { Configuration, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import { config } from './config.js';

// Plaid sandbox client. We use Plaid's real API (detection only — Plaid never moves money)
// against the sandbox environment: connect a test bank, then sync its transactions and run
// each purchase through Orbit's set-aside pipeline.

const configuration = new Configuration({
  basePath: PlaidEnvironments[config.plaid.env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': config.plaid.clientId,
      'PLAID-SECRET': config.plaid.secret,
    },
  },
});

export const plaid = new PlaidApi(configuration);

type PlaidState = { accessToken?: string; cursor?: string };
const stateFile = new URL('../.plaid.json', import.meta.url);
const load = (): PlaidState => {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
};
const save = (s: PlaidState) => fs.writeFileSync(stateFile, JSON.stringify(s, null, 2));

export const isConfigured = () => Boolean(config.plaid.clientId && config.plaid.secret);
export const hasItem = () => Boolean(load().accessToken);
export const clearItem = () => {
  try {
    fs.unlinkSync(stateFile);
  } catch {
    /* nothing to clear */
  }
};

/** Connect a sandbox bank: create a public token and exchange it for an access token. */
export async function connectSandbox(): Promise<void> {
  const pt = await plaid.sandboxPublicTokenCreate({
    institution_id: 'ins_109508', // First Platypus Bank (Plaid's default sandbox institution)
    initial_products: [Products.Transactions],
  });
  const ex = await plaid.itemPublicTokenExchange({ public_token: pt.data.public_token });
  save({ accessToken: ex.data.access_token, cursor: undefined });
}

export type DetectedPurchase = { amountUsd: number; name: string; date?: string };

/**
 * Pull new transactions via /transactions/sync (cursor-based) and return the spending ones
 * (positive amount = money out). Retries briefly because sandbox items take a moment to be ready.
 */
export async function syncTransactions(): Promise<DetectedPurchase[]> {
  const st = load();
  if (!st.accessToken) throw new Error('No Plaid item — connect a bank first.');

  let cursor = st.cursor;
  const all: DetectedPurchase[] = [];

  for (let attempt = 0; attempt < 6; attempt++) {
    let hasMore = true;
    let gotAny = false;
    while (hasMore) {
      const res = await plaid.transactionsSync({ access_token: st.accessToken, cursor });
      for (const t of res.data.added) {
        if (t.amount > 0) all.push({ amountUsd: t.amount, name: t.merchant_name ?? t.name ?? 'purchase', date: t.date });
      }
      if (res.data.added.length > 0) gotAny = true;
      cursor = res.data.next_cursor;
      hasMore = res.data.has_more;
    }
    if (gotAny || cursor) break; // ready
    await new Promise((r) => setTimeout(r, 2000)); // sandbox not ready yet — wait and retry
  }
  save({ ...st, cursor });

  // Curate for the demo: a couple below-tier purchases (to show the tier logic) plus a few
  // that qualify. Each qualifying one fires a real devnet deposit and the public RPC
  // rate-limits, so keep the qualifying count small.
  const LOW_TIER = 100;
  const below = all.filter((p) => p.amountUsd < LOW_TIER).slice(0, 2);
  const qualifying = all.filter((p) => p.amountUsd >= LOW_TIER).slice(0, 3);
  return [...below, ...qualifying];
}
