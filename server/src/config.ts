import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID ?? '',
    secret: process.env.PLAID_SECRET ?? '',
    env: process.env.PLAID_ENV ?? 'sandbox',
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
    cluster: process.env.SOLANA_CLUSTER ?? 'devnet',
  },
  thresholdUsd: Number(process.env.THRESHOLD_USD ?? 10),
};
