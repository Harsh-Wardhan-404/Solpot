const { AnchorProvider, Program, web3 } = require("@coral-xyz/anchor");
const { Connection, clusterApiUrl, Keypair, PublicKey } = require("@solana/web3.js");
const idl = require("../anchor/IDL/universal_pot.json");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");

(async () => {
  const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet"), "confirmed");
  const secret = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const wallet = {
    publicKey: payer.publicKey,
    signTransaction: async (tx) => { tx.partialSign(payer); return tx; },
    signAllTransactions: async (txs) => txs.map(tx => { tx.partialSign(payer); return tx; }),
  };
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
  const program = new Program({ ...idl, metadata: { ...(idl.metadata||{}), address: PROGRAM_ID.toBase58() } }, provider);

  const [potPda] = PublicKey.findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID);
  const pot = await program.account.pot.fetch(potPda);

  const winner = pot.lastDepositor;
  const platformTreasury = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_TREASURY);

  const bal = async (pk) => (await connection.getBalance(pk));

  const beforeWinner = await bal(winner);
  const beforePlatform = await bal(platformTreasury);
  const beforeVault = await bal(potPda);

  console.log("Finalizing…");
  const sig = await program.methods.finalize().accounts({
    pot: potPda,
    winner,
    platformTreasury
  }).rpc();
  console.log("Tx:", sig);
  await connection.confirmTransaction(sig, "confirmed");

  const afterWinner = await bal(winner);
  const afterPlatform = await bal(platformTreasury);
  const afterVault = await bal(potPda);

  const toSol = x => (x/1e9).toFixed(4);
  console.log("Winner +Δ SOL:", toSol(afterWinner - beforeWinner));
  console.log("Platform +Δ SOL:", toSol(afterPlatform - beforePlatform));
  console.log("Vault -Δ SOL:", toSol(beforeVault - afterVault));
})();