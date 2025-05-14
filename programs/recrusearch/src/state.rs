use anchor_lang::prelude::*;

#[account]
/// Represents a research study with associated metadata and reward information.
pub struct Study {
    pub researcher: Pubkey,
    pub ipfs_cid: String,
    pub reward_vault: Pubkey,
    pub reward_amount: u64,
    pub status: u8, // 0=open, 1=closed
}

impl Study {
    pub fn is_open(&self) -> bool {
        self.status == 0
    }
    pub fn is_closed(&self) -> bool {
        self.status == 1
    }
}

#[account]
/// Represents a participant in a study, including optional off-chain credentials.
pub struct Participant {
    pub wallet: Pubkey,
    pub ipfs_cid: String,
    pub credentials_cid: Option<String>, // Optional off-chain credentials
}

#[account]
/// Represents consent given by a participant for a study, with optional NFT-based consent.
pub struct Consent {
    pub participant: Pubkey,
    pub study: Pubkey,
    pub timestamp: i64,
    pub active: bool,
    pub mint: Option<Pubkey>, // NFT mint address for consent
}

impl Consent {
    pub fn is_active(&self) -> bool {
        self.active
    }
    pub fn is_revoked(&self) -> bool {
        !self.active
    }
}

#[account]
/// Represents a vault holding rewards for a study.
pub struct RewardVault {
    pub study: Pubkey,
    pub balance: u64,
}

impl RewardVault {
    pub fn has_balance(&self) -> bool {
        self.balance > 0
    }
}