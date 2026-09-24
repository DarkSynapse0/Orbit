# Orbit — Product Context

**Register:** brand (marketing/landing) for the site; product (app UI) for the dashboard at `/app`.

## What it is
Self-driving savings on Solana. Orbit sets aside a slice of everyday spending, automatically, into an on-chain USDC vault the user fully owns, and grows it with real yield. Acorns' habit, DeFi's transparency. Withdraw anytime.

## Users
- **Non-crypto savers** who could never stick to saving and would never install a wallet. Reached via one-click embedded accounts (no seed phrase, no extension).
- **Crypto users** who want idle USDC to work without giving up custody.

## Brand voice
Three words: **calm, dependable, quietly futuristic.** It handles money, so it must feel safe first, clever second. Confident, plain-spoken, never hypey. Explains crypto without jargon. The "orbit" metaphor: money kept in motion by gravity, working automatically while you go about your life.

## Strategic principles
- **Trust is the product.** Self-custodial (only the user's key withdraws), on-chain and verifiable (Solscan), withdraw-anytime. Say it plainly, prove it with links.
- **Approachable, not dumbed-down.** A non-crypto person must feel safe; a crypto person must trust the mechanics.
- **Honest about what's real.** Plaid detection, the vault, and yield are real on-chain. Only the Stripe fiat→USDC hop is mocked (hackathon seam).

## Anti-references (do NOT look like these)
- Neon-on-black "crypto bro" aesthetic. No lasers, no glow-maxxing.
- Navy-and-gold "trust me I'm a bank" fintech cliché.
- Generic SaaS: centered hero, three identical icon-title-subtitle cards, gradient text.

## Proof points
- Program on Solana devnet: `8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi`
- Real yield, proven: deposit 1,000,000 → withdraw 1,000,000.03 (`scripts/yield-demo.ts`)
- Tiered set-aside: >$100 → $5, >$500 → $10; batch to threshold; convert; deposit; earn; withdraw.
