import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { plaidRouter } from './routes/plaid.js';
import { getState } from './ledger.js';
import { getVaultOnChain, getConfig, mintToAddress, fundSol } from './onchain.js';

// Never let a transient RPC error (e.g. a devnet 429) take the whole server down.
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', (e as Error)?.message ?? e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', (e as Error)?.message ?? e));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, cluster: config.solana.cluster }));
app.get('/balance/:userId', (req, res) => res.json(getState(req.params.userId)));
app.get('/vault', async (req, res) => {
  const owner = req.query.owner as string | undefined;
  if (!owner) {
    res.status(400).json({ error: 'owner (wallet address) required' });
    return;
  }
  try {
    res.json(await getVaultOnChain(owner));
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});
app.get('/config', async (_req, res) => {
  try {
    res.json(await getConfig());
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});
app.post('/faucet', async (req, res) => {
  const address = req.body?.address as string;
  const usd = Number(req.body?.usd ?? 100);
  if (!address) {
    res.status(400).json({ error: 'address required' });
    return;
  }
  try {
    res.json(await mintToAddress(address, usd));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
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

app.post('/fund-sol', async (req, res) => {
  const address = req.body?.address as string;
  if (!address) {
    res.status(400).json({ error: 'address required' });
    return;
  }
  try {
    res.json(await fundSol(address));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.use('/plaid', plaidRouter);

app.listen(config.port, () => {
  console.log(`Orbit server listening on :${config.port} (${config.solana.cluster})`);
});
