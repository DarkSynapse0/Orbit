import 'dotenv/config';

const cluster = process.env.SOLANA_CLUSTER ?? 'devnet';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID ?? '',
    secret: process.env.PLAID_SECRET ?? '',
    env: process.env.PLAID_ENV ?? 'sandbox',
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
    cluster,
  },
  thresholdUsd: Number(process.env.THRESHOLD_USD ?? 10),
  // Only devnet/testnet clusters may expose the faucet + SOL funding endpoints.
  isDevnet: cluster !== 'mainnet-beta' && cluster !== 'mainnet',
  // Origins allowed to call this API. Comma-separated env override; localhost by default.
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Google OAuth client id (must match the frontend's) for verifying ID tokens.
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  // Secret used to sign session tokens. MUST be set in production.
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-insecure-session-secret-change-me',
  // Where persistent files (SQLite db, saved mint) live. On a host with a mounted
  // volume set this to that path (e.g. /data). Empty = alongside the source (local dev).
  dataDir: process.env.DATA_DIR ?? '',
  // Funder/authority secret key for on-chain ops. base58 string or a JSON byte array.
  // Falls back to the local Solana CLI wallet when unset (local dev only).
  funderSecretKey: process.env.FUNDER_SECRET_KEY ?? '',
};
