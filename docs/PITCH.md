# Orbit — Pitch

**Self-driving savings on Solana.** The habit of Acorns, the transparency of DeFi — open to everyone, not just crypto natives.

Built solo for the Colosseum Crypto World's Fair hackathon (Sept 14 – Oct 12, 2026).

---

## 1 · One-liner
Orbit sets aside a slice of your everyday spending, automatically, into an on-chain vault you fully own — and grows it with real USDC yield. Withdraw anytime.

## 2 · The problem
- **Normal people can't save.** It takes willpower and attention nobody has. Acorns proved automation works — but it's a closed, opaque box paying ~0%.
- **Crypto "savings" feels like a trap.** Money leaves your wallet into some protocol, and the deep fear is it never comes back. Illiquid, custodial, unverifiable.
- **Nobody has combined the habit with the transparency.** That's the gap.

## 3 · The solution
Orbit watches your spending and skims tiny, tier-based set-asides ($5 on a $100 purchase, $10 on $500). It batches them to a threshold, converts to USDC, and deposits into **your own on-chain vault**, where the balance earns yield. You can see every dollar on Solscan, and withdraw the whole thing — principal + yield — in one click.

**The two things that make it different:**
1. **You own it.** The vault is self-custodial and program-controlled. Orbit *funds* it; only your key can withdraw. Money going in never means money you can't get back.
2. **Anyone can use it.** One-click account creation — no wallet, no seed phrase, no extension — so the 99% who'll never install Phantom can still save on-chain.

## 4 · How it works
```
bank/card spend
   → Plaid detects (read-only)
   → Orbit earmarks a set-aside   (money stays in your bank)
   → [threshold reached]
   → Stripe pulls fiat + converts to USDC
   → on-chain vault (the chamber, you own it)
   → yield reserve (earns interest)
   → withdraw anytime → principal + yield back to your wallet
```
- **Plaid** = detection only. Never moves money.
- **Stripe** = the pipe at the threshold. Never holds funds.
- **Vault** = on-chain USDC, self-custodial, transparent.
- **Yield** = an on-chain reserve pays real interest in tokens (Kamino on mainnet later).

## 5 · Demo (what you'll see)
1. **Create an account** — no wallet needed, instant.
2. **Sync spending** — a $600 purchase auto-saves $10 into the vault. No signing.
3. **Verify on Solscan** — the vault is real, public, yours; yield ticks up live.
4. **Withdraw all** — get back *more than you deposited*. Real yield, on-chain tx.

## 6 · What's actually built (not slideware)
- ✅ **On-chain vault program** on Solana devnet (`8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi`) — self-custodial, `deposit(funder, owner)` so Orbit funds it but only the owner withdraws.
- ✅ **Real yield** — an on-chain reserve pays interest in tokens. Proven: deposit 1,000,000 → withdraw 1,000,000.03.
- ✅ **Plaid** sandbox detection → earmark → threshold → deposit pipeline.
- ✅ **Embedded wallet** for non-crypto onboarding (one-click account).
- ✅ **Persistence** (SQLite), live yield UI, Solscan verification.
- 🔜 **Only Stripe is mocked** (bank→USDC) — one function, swap to production; nothing else changes.

## 7 · Why now
- Stablecoins are the killer app: USDC settlement is instant and near-free on Solana.
- On-ramps (Stripe, etc.) now convert fiat→USDC as an API call.
- Solana fees make micro-deposits (skimming $5–10) economically viable — impossible on L1s.

## 8 · Market & who it's for
- **Non-crypto savers** who'd never touch a wallet — reached via the embedded account.
- **Crypto users** who want idle USDC to work without giving up custody.
- Wedge: automated micro-savings. Expansion: goals, recurring rules, better yield venues, cards.

## 9 · Business model (later)
- Spread on yield and/or a small management fee (Acorns charges a flat monthly fee at ~0% yield; Orbit can pay real yield *and* take a spread).
- Interchange / on-ramp economics at scale.

## 10 · Roadmap
- **Now:** working end-to-end on devnet (this submission).
- **Next:** real Stripe on-ramp; Kamino (mainnet) as the yield venue; goals & custom rules.
- **Later:** production key management (Privy/Turnkey), mobile, spending card.

## 11 · Vision
A savings account that runs itself, pays real yield, and that you can *prove* is yours — usable by someone who's never heard of a blockchain. Acorns' habit, DeFi's transparency, for everyone.

---
*Appendix — verify it yourself:* program `8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi` on Solana devnet · real-yield proof in `scripts/yield-demo.ts` · architecture in `CLAUDE.md`.
