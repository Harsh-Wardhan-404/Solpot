use anchor_lang::prelude::*;

declare_id!("4QNzS1m3q4TfBdadQ6Fq9zVg9QCp9RwEfHk8d7ewBP7V");

#[program]
pub mod universal_pot {
    use super::*;

    pub fn init_pot(
        ctx: Context<InitPot>,
        capacity_lamports: u64,
        deadline_ts: i64,
        fee_bps: u16,
        cooldown_secs: u16,
    ) -> Result<()> {
        require!(capacity_lamports > 0, PotError::InvalidCapacity);
        let now = Clock::get()?.unix_timestamp;
        require!(deadline_ts > now, PotError::InvalidDeadline);
        require!(fee_bps <= 1000, PotError::FeeTooHigh);

        // Create the system-owned vault PDA (0 space) with rent-exempt lamports
        // so it can hold SOL and sign transfers via PDA seeds.
        let rent_lamports = Rent::get()?.minimum_balance(0);
        if ctx.accounts.vault.data_is_empty() {
            let create_ix = anchor_lang::solana_program::system_instruction::create_account(
                &ctx.accounts.authority.key(),
                &ctx.accounts.vault.key(),
                rent_lamports,
                0,
                &anchor_lang::solana_program::system_program::ID,
            );
            let vault_seeds: &[&[u8]] = &[b"vault", &[ctx.bumps.vault]];
            anchor_lang::solana_program::program::invoke_signed(
                &create_ix,
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[vault_seeds],
            )?;
        }

        let pot = &mut ctx.accounts.pot;
        pot.authority = ctx.accounts.authority.key();
        // Dedicated vault PDA
        pot.vault = ctx.accounts.vault.key();
        pot.vault_bump = ctx.bumps.vault;
        pot.capacity_lamports = capacity_lamports;
        pot.deadline_ts = deadline_ts;
        pot.total_deposited = 0;
        pot.last_depositor = Pubkey::default();
        pot.status = Status::Open as u8;
        pot.fee_bps = fee_bps;
        pot.winner = Pubkey::default();
        pot.cooldown_secs = cooldown_secs;
        pot.bump = ctx.bumps.pot;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount >= MIN_INCREMENT, PotError::TooSmall);
        // Read-only checks before any mutable borrows
        let pot_status = ctx.accounts.pot.status;
        let pot_deadline = ctx.accounts.pot.deadline_ts;
        let pot_cooldown = ctx.accounts.pot.cooldown_secs as i64;
        require!(pot_status == Status::Open as u8, PotError::Closed);
        let now = Clock::get()?.unix_timestamp;
        require!(now < pot_deadline, PotError::DeadlineReached);

        let depositor = &mut ctx.accounts.depositor_state;
        if depositor.last_deposit_ts != 0 {
            require!(
                now - depositor.last_deposit_ts >= pot_cooldown,
                PotError::Cooldown
            );
        }

        // Transfer to vault (no refunds)
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        // Now mutate pot after the CPI to avoid borrow conflicts
        let pot = &mut ctx.accounts.pot;
        pot.total_deposited = pot
            .total_deposited
            .checked_add(amount)
            .ok_or(PotError::Overflow)?;
        pot.last_depositor = ctx.accounts.user.key();
        depositor.last_deposit_ts = now;
        depositor.total_contributed = depositor
            .total_contributed
            .checked_add(amount)
            .ok_or(PotError::Overflow)?;

