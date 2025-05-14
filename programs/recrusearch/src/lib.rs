use anchor_lang::prelude::*;

// Declare submodules
pub mod instructions;
pub mod state;
pub mod contexts;

// Re-export context types at the crate root for easy access
//pub use self::contexts::{
    //InitializeStudy,
    //CloseStudy,
    //RegisterParticipant,
    //GiveConsent,
    //vokeConsent,
    //mReward,
//};

use crate::instructions::*;
use crate:: state::*;
use crate::contexts::*;

declare_id!("DFTY5PLAqv4NHce8Wsh6v11efdobnAAW5SvLHq3HQ3J3");

#[program]
pub mod recrusearch {
    use super::*;

    pub fn initialize_study(
        ctx: Context<InitializeStudy>,
        ipfs_cid: String,
        reward_amount: u64,
    ) -> Result<()> {
        instructions::initialize_study(ctx, ipfs_cid, reward_amount)
    }

    pub fn close_study(
        ctx: Context<CloseStudy>,
    ) -> Result<()> {
        instructions::close_study(ctx)
    }

    pub fn register_participant(
        ctx: Context<RegisterParticipant>,
        ipfs_cid: String,
    ) -> Result<()> {
        instructions::register_participant(ctx, ipfs_cid)
    }

    pub fn give_consent(
        ctx: Context<GiveConsent>,
    ) -> Result<()> {
        instructions::give_consent(ctx)
    }

    pub fn revoke_consent(
        ctx: Context<RevokeConsent>,
    ) -> Result<()> {
        instructions::revoke_consent(ctx)
    }

    pub fn claim_reward(
        ctx: Context<ClaimReward>,
    ) -> Result<()> {
        instructions::claim_reward(ctx)
    }
}