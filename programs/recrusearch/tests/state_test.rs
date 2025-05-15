use anchor_lang::prelude::*;
use recrusearch::state::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_study_status_methods() {
        let study = Study {
            researcher: Pubkey::default(),
            ipfs_cid: "cid".to_string(),
            reward_vault: Pubkey::default(),
            reward_amount: 100,
            status: 0,
        };
        // Assuming is_open and is_closed are implemented
        assert!(study.is_open());
        assert!(!study.is_closed());
        let closed_study = Study { status: 1, ..study };
        assert!(!closed_study.is_open());
        assert!(closed_study.is_closed());
    }

    #[test]
    fn test_consent_status_methods() {
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

    #[test]
    fn test_participant_credentials_field() {
        let participant = Participant {
            wallet: Pubkey::default(),
            ipfs_cid: "cid".to_string(),
            credentials_cid: Some("cred_cid".to_string()),
        };
        assert_eq!(participant.credentials_cid, Some("cred_cid".to_string()));
        let no_creds = Participant { credentials_cid: None, ..participant };
        assert_eq!(no_creds.credentials_cid, None);
    }
}
