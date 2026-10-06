import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { config } from '../lib/config.js';
import {
  getPlaidItem,
  savePlaidItem,
  updatePlaidCursor,
  clearPlaidItem,
} from './ledger.js';

// Plaid client (detection only — Plaid never moves money). The environment is driven by
// PLAID_ENV: `sandbox` for the demo (test banks), `production` for real banks once your
// Plaid app is approved. The real Link flow (link-token -> public-token -> access-token) is
// identical across environments, so going live is just an env-var change.

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

/** Keys present? Without them we can't talk to Plaid at all. */
export const isConfigured = () => Boolean(config.plaid.clientId && config.plaid.secret);
/** Which Plaid environment we're pointed at ('sandbox' | 'production'). */
export const plaidEnv = () => config.plaid.env;
/** Has this user linked a bank yet? */
export const hasItem = (userId: string) => Boolean(getPlaidItem(userId)?.accessToken);
/** The linked bank's display name, if known. */
export const getInstitution = (userId: string) => getPlaidItem(userId)?.institution;
/** Forget this user's linked bank. */
export const clearItem = (userId: string) => clearPlaidItem(userId);

/**
 * Create a short-lived link_token the frontend hands to Plaid Link. The user then picks
 * their bank and authenticates inside Plaid's widget — we never see their credentials.
 */
export async function createLinkToken(userId: string): Promise<string> {
  const res = await plaid.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'Orbit',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
    ...(config.plaid.webhookUrl ? { webhook: config.plaid.webhookUrl } : {}),
  });
  return res.data.link_token;
}

/**
 * Exchange the public_token Plaid Link returns for a long-lived access_token, and store it
 * for this user. Best-effort fetches the institution name for display.
 */
export async function exchangePublicToken(userId: string, publicToken: string): Promise<{ institution?: string }> {
  const ex = await plaid.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = ex.data.access_token;
  const itemId = ex.data.item_id;

  let institution: string | undefined;
  try {
    const item = await plaid.itemGet({ access_token: accessToken });
    const instId = item.data.item.institution_id;
    if (instId) {
      const inst = await plaid.institutionsGetById({ institution_id: instId, country_codes: [CountryCode.Us] });
      institution = inst.data.institution.name;
    }
  } catch {
    // Institution lookup is cosmetic — ignore failures.
  }

  savePlaidItem(userId, { accessToken, itemId, cursor: undefined, institution });
  return { institution };
}

/**
 * Sandbox-only shortcut: link Plaid's test "First Platypus Bank" without the Link UI.
 * Handy for the demo; in production users connect their real bank through Plaid Link.
 */
export async function connectSandbox(userId: string): Promise<void> {
  const pt = await plaid.sandboxPublicTokenCreate({
    institution_id: 'ins_109508', // First Platypus Bank (Plaid's default sandbox institution)
    initial_products: [Products.Transactions],
  });
  const ex = await plaid.itemPublicTokenExchange({ public_token: pt.data.public_token });
  savePlaidItem(userId, {
    accessToken: ex.data.access_token,
    itemId: ex.data.item_id,
    cursor: undefined,
    institution: 'First Platypus Bank',
  });
}

export type DetectedPurchase = { amountUsd: number; name: string; date?: string };

/**
 * Pull new transactions for this user via /transactions/sync (cursor-based) and return the
 * spending ones (positive amount = money out). Retries briefly because freshly-linked
 * sandbox items take a moment to be ready.
 */
export async function syncTransactions(userId: string): Promise<DetectedPurchase[]> {
  const item = getPlaidItem(userId);
  if (!item?.accessToken) throw new Error('No Plaid item — connect a bank first.');

  let cursor = item.cursor;
  const all: DetectedPurchase[] = [];

  for (let attempt = 0; attempt < 6; attempt++) {
    let hasMore = true;
    let gotAny = false;
    while (hasMore) {
      const res = await plaid.transactionsSync({ access_token: item.accessToken, cursor });
      for (const t of res.data.added) {
        if (t.amount > 0) all.push({ amountUsd: t.amount, name: t.merchant_name ?? t.name ?? 'purchase', date: t.date });
      }
      if (res.data.added.length > 0) gotAny = true;
      cursor = res.data.next_cursor;
      hasMore = res.data.has_more;
    }
    if (gotAny || cursor) break; // ready
    await new Promise((r) => setTimeout(r, 2000)); // item not ready yet — wait and retry
  }
  updatePlaidCursor(userId, cursor);

  // Only sync recent spending: transactions from the last day, not older history.
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = all.filter((p) => !p.date || new Date(p.date).getTime() >= cutoff);
  // Cap how many run through the pipeline in one sync — each one that crosses the
  // threshold fires a real devnet deposit and the RPC rate-limits.
  return recent.slice(0, 8);
}
