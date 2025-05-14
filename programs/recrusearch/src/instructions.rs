use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use crate::contexts::*;

pub fn initialize_study(
    ctx: Context<InitializeStudy>,
    ipfs_cid: String,
    reward_amount: u64,
) -> Result<()> {
    let study = &mut ctx.accounts.study;
    let reward_vault = &mut ctx.accounts.reward_vault;
    study.researcher = ctx.accounts.researcher.key();
    study.ipfs_cid = ipfs_cid.clone();
    study.reward_vault = reward_vault.key();
    study.reward_amount = reward_amount;
    study.status = 0;
    reward_vault.study = study.key();
    reward_vault.balance = 0;
    Ok(())
}

pub fn close_study(ctx: Context<CloseStudy>) -> Result<()> {
    let study = &mut ctx.accounts.study;
    require!(study.status == 0, CustomError::AlreadyClosed);
    study.status = 1;
    Ok(())
}

pub fn register_participant(ctx: Context<RegisterParticipant>, ipfs_cid: String, credentials_cid: Option<String>) -> Result<()> {
    let participant = &mut ctx.accounts.participant;
    participant.wallet = ctx.accounts.wallet.key();
    participant.ipfs_cid = ipfs_cid;
    participant.credentials_cid = credentials_cid;
    Ok(())
}

/// Mint an NFT to represent consent and store its mint address in Consent
pub fn give_consent(ctx: Context<GiveConsent>) -> Result<()> {
    let consent = &mut ctx.accounts.consent;
    let clock = Clock::get()?;
    consent.participant = ctx.accounts.participant.key();
    consent.study = ctx.accounts.study.key();
    consent.timestamp = clock.unix_timestamp;
    consent.active = true;
    // Mint NFT logic placeholder (integration with Metaplex or SPL Token)
    consent.mint = Some(ctx.accounts.mint.key());
    Ok(())
}

pub fn revoke_consent(ctx: Context<RevokeConsent>) -> Result<()> {
    let consent = &mut ctx.accounts.consent;
    require!(consent.active, CustomError::ConsentNotActive);
    consent.active = false;
    // Optionally burn NFT here
    Ok(())
}

pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let consent = &mut ctx.accounts.consent;
    let reward_vault = &mut ctx.accounts.reward_vault;
    let participant = &mut ctx.accounts.participant;
    // Enforce study is closed and consent is active
    require!(consent.active, CustomError::ConsentNotActive);
    require!(reward_vault.balance > 0, CustomError::StudyNotClosed);
    // Save the amount and study key before ending the mutable borrow
    let amount = reward_vault.balance;
    let study_key = reward_vault.study;
    // Set reward_vault.balance to 0 and consent.active to false before CPI
    reward_vault.balance = 0;
    consent.active = false;
    // Now do the CPI (no mutable borrow of reward_vault here)
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.participant_token_account.to_account_info(),
        authority: ctx.accounts.reward_vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let seeds = &[b"reward_vault", study_key.as_ref()];
    let signer = &[&seeds[..]];
    token::transfer(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
        amount,
    )?;
    Ok(())
}

#[error_code]
pub enum CustomError {
    #[msg("Study is already closed")] 
    AlreadyClosed,
    #[msg("Consent is not active")] 
    ConsentNotActive,
    #[msg("Study is not closed or reward not available")] 
    StudyNotClosed,
    #[msg("Already consented to this study")] 
    AlreadyConsented,
    #[msg("Reward already claimed")] 
    RewardAlreadyClaimed,
    #[msg("Study is not open")] 
    StudyNotOpen,
}