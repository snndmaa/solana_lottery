import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import { assert } from "chai";
import * as fs from "fs";

const fundAccount = async (keypair) => {
  try {
    const connection = anchor.getProvider().connection;
  
    // Request an airdrop of 2 SOL to the buyer1 account (adjust as needed)
    const airdropSignature = await connection.requestAirdrop(
      keypair.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 2 // Airdrop 2 SOL (adjust the amount as necessary)
    );
  
    // Confirm the transaction
    await connection.confirmTransaction(airdropSignature);
    console.log('FUNDED!!!')
  } catch (error) {
    console.error(error);
  }
}

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

  // Load the buyer1 keypair from a JSON file
  const buyer1Keypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("/mnt/c/Solana/solana_lottery/buyer-one-keypair.json", "utf8")))
  );

  before(async () => {
    await fundAccount(buyer1Keypair); // Might fail if on devnet
  })
  

  const MASTER_SEED = "master";
  const LOTTERY_SEED = "lottery";
  const TICKET_SEED = "ticket";

  it("Initializes Master Account", async () => {
    [ masterPDA, masterBump ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(MASTER_SEED)],
      program.programId
    );
    await program.methods.initMaster().accounts({
      master: masterPDA,
      payer: buyer1Keypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([buyer1Keypair])
    .rpc();

    const master = await program.account.master.fetch(masterPDA);
    console.log(master)
    assert.ok(master.lastId === 0);
  });

  it("Creates a Lottery", async () => {
    const ticketPrice = new anchor.BN(1_000_000); //1 SOL
    
    // Derive the Lottery PDA based on the master.last_id
    const lotteryId = 1;
    [lotteryPDA, lotteryBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(LOTTERY_SEED), new anchor.BN(lotteryId).toArrayLike(Buffer, "le", 4)],
      program.programId
    );

    await program.methods.createLottery(ticketPrice)
    .accounts({
      lottery: lotteryPDA,
      master: masterPDA,
      authority: buyer1Keypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([buyer1Keypair])
    .rpc();

    const lottery = await program.account.lottery.fetch(lotteryPDA);
    console.log(lottery);

    assert.ok(lottery.id === 1);
    assert.ok(lottery.ticketPrice.eq(ticketPrice));
  })

  it("Buys a Ticket", async () => {
    const lotteryId = 1;

    const ticketId = 1;
    const [ticketPDA, ticketBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(TICKET_SEED),
        lotteryPDA.toBuffer(),
        new anchor.BN(ticketId).toArrayLike(Buffer, "le", 4)
      ],
      program.programId
    );
    
    await program.methods.buyTicket(lotteryId)
    .accounts({
      lottery: lotteryPDA,
      ticket: ticketPDA,
      buyer: buyer1Keypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([buyer1Keypair])
    .rpc();

    const ticket = await program.account.ticket.fetch(ticketPDA);
    console.log(ticket);

    assert.ok(ticket.lotteryId === lotteryId);
    assert.ok(ticket.authority.equals(buyer1Keypair.publicKey))
  })
});
