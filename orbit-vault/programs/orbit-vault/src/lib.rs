use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi");

/// Simulated yield rate for the hackathon vault (basis points). 600 = 6% APY.
const APY_BPS: u128 = 600;
const SECONDS_PER_YEAR: u128 = 31_536_000;

#[program]
pub mod orbit_vault {
    use super::*;

    /// Create a user's savings vault + its USDC token account (the on-chain chamber).
    /// The `payer` funds rent (can be the Orbit backend); the `owner` owns the vault and
    /// is the only key that can ever withdraw. This lets Orbit open a vault for a user.
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

    /// Deposit USDC into a vault. Anyone (the user, or Orbit's backend at threshold) may
    /// fund a vault; the `funder` provides the USDC and signs. Only the owner can withdraw.
    /// Accrues yield first, then folds in the new principal.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        accrue(&mut ctx.accounts.vault)?;

        let cpi = CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.funder_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.funder.to_account_info(),
            },
        );
        token::transfer(cpi, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.principal = vault.principal.checked_add(amount).unwrap();
        Ok(())
    }

    /// Withdraw principal back to the user's wallet. Yield keeps accruing and is tracked
    /// on-chain (paid out in a later iteration); v1 returns principal, instant if liquid.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        accrue(&mut ctx.accounts.vault)?;
        require!(amount <= ctx.accounts.vault.principal, VaultError::InsufficientPrincipal);

        let authority_key = ctx.accounts.authority.key();
        let bump = ctx.accounts.vault.bump;
        let seeds: &[&[u8]] = &[b"vault", authority_key.as_ref(), &[bump]];
        let signer = &[seeds];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.principal = vault.principal.checked_sub(amount).unwrap();
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
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: only used to derive the vault PDA and set as owner; not read or written.
    pub owner: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = Vault::LEN,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = vault,
        seeds = [b"vault_token", owner.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
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
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_token", owner.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

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
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
        has_one = authority
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_token", authority.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

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
}