        if pot.total_deposited >= pot.capacity_lamports {
            pot.status = Status::Finalizing as u8;
        }
        Ok(())
    }

    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        // Read-only checks first
        let status = ctx.accounts.pot.status;
        let deadline_ts = ctx.accounts.pot.deadline_ts;
        let fee_bps = ctx.accounts.pot.fee_bps as u64;
        require!(
            status == Status::Finalizing as u8
                || (status == Status::Open as u8 && Clock::get()?.unix_timestamp >= deadline_ts),
            PotError::NotReadyToFinalize
        );

        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        require!(vault_balance > 0, PotError::EmptyVault);

        let platform_fee = vault_balance
            .checked_mul(fee_bps)
            .ok_or(PotError::Overflow)?
            / 10_000;
        let rakeback = vault_balance / 20; // 5%
        let winner_payout = vault_balance
            .checked_sub(platform_fee)
            .and_then(|v| v.checked_sub(rakeback))
            .ok_or(PotError::Underflow)?;

        // Payout winner from vault PDA
        {
            let seeds: &[&[u8]] = &[b"vault", &[ctx.accounts.pot.vault_bump]];
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.winner.key(),
                winner_payout,
            );
            anchor_lang::solana_program::program::invoke_signed(
                &ix,
                &[
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.winner.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[seeds],
            )?;
        }

        // Payout platform (includes rakeback to same treasury for MVP)
        let platform_total = platform_fee
            .checked_add(rakeback)
            .ok_or(PotError::Overflow)?;
        {
            let seeds: &[&[u8]] = &[b"vault", &[ctx.accounts.pot.vault_bump]];
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.platform_treasury.key(),
                platform_total,
            );
            anchor_lang::solana_program::program::invoke_signed(
                &ix,
                &[
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.platform_treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[seeds],
            )?;
        }
        // Now set winner and status
        let pot = &mut ctx.accounts.pot;
        pot.winner = pot.last_depositor;
        pot.status = Status::Settled as u8;
        Ok(())
    }

    pub fn reset_pot(
        ctx: Context<ResetPot>,
        capacity_lamports: u64,
        deadline_ts: i64,
        fee_bps: u16,
        cooldown_secs: u16,
    ) -> Result<()> {
        require!(capacity_lamports > 0, PotError::InvalidCapacity);
        let now = Clock::get()?.unix_timestamp;
        require!(deadline_ts > now, PotError::InvalidDeadline);
        require!(fee_bps <= 1000, PotError::FeeTooHigh);

        let pot = &mut ctx.accounts.pot;
        // Only authority can reset
        require!(
            pot.authority == ctx.accounts.authority.key(),
            PotError::Unauthorized
        );
        // Only allow reset after settlement
        require!(pot.status == Status::Settled as u8, PotError::Closed);
        // Ensure vault is empty to avoid mixing funds
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        require!(vault_balance == 0, PotError::VaultNotEmpty);

        pot.capacity_lamports = capacity_lamports;
        pot.deadline_ts = deadline_ts;
        pot.total_deposited = 0;
        pot.last_depositor = Pubkey::default();
        pot.status = Status::Open as u8;
        pot.fee_bps = fee_bps;
        pot.winner = Pubkey::default();
        pot.cooldown_secs = cooldown_secs;
        Ok(())
    }
}

pub const MIN_INCREMENT: u64 = 10_000_000; // 0.01 SOL

#[derive(Accounts)]
pub struct InitPot<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Pot::SIZE,
        seeds = [b"pot"],
        bump
    )]
    pub pot: Account<'info, Pot>,
    /// CHECK: vault PDA holds SOL; will be created manually as a system account with 0 space
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"pot"], bump = pot.bump)]
    pub pot: Account<'info, Pot>,
    /// CHECK: vault holds SOL (system-owned)
    #[account(mut, seeds = [b"vault"], bump = pot.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + DepositorState::SIZE,
        seeds = [b"depositor", pot.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub depositor_state: Account<'info, DepositorState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(mut, seeds = [b"pot"], bump = pot.bump)]
    pub pot: Account<'info, Pot>,
    /// CHECK: vault holds SOL (system-owned)
    #[account(mut, seeds = [b"vault"], bump = pot.vault_bump)]
    pub vault: SystemAccount<'info>,
    /// CHECK: winner account = pot.last_depositor
    #[account(mut, address = pot.last_depositor)]
    pub winner: SystemAccount<'info>,
    /// CHECK: platform treasury
    #[account(mut)]
    pub platform_treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pot {
    pub authority: Pubkey,
    pub vault: Pubkey,
    pub capacity_lamports: u64,
    pub deadline_ts: i64,
    pub total_deposited: u64,
    pub last_depositor: Pubkey,
    pub status: u8,
    pub fee_bps: u16,
    pub winner: Pubkey,
    pub cooldown_secs: u16,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Pot {
    pub const SIZE: usize = 32 + 32 + 8 + 8 + 8 + 32 + 1 + 2 + 32 + 2 + 1 + 1;
}

#[account]
pub struct DepositorState {
    pub last_deposit_ts: i64,
    pub total_contributed: u64,
}

impl DepositorState {
    pub const SIZE: usize = 8 + 8;
}

#[repr(u8)]
pub enum Status {
    Open = 0,
    Finalizing = 1,
    Settled = 2,
}

#[error_code]
pub enum PotError {
    #[msg("Invalid capacity")]
    InvalidCapacity,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Fee too high")]
    FeeTooHigh,
    #[msg("Pot is closed")]
    Closed,
    #[msg("Deadline reached")]
    DeadlineReached,
    #[msg("Deposit too small")]
    TooSmall,
    #[msg("Overflow")]
    Overflow,
    #[msg("Underflow")]
    Underflow,
    #[msg("Cooldown active")]
    Cooldown,
    #[msg("Not ready to finalize")]
    NotReadyToFinalize,
    #[msg("Empty vault")]
    EmptyVault,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Vault must be empty before reset")]
    VaultNotEmpty,
}

#[derive(Accounts)]
pub struct ResetPot<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"pot"], bump = pot.bump)]
    pub pot: Account<'info, Pot>,
    /// CHECK: vault holds SOL (system-owned)
    #[account(mut, seeds = [b"vault"], bump = pot.vault_bump)]
    pub vault: SystemAccount<'info>,
}
