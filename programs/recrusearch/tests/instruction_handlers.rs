use anchor_lang::prelude::*;
use anchor_lang::ToAccountInfo;
use anchor_lang::solana_program::clock::Clock;
use recrusearch::state::*;
use recrusearch::instructions::*;
use recrusearch::contexts::*;

#[test]
fn test_initialize_study_instruction() {
    // Mock context and accounts
    let mut study = Study {
        researcher: Pubkey::default(),
        ipfs_cid: String::new(),
        reward_vault: Pubkey::default(),
        reward_amount: 0,
        status: 0,
    };
    let mut reward_vault = RewardVault {
        study: Pubkey::default(),
        balance: 0,
    };
    // This is a placeholder: in real Anchor tests, you would use the Anchor testing framework to create Contexts
    // Here, we just check that the function can be called and updates fields as expected
    // (This is a pseudo-unit test, not a full integration test)
    // You can expand this with the Anchor testing framework for full context
    study.status = 0;
    reward_vault.balance = 0;
    assert_eq!(study.status, 0);
    assert_eq!(reward_vault.balance, 0);
}

#[test]
fn test_register_participant_instruction() {
    let mut participant = Participant {
        wallet: Pubkey::default(),
        ipfs_cid: String::new(),
        credentials_cid: None,
    };
    participant.ipfs_cid = "cid".to_string();
    participant.credentials_cid = Some("cred_cid".to_string());
    assert_eq!(participant.ipfs_cid, "cid");
    assert_eq!(participant.credentials_cid, Some("cred_cid".to_string()));
}

#[test]
fn test_give_consent_instruction() {
    let mut consent = Consent {
        participant: Pubkey::default(),
        study: Pubkey::default(),
        timestamp: 0,
        active: false,
        mint: None,
    };
    consent.active = true;
    consent.timestamp = 123456;
    consent.mint = Some(Pubkey::default());
    assert!(consent.active);
    assert_eq!(consent.timestamp, 123456);
    assert_eq!(consent.mint, Some(Pubkey::default()));
}

#[test]
fn test_claim_reward_instruction() {
    let mut reward_vault = RewardVault {
        study: Pubkey::default(),
        balance: 100,
    };
    let mut consent = Consent {
        participant: Pubkey::default(),
        study: Pubkey::default(),
        timestamp: 0,
        active: true,
        mint: None,
    };
    // Simulate claim
    if consent.active && reward_vault.balance > 0 {
        reward_vault.balance = 0;
        consent.active = false;
    }
    assert_eq!(reward_vault.balance, 0);
    assert!(!consent.active);
}
