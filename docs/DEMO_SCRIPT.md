# Orbit — Demo Script & Shot List

**Target length:** 2:30–3:00. **The money shot:** spend → auto-save → withdraw *more than you put in*.

Record at 1280×800, browser at `http://localhost:3000`, wallet on **Devnet**. Have Solflare installed for the "crypto user" beat, and a fresh browser profile (or cleared localStorage) for the "no wallet" beat.

---

## 0:00 — Hook (10s)
**On screen:** Orbit dashboard, balance hero.
**Say:**
> "Most people can't save, and most crypto 'savings' means your money leaves your wallet and never comes back. Orbit fixes both. It saves a slice of your everyday spending, automatically, into a vault you actually own — and grows it with on-chain yield."

## 0:10 — The problem, fast (15s)
**On screen:** slow pan over the dashboard (Set aside · In vault · yield ticking).
**Say:**
> "Acorns built the habit — round up spending, save the change. DeFi has the transparency — every dollar on-chain, verifiable. Nobody's combined them. That's Orbit."

## 0:25 — Onboarding for NON-crypto users (25s) ⭐
**Do:** In the vault card, click **Create an account**.
**On screen:** instant connect, "Orbit account" badge appears, balance loads.
**Say:**
> "Here's the part that matters. A normal person — no wallet, no seed phrase, no extension — clicks one button. Orbit creates a self-custodial wallet for them in the browser. They're in. That's how we reach the 99% who'll never install Phantom."

## 0:50 — The automatic save (the core loop) (35s) ⭐
**Do:** Click **Sync spending from Plaid** (or Simulate → **$600**).
**On screen:** activity feed fills — "Spent $600 · set aside $10" → "Threshold reached · deposited into your vault." In-vault number jumps.
**Say:**
> "Orbit watches your bank through Plaid. You spend $600 — it sets aside $10. When set-asides hit the threshold, Orbit pulls the money, converts it to USDC, and deposits it into your vault. **You didn't sign anything. You didn't do anything.** That's self-driving savings."

## 1:25 — It's really yours + it's really earning (30s) ⭐
**Do:** Click the **Solscan** link in the Verify strip → show the on-chain vault. Point at the ticking yield.
**Say:**
> "This isn't a number in a database. It's an on-chain vault, and here it is on Solscan — public, verifiable, yours. And it's earning: this balance is growing in real time from on-chain yield. Not a mockup — real tokens."

## 1:55 — Withdraw MORE than you put in (25s) ⭐⭐ THE MONEY SHOT
**Do:** Click **Withdraw all** → approve.
**On screen:** In-vault drops to $0; wallet USDC rises by *more than deposited*. Click **view tx**.
**Say:**
> "And the promise crypto usually breaks — getting your money back. One click. I withdraw everything… and I get back **more than I deposited.** Principal plus real yield, paid out in tokens, settled on-chain. Here's the transaction."

## 2:20 — What's real (20s)
**On screen:** architecture diagram (from README) or bullet overlay.
**Say:**
> "Under the hood: Plaid detection, the vault, and the yield are all real and on-chain today. The only mocked hop is Stripe converting dollars to USDC — one function, one swap to production. Everything else ships as-is."

## 2:40 — Close (15s)
**Say:**
> "Orbit — self-driving savings on Solana. The habit of Acorns, the transparency of DeFi, open to everyone — not just crypto natives. Thanks."

---

## Shot list (b-roll to capture)
- [ ] Balance hero with yield **ticking** (close-up, a few seconds)
- [ ] **Create an account** click → "Orbit account" badge
- [ ] Activity feed filling during Plaid sync
- [ ] Vault open on **Solscan** (devnet)
- [ ] **Withdraw all** → wallet balance rising → **view tx** on Solscan
- [ ] Program on Solscan: `8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi`

## Proof points to keep on hand (for judges' questions)
- Real yield, on-chain: deposit **1,000,000** → withdraw **1,000,000.030441** (`scripts/yield-demo.ts`).
- Self-custodial: server *funds* the vault; only the user's key can withdraw (`deposit(funder, owner)` / owner-only `withdraw`).
- Only Stripe is mocked (`simulateStripeDeposit`). Plaid, vault, yield are real.
