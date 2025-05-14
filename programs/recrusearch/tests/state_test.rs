use anchor_lang::prelude::*;
use crate::state::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_study_status() {
        let study = Study {
            researcher: Pubkey::default(),
            ipfs_cid: "cid".to_string(),
            reward_vault: Pubkey::default(),
            reward_amount: 100,
            status: 0,
        };
        assert!(study.is_open());
        assert!(!study.is_closed());
        let closed_study = Study { status: 1, ..study };
        assert!(!closed_study.is_open());
        assert!(closed_study.is_closed());
    }

    #[test]
    fn test_consent_status() {
        let consent = Consent {
            participant: Pubkey::default(),
            study: Pubkey::default(),
            timestamp: 0,
            active: true,
            mint: None,
        };
        assert!(consent.is_active());
        assert!(!consent.is_revoked());
        let revoked = Consent { active: false, ..consent };
        assert!(!revoked.is_active());
        assert!(revoked.is_revoked());
    }
}
