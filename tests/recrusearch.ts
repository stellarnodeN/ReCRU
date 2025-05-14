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

    const airdropSig = await provider.connection.requestAirdrop(participant.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);

    await program.methods
      .registerParticipant(ipfsCid)
      .accounts({
        participant: participant.publicKey,
        wallet: participant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    const participantAccount = await program.account.participant.fetch(participant.publicKey);
    assert.equal(participantAccount.ipfsCid, ipfsCid);
  });

  // Additional tests for give_consent, revoke_consent, claim_reward can be added similarly
});
