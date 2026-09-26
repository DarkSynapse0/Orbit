import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { plaidRouter } from './routes/plaid.js';
import { getState } from './ledger.js';
import { getVaultOnChain, getConfig, mintToAddress, fundSol } from './onchain.js';
import { authRouter } from './routes/auth.js';
import { requireAuth } from './auth.js';
import { parseAmount, parseAddress, BadRequest } from './validate.js';

// Never let a transient RPC error (e.g. a devnet 429) take the whole server down.
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', (e as Error)?.message ?? e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', (e as Error)?.message ?? e));

const app = express();
app.set('trust proxy', 1);
// Only allow the known frontend origin(s) to call the API.
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  }),
);
app.use(express.json({ limit: '32kb' }));

// Baseline rate limit on everything; tighter limits on the money/faucet routes.
const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const faucetLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
app.use(apiLimiter);

// Turn thrown errors into safe responses: 400 for bad input, generic 5xx otherwise.
// Never leak internal (RPC/anchor/db) error text to clients.
function fail(res: express.Response, e: unknown, fallbackStatus = 500) {
  if (e instanceof BadRequest) {
    res.status(400).json({ error: e.message });
    return;
  }
  console.error('[error]', (e as Error)?.message ?? e);
  res.status(fallbackStatus).json({ error: 'internal error' });
}

app.get('/health', (_req, res) => res.json({ ok: true, cluster: config.solana.cluster }));

// Auth: exchange a Google credential (or demo) for a session token.
app.use('/auth', authRouter);

// A user's own ledger balance — requires auth, reads the caller's own userId.
app.get('/balance', requireAuth, (req, res) => res.json(getState(req.userId!)));
app.get('/vault', async (req, res) => {
  try {
    const owner = parseAddress(req.query.owner);
    res.json(await getVaultOnChain(owner));
  } catch (e) {
    fail(res, e, 503);
  }
});
app.get('/config', async (_req, res) => {
  try {
    res.json(await getConfig());
  } catch (e) {
    fail(res, e, 503);
  }
});
// Devnet-only test-token faucet. Requires auth + strict rate limit; capped amount.
app.post('/faucet', faucetLimiter, requireAuth, async (req, res) => {
  if (!config.isDevnet) {
    res.status(403).json({ error: 'faucet is devnet-only' });
    return;
  }
  try {
    const address = parseAddress(req.body?.address);
    const usd = parseAmount(req.body?.usd ?? 100, { max: 1000 });
    res.json(await mintToAddress(address, usd));
  } catch (e) {
    fail(res, e);
  }
});
// Live SOL/USD price (mainnet market rate) so the UI can value a wallet's SOL in dollars.
// Cached 60s; devnet SOL is priced at the same market rate for display purposes.
let solPrice = { usd: 0, at: 0 };
app.get('/price/sol', async (_req, res) => {
  try {
    const now = Date.now();
    if (now - solPrice.at > 60_000) {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const d = (await r.json()) as { solana?: { usd?: number } };
      const usd = Number(d?.solana?.usd);
      if (usd > 0) solPrice = { usd, at: now };
    }
  } catch (e) {
    console.error('[price] SOL price fetch failed, serving last value:', (e as Error).message);
  }
  res.json({ usd: solPrice.usd });
});

// Devnet-only gas top-up for the embedded wallet. Auth + strict rate limit.
app.post('/fund-sol', faucetLimiter, requireAuth, async (req, res) => {
  if (!config.isDevnet) {
    res.status(403).json({ error: 'fund-sol is devnet-only' });
    return;
  }
  try {
    const address = parseAddress(req.body?.address);
    res.json(await fundSol(address));
  } catch (e) {
    fail(res, e);
  }
});

app.get('/venues', async (_req, res) => {
  try {
    const { getVenueStats } = await import('./defillama.js');
    res.json({ venues: await getVenueStats() });
  } catch (e) {
    fail(res, e, 502);
  }
});

app.use('/plaid', plaidRouter);

app.listen(config.port, () => {
  console.log(`Orbit server listening on :${config.port} (${config.solana.cluster})`);
});
