import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { plaidRouter } from './routes/plaid.js';
import { getState } from './ledger.js';
import { getVaultOnChain } from './onchain.js';

// Never let a transient RPC error (e.g. a devnet 429) take the whole server down.
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', (e as Error)?.message ?? e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', (e as Error)?.message ?? e));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, cluster: config.solana.cluster }));
app.get('/balance/:userId', (req, res) => res.json(getState(req.params.userId)));
app.get('/vault', async (_req, res) => {
  try {
    res.json(await getVaultOnChain());
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});
app.use('/plaid', plaidRouter);

app.listen(config.port, () => {
  console.log(`Orbit server listening on :${config.port} (${config.solana.cluster})`);
});
