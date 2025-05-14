use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeStudy<'info> {
    #[account(init, payer = researcher, space = 8 + 32 + 64 + 32 + 8 + 1)]
    pub study: Account<'info, Study>,
    #[account(init, payer = researcher, space = 8 + 32 + 8)]
    pub reward_vault: Account<'info, RewardVault>,
    #[account(mut)]
    pub researcher: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseStudy<'info> {
    #[account(mut, has_one = researcher)]
    pub study: Account<'info, Study>,
    pub researcher: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegisterParticipant<'info> {
    #[account(init, payer = wallet, space = 8 + 32 + 64)]
    pub participant: Account<'info, Participant>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GiveConsent<'info> {
    #[account(init, payer = participant, space = 8 + 32 + 32 + 8 + 1)]
    pub consent: Account<'info, Consent>,
    #[account(mut)]
    pub participant: Signer<'info>,
    #[account(mut)]
    pub study: Account<'info, Study>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeConsent<'info> {
    #[account(mut, has_one = participant)]
    pub consent: Account<'info, Consent>,
    pub participant: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut, has_one = participant)]
    pub consent: Account<'info, Consent>,
    #[account(mut)]
    pub reward_vault: Account<'info, RewardVault>,
    #[account(mut)]
    pub participant: Signer<'info>,
}