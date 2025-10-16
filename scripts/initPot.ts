import { AnchorProvider, Program, web3, BN } from "@coral-xyz/anchor";
import { Connection, clusterApiUrl, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import idl from "../anchor/IDL/universal_pot.json" assert { type: "json" };

async function main() {
  const PROGRAM_ID = new web3.PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "processed"
  );

  // Use your CLI keypair as payer/authority
  const secret = JSON.parse(require("fs").readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const provider = new AnchorProvider(
    connection,
    {
      publicKey: payer.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => { 
        if ('partialSign' in tx) {
          tx.partialSign(payer); 
        }
        return tx; 
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => 
        txs.map((tx: T) => { 
          if ('partialSign' in tx) {
            tx.partialSign(payer); 
          }
          return tx; 
        }),
    },
    { preflightCommitment: "processed" }
  );

  const program = new Program(idl as any, provider);
  const [potPda] = web3.PublicKey.findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID);

  const capacityLamports = new BN(100 * 1e9);                 // 100 SOL
  const deadlineTs = new BN(Math.floor(Date.now() / 1000) + 24 * 60 * 60); // +24h
  const feeBps = 500;                                         // 5%
  const cooldownSecs = 5;                                     // 5s

  console.log("Initializing pot on devnet…");
  await program.methods
    .initPot(capacityLamports, deadlineTs, feeBps, cooldownSecs)
    .accounts({
      authority: payer.publicKey,
      pot: potPda,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Pot initialized:", potPda.toBase58());
}

main().catch((e) => { console.error(e); process.exit(1); });