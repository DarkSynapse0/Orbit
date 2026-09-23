# Orbit

A self-driving savings app on Solana: it sets aside a slice of daily spending and grows it via on-chain USDC yield. Acorns' habit, DeFi's transparency. Built solo for the Colosseum Crypto World's Fair hackathon (Sept 14 – Oct 12, 2026).

## Locked money-movement architecture

```
bank/card spend → Plaid detects → Orbit earmarks (money stays in bank)
  → [threshold] → Stripe pulls + converts fiat→USDC → on-chain vault (the chamber) → Kamino (invest) → withdraw anytime
```

- **Plaid = detection only** (webhooks). Never moves money.
- **Stripe = the pipe** (at threshold: pull fiat + fiat→USDC). Never holds funds, never the chamber.
- **Chamber = on-chain USDC vault** (user-owned, program-controlled). Keeps savings transparent + non-custodial.
- **Kamino = yield venue** (most-audited on Solana). Fallback: a mock yield vault on devnet if Kamino has no devnet.
- **Threshold pull, not per-purchase**: before the threshold a set-aside is just a number; the dollars stay in the user's bank.

**Hackathon seam:** the ONLY mocked hop is Stripe (`simulateStripeDeposit` in `server/src/solana.ts`). Everything else is real. Production = delete the mock, plug in Stripe; nothing else changes.

## Monorepo layout (pnpm workspace)

- `app/` — Next.js 16 + Tailwind 4 + Solana wallet adapter (frontend)
- `server/` — Express + TypeScript (Plaid detection, earmark ledger, threshold, mock Stripe, vault deposit)
- `shared/` — `@orbit/shared`: domain types + `computeSetAside()` tier logic, imported by both app and server
- `orbit-vault/` — Anchor program: the on-chain vault/chamber (added once the toolchain is ready)

## Commands

```bash
pnpm dev            # run app + server together
pnpm dev:server     # backend only (http://localhost:4000)
pnpm dev:app        # frontend only (http://localhost:3000)
```

Backend config: copy `server/.env.example` → `server/.env` (Plaid sandbox keys, Solana RPC, threshold).

## Key files

- `shared/src/index.ts` — the set-aside rule (`DEFAULT_TIERS`, `computeSetAside`) and `SavingsState`. Change the rule here only.
- `server/src/routes/plaid.ts` — the pipeline: earmark → threshold → mock Stripe → deposit. `/plaid/simulate-purchase` demos the whole loop.
- `server/src/solana.ts` — `simulateStripeDeposit` (the mocked hop) + `depositToVault` (real deposit TODO).
- `server/src/ledger.ts` — in-memory earmark ledger (swap for a DB later).

## Toolchain

Node 26, pnpm 11, Rust 1.98, Solana CLI (Agave) 4.2.2, Anchor via avm. Solana CLI lives at `~/.local/share/solana/install/active_release/bin`.

## Context

Full research + product reasoning live in the Claude doc "Orbit — Learning Phase Research" and in project memory (`orbit-overview`, `orbit-product-intent`, `orbit-architecture`). Read those before changing product direction.
