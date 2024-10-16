import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import { assert } from "chai";

describe("lottery", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Lottery as Program<Lottery>;

  let masterPDA: anchor.web3.PublicKey;
  let masterBump: number;

  let lotteryPDA: anchor.web3.PublicKey;
  let lotteryBump: number;

  let ticketPDA: anchor.web3.PublicKey;
  let ticketBump: number;

  const buyer1Keypair = anchor.web3.Keypair.generate();

  const MASTER_SEED = "master";
  const LOTTERY_SEED = "lottery";
  const TICKET_SEED = "ticket";

  it("Initialize Master Account", async () => {
    [ masterPDA, masterBump ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(MASTER_SEED)],
      program.programId
    );
    await program.methods.initMaster().accounts({
      master: masterPDA,
      payer: buyer1Keypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

    const master = await program.account.master.fetch(masterPDA);
    assert.ok(master.lastId === 0);
  });
});
