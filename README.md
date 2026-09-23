# Orbit

**A self-driving savings app on Solana.** It sets aside a slice of your daily spending and grows it through on-chain USDC yield — the Acorns habit, with DeFi's transparency and better returns.

Built solo for the Colosseum Crypto World's Fair hackathon (Sept 14 – Oct 12, 2026).

## How it works

```
spend → Plaid detects the purchase → Orbit sets aside a bit (money stays in your bank)
   → once it crosses a threshold → converted to USDC → deposited into an on-chain vault
   → earns yield on Kamino → withdraw principal + yield anytime
```

Your savings live on-chain where you can verify them — not in a bank black box. Not FDIC-insured; principal is not guaranteed (see the in-app risk disclosure).

## Repo structure

| Path | What |
| --- | --- |
| `app/` | Next.js frontend (wallet connect, balance, activity, withdraw) |
| `server/` | Express backend (Plaid detection, set-aside ledger, threshold, vault deposit) |
| `shared/` | Shared types + the set-aside tier logic |
| `orbit-vault/` | Anchor program — the on-chain vault (the "chamber") |

## Getting started

```bash
pnpm install
cp server/.env.example server/.env   # fill in Plaid sandbox keys
pnpm dev                              # app on :3000, server on :4000
```

### Try the pipeline (no bank needed)

```bash
curl -X POST http://localhost:4000/plaid/simulate-purchase \
  -H "Content-Type: application/json" \
  -d '{"id":"t1","userId":"u1","amountUsd":600,"detectedAt":"2026-09-23T00:00:00Z"}'
```

## Toolchain

Node 26 · pnpm 11 · Rust 1.98 · Solana CLI (Agave) · Anchor

## Status

Hackathon build. The only simulated hop is the fiat→USDC step (Stripe), mocked for the demo; the Solana vault, deposit, and yield are real on devnet.
