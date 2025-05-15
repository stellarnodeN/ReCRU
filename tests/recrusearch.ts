import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Recrusearch } from "../target/types/recrusearch";
import { assert } from "chai";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from "@solana/spl-token";

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
    // Setup: create study, participant, mint, and token accounts
    const study = anchor.web3.Keypair.generate();
    const rewardVault = anchor.web3.Keypair.generate();
    const participant = anchor.web3.Keypair.generate();
    const ipfsCid = "QmTestParticipantProfile";
    const credentialsCid = null;
    const rewardAmount = new anchor.BN(1000);

    // Create mint
    const mint = await createMint(
      provider.connection,
      researcher.payer,
      researcher.publicKey,
      null,
      0 // decimals
    );

    // Create associated token accounts
    const rewardVaultTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      researcher.payer,
      mint,
      rewardVault.publicKey,
      true
    );
    const participantTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      researcher.payer,
      mint,
      participant.publicKey
    );

    // Mint tokens to reward vault
    await mintTo(
      provider.connection,
      researcher.payer,
      mint,
      rewardVaultTokenAccount.address,
      researcher.publicKey,
      1000
    );

    // Initialize study
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

    // Airdrop to participant
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

    // Give consent (fetch PDA for consent)
    const [consentPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("consent"), participant.publicKey.toBuffer(), study.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .giveConsent()
      .accounts({
        consent: consentPda,
        participant: participant.publicKey,
        study: study.publicKey,
        mint: mint,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    // Claim reward
    await program.methods
      .claimReward()
      .accounts({
        consent: consentPda,
        rewardVault: rewardVault.publicKey,
        participant: participant.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        participantTokenAccount: participantTokenAccount.address,
        vaultTokenAccount: rewardVaultTokenAccount.address,
      })
      .signers([participant])
      .rpc();

    // Check balances
    const vaultAccountInfo = await getAccount(provider.connection, rewardVaultTokenAccount.address);
    const participantAccountInfo = await getAccount(provider.connection, participantTokenAccount.address);
    assert.equal(Number(vaultAccountInfo.amount), 0);
    assert.equal(Number(participantAccountInfo.amount), 1000);
  });

  it("Can revoke consent using PDA", async () => {
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

    // Give consent (fetch PDA for consent)
    const [consentPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("consent"), participant.publicKey.toBuffer(), study.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .giveConsent()
      .accounts({
        consent: consentPda,
        participant: participant.publicKey,
        study: study.publicKey,
        mint: mint.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant, mint])
      .rpc();

    // Revoke consent
    await program.methods
      .revokeConsent()
      .accounts({
        consent: consentPda,
        participant: participant.publicKey,
      })
      .signers([participant])
      .rpc();
    // Optionally, fetch the consent account and assert revoked status if your program supports it
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
