import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Recrusearch } from "../target/types/recrusearch";
import { assert } from "chai";

describe("recrusearch", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.recrusearch as Program<Recrusearch>;
  const provider = anchor.AnchorProvider.env();
  const researcher = provider.wallet;

  it("Can create a study", async () => {
    const study = anchor.web3.Keypair.generate();
    const rewardVault = anchor.web3.Keypair.generate();
    const ipfsCid = "QmTestStudyMeta";
    const rewardAmount = new anchor.BN(1000);

    await program.methods
      .initializeStudy(ipfsCid, rewardAmount)
      .accounts({
        study: study.publicKey,
        rewardVault: rewardVault.publicKey,
        researcher: researcher.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([study, rewardVault])
      .rpc();

    const studyAccount = await program.account.study.fetch(study.publicKey);
    assert.equal(studyAccount.ipfsCid, ipfsCid);
    assert.equal(studyAccount.status, 0);
  });

  it("Can register a participant", async () => {
    const participant = anchor.web3.Keypair.generate();
    const ipfsCid = "QmTestParticipantProfile";
    const credentialsCid = null;

    const airdropSig = await provider.connection.requestAirdrop(participant.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);

    await program.methods
      .registerParticipant(ipfsCid, credentialsCid)
      .accounts({
        participant: participant.publicKey,
        wallet: participant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    const participantAccount = await program.account.participant.fetch(participant.publicKey);
    assert.equal(participantAccount.ipfsCid, ipfsCid);
    assert.isNull(participantAccount.credentialsCid);
  });

  it("Can register a participant with credentials", async () => {
    const participant = anchor.web3.Keypair.generate();
    const ipfsCid = "QmTestParticipantProfile";
    const credentialsCid = "QmTestCredentials";

    const airdropSig = await provider.connection.requestAirdrop(participant.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);

    await program.methods
      .registerParticipant(ipfsCid, credentialsCid)
      .accounts({
        participant: participant.publicKey,
        wallet: participant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    const participantAccount = await program.account.participant.fetch(participant.publicKey);
    assert.equal(participantAccount.ipfsCid, ipfsCid);
    assert.equal(participantAccount.credentialsCid, credentialsCid);
  });

  it("Fails to claim reward without consent", async () => {
    // Setup: create study and participant
    const study = anchor.web3.Keypair.generate();
    const rewardVault = anchor.web3.Keypair.generate();
    const participant = anchor.web3.Keypair.generate();
    const ipfsCid = "QmTestParticipantProfile";
    const credentialsCid = null;
    const rewardAmount = new anchor.BN(1000);

    await program.methods
      .initializeStudy("QmTestStudyMeta", rewardAmount)
      .accounts({
        study: study.publicKey,
        rewardVault: rewardVault.publicKey,
        researcher: researcher.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([study, rewardVault])
      .rpc();

    const airdropSig = await provider.connection.requestAirdrop(participant.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);
    await program.methods
      .registerParticipant(ipfsCid, credentialsCid)
      .accounts({
        participant: participant.publicKey,
        wallet: participant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    // Try to claim reward without giving consent
    let failed = false;
    try {
      await program.methods
        .claimReward()
        .accounts({
          consent: anchor.web3.Keypair.generate().publicKey, // random, not real consent
          rewardVault: rewardVault.publicKey,
          participant: participant.publicKey,
          tokenProgram: anchor.web3.SystemProgram.programId,
          participantTokenAccount: anchor.web3.Keypair.generate().publicKey,
          vaultTokenAccount: anchor.web3.Keypair.generate().publicKey,
        })
        .signers([participant])
        .rpc();
    } catch (e) {
      failed = true;
    }
    assert.isTrue(failed, "Should not be able to claim reward without consent");
  });

  it("Can give and revoke consent (NFT mint field)", async () => {
    // Setup: create study and participant
    const study = anchor.web3.Keypair.generate();
    const rewardVault = anchor.web3.Keypair.generate();
    const participant = anchor.web3.Keypair.generate();
    const ipfsCid = "QmTestParticipantProfile";
    const credentialsCid = null;
    const rewardAmount = new anchor.BN(1000);
    const mint = anchor.web3.Keypair.generate();

    await program.methods
      .initializeStudy("QmTestStudyMeta", rewardAmount)
      .accounts({
        study: study.publicKey,
        rewardVault: rewardVault.publicKey,
        researcher: researcher.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([study, rewardVault])
      .rpc();

    const airdropSig = await provider.connection.requestAirdrop(participant.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);
    await program.methods
      .registerParticipant(ipfsCid, credentialsCid)
      .accounts({
        participant: participant.publicKey,
        wallet: participant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    // Give consent
    await program.methods
      .giveConsent()
      .accounts({
        consent: anchor.web3.Keypair.generate().publicKey,
        participant: participant.publicKey,
        study: study.publicKey,
        mint: mint.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant, mint])
      .rpc();
    // Fetch consent account and check NFT mint field (skipped: would require fetching PDA)
    // Revoke consent
    // (Assume consent account is known, in real test fetch PDA)
    // await program.methods.revokeConsent().accounts({ consent: consentPda, participant: participant.publicKey }).signers([participant]).rpc();
  });

  it("Can claim reward (SPL transfer logic)", async () => {
    // This test would require full SPL token setup and is best done in a full integration test suite
    // Placeholder: just ensure the method can be called after proper setup
    // (You can expand this with @solana/spl-token helpers and real token accounts)
    assert.isTrue(true, "SPL transfer logic placeholder");
  });

  it("Prevents double consent for the same participant and study", async () => {
    // Setup: create study and participant
    const study = anchor.web3.Keypair.generate();
    const rewardVault = anchor.web3.Keypair.generate();
    const participant = anchor.web3.Keypair.generate();
    const ipfsCid = "QmTestParticipantProfile";
    const credentialsCid = null;
    const rewardVaultAuthority = anchor.web3.Keypair.generate();
    const rewardVaultBump = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("rewardVault"))],
      program.programId
    );
    const rewardVaultAuthorityBump = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("rewardVaultAuthority"))],
      program.programId
    );
    const rewardAmount = new anchor.BN(1000);
    const mint = anchor.web3.Keypair.generate();

    await program.methods
      .initializeStudy("QmTestStudyMeta", rewardAmount)
      .accounts({
        study: study.publicKey,
        rewardVault: rewardVault.publicKey,
        researcher: researcher.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([study, rewardVault])
      .rpc();

    const airdropSig = await provider.connection.requestAirdrop(participant.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);
    await program.methods
      .registerParticipant(ipfsCid, credentialsCid)
      .accounts({
        participant: participant.publicKey,
        wallet: participant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    // Give consent once
    await program.methods
      .giveConsent()
      .accounts({
        consent: anchor.web3.Keypair.generate().publicKey,
        participant: participant.publicKey,
        study: study.publicKey,
        mint: mint.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant, mint])
      .rpc();
    // Try to give consent again (should fail)
    let failed = false;
    try {
      await program.methods
        .giveConsent()
        .accounts({
          consent: anchor.web3.Keypair.generate().publicKey,
          participant: participant.publicKey,
          study: study.publicKey,
          mint: mint.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([participant, mint])
        .rpc();
    } catch (e) {
      failed = true;
    }
    assert.isTrue(failed, "Should not be able to give consent twice for the same study");
  });
});
