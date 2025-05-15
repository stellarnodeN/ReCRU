use anchor_lang::prelude::*;
use recrusearch::state::*;

#[test]
fn test_study_struct_fields() {
    let mut study = Study {
        researcher: Pubkey::default(),
        ipfs_cid: String::from("testcid"),
        reward_vault: Pubkey::default(),
        reward_amount: 42,
        status: 0,
    };
    assert_eq!(study.ipfs_cid, "testcid");
    assert_eq!(study.reward_amount, 42);
    study.status = 1;
    assert_eq!(study.status, 1);
}

#[test]
fn test_participant_struct_fields() {
    let mut participant = Participant {
        wallet: Pubkey::default(),
        ipfs_cid: String::from("cid"),
        credentials_cid: None,
    };
    assert_eq!(participant.ipfs_cid, "cid");
    participant.credentials_cid = Some("cred_cid".to_string());
    assert_eq!(participant.credentials_cid, Some("cred_cid".to_string()));
}

#[test]
fn test_consent_struct_fields() {
    let mut consent = Consent {
        participant: Pubkey::default(),
        study: Pubkey::default(),
        timestamp: 123,
        active: true,
        mint: None,
    };
    assert!(consent.active);
    consent.active = false;
    assert!(!consent.active);
}
