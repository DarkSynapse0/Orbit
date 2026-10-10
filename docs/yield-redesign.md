# Yield redesign — pooled-share (exchange-rate) model

Status: **proposal for review** (no code changed yet). Supersedes the current per-vault
fixed-APY accounting in `orbit-vault/programs/orbit-vault/src/lib.rs`.

## Why change

Today each vault accrues interest *independently* at a fixed 6% (`accrue()` →
`vault.accrued_yield`), but **all interest is paid from one shared buffer**
(`reserve_vault.amount − reserve.total_principal`) with no global accounting that the sum
of every vault's `accrued_yield` is actually backed. Consequences:

- **First-withdrawer drains the yield.** If the buffer is under-funded, the first user to
  withdraw takes the whole buffer (the `saturating_sub` cap); later users with identical
  deposits get their yield silently truncated to ~0.
- **The APY is a promise the pool can't collectively keep.** `reserve.apy_bps` is stored at
  init but **never read** — `accrue()` uses the hard-coded `const APY_BPS = 600`. The IDL
  advertises a configurable rate that does nothing.
- **Yield can be suppressed by spam.** Tiny `deposit(1)` calls re-stamp `last_update_ts`, and
  for small principals / short intervals the accrual floors to 0 — a griefer can keep
  interest from ever accruing.

Principal is always safe (the solvency cap guarantees it). The problem is purely the
**yield distribution model**: it is not collectively solvent and not fair.

## Guiding principle — invisible to users

Shares, share-price, exchange rates, and basis points are **internal plumbing only**. A user
never sees or thinks about them. The redesign must not make the product feel more "crypto."
What users see stays exactly as friendly as today:

- Plain dollars everywhere: **Total value $X**, **Yield earned $Y**, a simple **"~6% a year."**
- The balance **ticks up smoothly** in real time (keep the live-yield animation) so savings
  feel alive, even though on-chain value updates in steps.
- Withdraw is **"Get it all back"** in one tap, or type a **dollar amount** — never "burn N
  shares."
- No jargon in the UI: no "shares", "exchange rate", "APY bps", "pool", "reserve". Those
  words live in the code and this doc, not the screen.

Every decision below is resolved in favor of keeping that experience.

## The model: shares, not principal + accrued

Switch to the standard DeFi vault accounting (ERC‑4626 / cToken style). The reserve is a
single pool; each vault owns **shares** of it. There is no per-vault APY and no separate
"accrued yield" field.

```
share_price = total_assets / total_shares
            = reserve_vault.amount / reserve.total_shares
```

- **Deposit `amount`:** mint `shares = amount / share_price` (floor), transfer `amount` into
  the pool, `total_shares += shares`, `vault.shares += shares`.
- **Withdraw `shares`:** pay `amount = shares × share_price` (floor), transfer out of the
  pool, `total_shares −= shares`, `vault.shares −= shares`.
- **Yield enters by raising `total_assets` without minting shares** — i.e. USDC lands in
  `reserve_vault` with no new shares issued. `share_price` rises for *everyone*
  proportionally.

### Why this is fair and solvent by construction

- **Collectively solvent, always.** A withdrawal pays `shares/total_shares × assets`, which
  can never exceed `assets`. The sum of all vaults' value is exactly `reserve_vault.amount`.
  No "first-come" drain is possible.
- **Fair.** Everyone's share price grows identically. A later depositor buys shares at the
  higher price, so they don't dilute earlier depositors' gains — yield is distributed
  pro‑rata by `shares × time`, automatically.
- **Spam-proof.** There's no time-based per-vault accrual to suppress; value is just
  `shares × price`.
- **Production-shaped.** On mainnet this *is* how Kamino works: deposit → receive pool
  shares whose value grows. Orbit would hold Kamino shares instead of this reserve; the
  deposit/withdraw code shape is identical.

## How yield is funded (devnet)

No separate per-vault accrual instruction. Yield = real tokens added to `reserve_vault`:

- **Devnet (simulated):** a backend cron, as the funder/admin, periodically transfers test
  USDC into `reserve_vault` targeting the advertised rate
  (`yield ≈ total_assets × target_apy × elapsed / year`). That raises `share_price` for all
  holders. Because it's a plain SPL transfer into the pool, **no new instruction is strictly
  required** — but we add an admin-gated `add_yield(amount)` so it emits an auditable event
  and can be rate/authority-checked.
- **Mainnet:** the pool *is* the lending venue (Kamino/Aave). Value accrues automatically in
  the shares; `add_yield` is unused.

## Program changes

### Accounts (layouts change → not upgrade-in-place; see Migration)

```rust
#[account]
pub struct Reserve {
    pub mint: Pubkey,
    pub admin: Pubkey,         // NEW — gates init + add_yield
    pub total_shares: u128,    // NEW — replaces total_principal
    pub target_apy_bps: u16,   // advisory only (for the UI); not used in payout math
    pub bump: u8,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub shares: u128,          // replaces principal + accrued_yield + last_update_ts
    pub bump: u8,
}
```

### Instructions

- `initialize_reserve(target_apy_bps)` — **admin-gated**: `require_keys_eq!(admin.key(), ADMIN)`
  against a hard-coded `const ADMIN: Pubkey`. Store `admin`, seed the inflation-attack
  guard (below).
- `initialize_vault()` — unchanged shape; `shares = 0`.
- `deposit(amount)` — read `assets = reserve_vault.amount` **before** transfer; mint shares
  with the virtual-offset formula; transfer in; update `total_shares`, `vault.shares`.
