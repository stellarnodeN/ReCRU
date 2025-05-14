use anchor_lang::prelude::*;
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

pub fn register_participant(ctx: Context<RegisterParticipant>, ipfs_cid: String) -> Result<()> {
    let participant = &mut ctx.accounts.participant;
    participant.wallet = ctx.accounts.wallet.key();
    participant.ipfs_cid = ipfs_cid;
    Ok(())
}

pub fn give_consent(ctx: Context<GiveConsent>) -> Result<()> {
    let consent = &mut ctx.accounts.consent;
    let clock = Clock::get()?;
    consent.participant = ctx.accounts.participant.key();
    consent.study = ctx.accounts.study.key();
    consent.timestamp = clock.unix_timestamp;
    consent.active = true;
    Ok(())
}

pub fn revoke_consent(ctx: Context<RevokeConsent>) -> Result<()> {
    let consent = &mut ctx.accounts.consent;
    require!(consent.active, CustomError::ConsentNotActive);
    consent.active = false;
    Ok(())
}

pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let consent = &mut ctx.accounts.consent;
    let reward_vault = &mut ctx.accounts.reward_vault;
    let participant = &mut ctx.accounts.participant;
    // Check study is closed and consent is active
    require!(consent.active, CustomError::ConsentNotActive);
    // For simplicity, assume study is closed if reward_vault.balance > 0
    // In a real implementation, fetch the Study account and check status
    // Here, we assume reward_vault.balance is the reward amount
    require!(reward_vault.balance > 0, CustomError::StudyNotClosed);
    // Transfer reward (for MVP, just mark as claimed)
    reward_vault.balance = 0;
    consent.active = false; // Mark consent as used/claimed
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
} 