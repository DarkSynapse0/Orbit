use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi");

/// Simulated yield rate (basis points). 600 = 6% APY. On devnet there is no real market,
/// so the rate is fixed; the *mechanics* (funds pooled in a reserve, interest paid out in
/// real tokens) are production-shaped. Swapping in Kamino = pointing deposit/withdraw at
/// Kamino's program instead of this reserve.
const APY_BPS: u128 = 600;
const SECONDS_PER_YEAR: u128 = 31_536_000;

#[program]
pub mod orbit_vault {
    use super::*;

    /// One-time setup of the shared yield reserve — the on-chain "venue" (a lending pool)
    /// that holds pooled USDC and pays interest. Stands in for Kamino on devnet. After this,
    /// the admin prefunds the interest buffer by transferring USDC into `reserve_vault`.
    pub fn initialize_reserve(ctx: Context<InitializeReserve>, apy_bps: u16) -> Result<()> {
        let r = &mut ctx.accounts.reserve;
        r.mint = ctx.accounts.mint.key();
        r.apy_bps = apy_bps;
        r.total_principal = 0;
        r.bump = ctx.bumps.reserve;
        Ok(())
    }

    /// Create a user's savings vault (position accounting). The `payer` funds rent (can be
    /// the Orbit backend); the `owner` owns the vault and is the only key that can withdraw.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.owner.key();
        vault.mint = ctx.accounts.mint.key();
        vault.principal = 0;
        vault.accrued_yield = 0;
        vault.last_update_ts = Clock::get()?.unix_timestamp;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    /// Deposit USDC into a vault's position and route the funds into the yield reserve.
    /// Anyone (the user, or Orbit's backend at threshold) may fund a vault; only the owner
    /// can withdraw. Accrues yield first, then folds in the new principal.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        accrue(&mut ctx.accounts.vault)?;

        // Real transfer of the deposit into the yield venue (the reserve pool).
        let cpi = CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.funder_token_account.to_account_info(),
                to: ctx.accounts.reserve_vault.to_account_info(),
                authority: ctx.accounts.funder.to_account_info(),
            },
        );
        token::transfer(cpi, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.principal = vault.principal.checked_add(amount).ok_or(VaultError::MathOverflow)?;
        // Track pooled principal so withdraw can guarantee it's always fully backed.
        let reserve = &mut ctx.accounts.reserve;
        reserve.total_principal = reserve.total_principal.checked_add(amount).ok_or(VaultError::MathOverflow)?;
        Ok(())
    }

    /// Withdraw principal + its proportional share of accrued yield from the reserve back to
    /// the user's wallet. The reserve pays interest out of its buffer — so the user receives
    /// MORE than they deposited. Only the vault owner (authority) can call this.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        accrue(&mut ctx.accounts.vault)?;

        let principal = ctx.accounts.vault.principal;
        require!(amount <= principal, VaultError::InsufficientPrincipal);

        // Interest paid out is proportional to the principal being withdrawn.
        let accrued = ctx.accounts.vault.accrued_yield as u128;
        let mut interest = (accrued * amount as u128 / principal as u128) as u64;

        // Solvency guard: the reserve must never pay interest out of other users' principal.
        // The interest buffer is whatever the reserve holds above all pooled principal; cap the
        // payout to it so a principal withdrawal can ALWAYS be honored (no pool insolvency).
        let buffer = ctx
            .accounts
            .reserve_vault
            .amount
            .saturating_sub(ctx.accounts.reserve.total_principal);
        if interest > buffer {
            interest = buffer;
        }
        let payout = amount.checked_add(interest).ok_or(VaultError::MathOverflow)?;

        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.accounts.reserve.bump;
        let seeds: &[&[u8]] = &[b"reserve", mint_key.as_ref(), &[bump]];
        let signer = &[seeds];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.reserve_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.reserve.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi, payout)?;

        let vault = &mut ctx.accounts.vault;
        vault.principal = vault.principal.checked_sub(amount).ok_or(VaultError::MathOverflow)?;
        vault.accrued_yield = vault.accrued_yield.saturating_sub(interest);
        let reserve = &mut ctx.accounts.reserve;
        reserve.total_principal = reserve.total_principal.checked_sub(amount).ok_or(VaultError::MathOverflow)?;
        Ok(())
    }
}

/// Fold elapsed simulated yield into accrued_yield and stamp the update time.
fn accrue(vault: &mut Account<Vault>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let elapsed = now.saturating_sub(vault.last_update_ts);
    if elapsed > 0 && vault.principal > 0 {
        let y = (vault.principal as u128)
            .saturating_mul(APY_BPS)
            .saturating_mul(elapsed as u128)
            / (10_000u128 * SECONDS_PER_YEAR);
        vault.accrued_yield = vault.accrued_yield.saturating_add(y as u64);
    }
    vault.last_update_ts = now;
    Ok(())
}

#[account]
pub struct Reserve {
    pub mint: Pubkey,
    pub apy_bps: u16,
    pub total_principal: u64,
    pub bump: u8,
}

impl Reserve {
    // 8 discriminator + 32 + 2 + 8 + 1
    pub const LEN: usize = 8 + 32 + 2 + 8 + 1;
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub principal: u64,
    pub accrued_yield: u64,
    pub last_update_ts: i64,
    pub bump: u8,
}

impl Vault {
    // 8 discriminator + 32 + 32 + 8 + 8 + 8 + 1
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1;
}

#[derive(Accounts)]
pub struct InitializeReserve<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = Reserve::LEN,
        seeds = [b"reserve", mint.key().as_ref()],
        bump
    )]
    pub reserve: Account<'info, Reserve>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        token::mint = mint,
        token::authority = reserve,
        seeds = [b"reserve_vault", mint.key().as_ref()],
        bump
    )]
    pub reserve_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: only used to derive the vault PDA and set as owner; not read or written.
    pub owner: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = Vault::LEN,
        seeds = [b"vault", owner.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    /// CHECK: only used to derive the vault PDA; identifies whose vault is being funded.
    pub owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref(), mint.key().as_ref()],
        bump = vault.bump,
        has_one = mint
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut, seeds = [b"reserve", mint.key().as_ref()], bump = reserve.bump)]
    pub reserve: Account<'info, Reserve>,

    #[account(mut, seeds = [b"reserve_vault", mint.key().as_ref()], bump)]
    pub reserve_vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref(), mint.key().as_ref()],
        bump = vault.bump,
        has_one = authority,
        has_one = mint
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut, seeds = [b"reserve", mint.key().as_ref()], bump = reserve.bump)]
    pub reserve: Account<'info, Reserve>,

    #[account(mut, seeds = [b"reserve_vault", mint.key().as_ref()], bump)]
    pub reserve_vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum VaultError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient principal in vault")]
    InsufficientPrincipal,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