- `withdraw(shares)` — **by shares, not amount** (see decision #1). Pay
  `floor(shares × (assets + VIRT_ASSETS) / (total_shares + VIRT_SHARES))`; transfer out;
  decrement. Keep `has_one = authority` (only the owner withdraws).
- `add_yield(amount)` — admin-gated transfer of USDC into `reserve_vault` with no share
  mint; emits `YieldAdded`. (Devnet cron uses this; mainnet doesn't.)

### Inflation-attack mitigation (mandatory)

First-depositor share-price manipulation is the classic ERC‑4626 hole: deposit 1 unit → get
1 share → donate a large amount directly to `reserve_vault` → a victim's deposit rounds to 0
shares. Mitigate with OpenZeppelin-style **virtual offsets** in every conversion:

```
shares_out = amount      * (total_shares + VIRT_SHARES) / (assets + VIRT_ASSETS)   // floor
assets_out = shares_burn * (assets + VIRT_ASSETS)       / (total_shares + VIRT_SHARES) // floor
```

with constants like `VIRT_SHARES = 1`, `VIRT_ASSETS = 1_000_000` (1 USDC). This makes the
donation attack economically infeasible. (Alternative/additional: mint a tiny amount of
dead shares to the program on init.)

### Rounding & precision

- All conversions **floor** → the user always gets slightly fewer shares on deposit and
  slightly less on withdraw; dust accrues to remaining holders. The pool is never
  over-drawn.
- `shares` and all intermediate products are `u128`; keep `checked_*` (not `saturating_*`)
  so overflow errors rather than silently truncating.

### Security hardening folded in (from the review)

- **Pin the mint:** store it on `Reserve` and `require_keys_eq!(reserve.mint, mint.key())`
  in every instruction; add `token::mint = mint` / `token::authority = …` constraints to
  `reserve_vault`, `funder_token_account`, `user_token_account` in `Deposit`/`Withdraw`.
- **Admin gate** on `initialize_reserve` + `add_yield`.
- Keep: `has_one = authority` on withdraw, seed-derived PDAs, typed `Program<Token>` CPI,
  `overflow-checks = true`.
- Add `emit!` events on deposit/withdraw/add_yield for off-chain reconciliation.

## Backend & UI changes

- `onchain.ts`: `deposit` unchanged (still `deposit(amount)`); `withdraw` switches to shares
  (convert the user's dollar request → shares, or "withdraw max" = all shares).
- `getVaultOnChain`: value = `vault.shares × share_price`, where
  `share_price = (reserve_vault.amount + VIRT_ASSETS) / (total_shares + VIRT_SHARES)`.
  Return `{ valueUsd, depositedUsd, yieldUsd = value − deposited }`.
- Ledger: "invested" becomes the on-chain share value (grows over time); track cumulative
  `depositedUsd` to derive "yield earned". The pending/earmark side is unchanged.
- New **yield cron** (backend): every N minutes call `add_yield` for
  `total_assets × target_apy × elapsed/year`.
- UI: "6% a year" becomes the **target** (`target_apy_bps`); optionally also show *realized*
  APY from share-price samples. The number stops being a per-vault promise.

## Migration

The `Vault`/`Reserve` layouts change, so existing accounts can't be read by the new program
→ **not an upgrade-in-place.** Because it's all devnet test data (no real funds):

- Simplest: bump the PDA seed version (`b"reserve_v2"`, `b"vault_v2"`) or deploy a fresh
  program id, then re-init and reset test state. Old vaults are abandoned (test only).
- For the eventual mainnet launch this is just a clean first init.

## Resolved decisions (friendly defaults)

1. **Program API is shares; the UI stays dollars.** `withdraw` takes shares on-chain and the
   program exposes a "withdraw all" (burn all shares) path. **The user only ever deals in
   dollars** — they tap "Get it all back" (→ burn all) or type an amount, and the backend
   converts dollars → shares (ceil the burn, clamp the payout so they never get less than
   the dollars shown). Shares never surface in the app.
2. **Devnet yield = a quiet backend cron** calling admin `add_yield`. Users just watch the
   balance grow; nothing to configure or understand.
3. **Migration = PDA seed bump (`_v2`)**, keeping the same program id + upgrade authority. No
   user impact (devnet test state is reset).
4. **Keep `target_apy_bps` on-chain** purely to drive the friendly "~6% a year" label;
   clearly advisory. The real growth is whatever the pool actually earns.

## Test plan (anchor)

- Two users deposit at different times; `add_yield` runs; both withdraw → each gets a fair
  pro-rata share, earlier depositor earns more (was in longer).
- First-depositor inflation attack (deposit 1 + donate) → victim still gets fair shares.
- Withdraw-all burns all shares; partial withdraw leaves correct remainder.
- Invariant (property test over random deposit/withdraw/yield sequences):
  `Σ(vault_i.shares) == reserve.total_shares` and
  `Σ(vault_i.shares × price) ≤ reserve_vault.amount` always.
- Rounding: no sequence ever lets total payouts exceed total assets.

## Rollout order

1. Implement new program (new seeds) + anchor tests green.
2. Deploy to devnet; admin-init reserve; seed virtual offset.
3. Update `onchain.ts` + ledger valuation + withdraw-by-shares.
4. Add the yield cron.
5. Update the dashboard "In vault / Yield earned" to read share value.
6. Reset devnet test state; smoke-test deposit → yield accrues → withdraw.
