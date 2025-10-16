const { AnchorProvider, Program, web3, BN } = require("@coral-xyz/anchor");
const { Connection, clusterApiUrl, Keypair, PublicKey } = require("@solana/web3.js");
const idl = require("../anchor/IDL/universal_pot.json");
require("dotenv").config({ path: ".env.local" });

function randomCapacityLamports() {
  const min = Number(process.env.MYSTERY_MIN_CAP_SOL ?? 1);
  const max = Number(process.env.MYSTERY_MAX_CAP_SOL ?? 3);
  const step = Number(process.env.MYSTERY_STEP_SOL ?? 0.1);
  const steps = Math.max(1, Math.floor((max - min) / step + 0.0000001));
  const k = Math.floor(Math.random() * (steps + 1));
  const capSol = Number((min + k * step).toFixed(6));
  return new BN(Math.floor(capSol * 1e9)); // lamports
}

async function main() {
  const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || idl.address || (idl.metadata && idl.metadata.address));
  const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet");

  const connection = new Connection(RPC_URL, "confirmed");

  // Use CLI keypair as authority
  const secret = JSON.parse(require("fs").readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const wallet = {
    publicKey: payer.publicKey,
    signTransaction: async (tx) => { tx.partialSign(payer); return tx; },
    signAllTransactions: async (txs) => txs.map((tx) => { tx.partialSign(payer); return tx; }),
  };

  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
  const program = new Program({ ...idl, metadata: { ...(idl.metadata||{}), address: PROGRAM_ID.toBase58() } }, PROGRAM_ID, provider);

  const [potPda] = PublicKey.findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID);
  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault")], PROGRAM_ID);

  // Read current pot state
  const pot = await program.account.pot.fetchNullable(potPda);
  if (!pot) {
    console.error("Pot not initialized yet. Run scripts/initPot.js first.");
    process.exit(1);
  }

  // Ensure settled and empty vault
  if (pot.status !== 2) {
    console.error("Pot is not Settled. Finalize first before resetting.");
    process.exit(1);
  }
  const info = await connection.getAccountInfo(vaultPda);
  const vaultLamports = info?.lamports || 0;
  if (vaultLamports !== 0) {
    console.error("Vault not empty. Cannot reset until vault lamports are 0.");
    process.exit(1);
  }

  // New randomized capacity
  const capacityLamports = randomCapacityLamports();
  const deadlineTs = new BN(Math.floor(Date.now() / 1000) + 24 * 60 * 60); // +24h
  const feeBps = 500;          // 5%
  const cooldownSecs = 5;      // 5s

  console.log("Resetting pot (capacity hidden)...");
  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("Pot PDA:", potPda.toBase58());
  console.log("Vault PDA:", vaultPda.toBase58());

  try {
    const sig = await program.methods
      .resetPot(capacityLamports, deadlineTs, feeBps, cooldownSecs)
      .accounts({
        authority: payer.publicKey,
        pot: potPda,
        vault: vaultPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Pot reset tx:", sig);
  } catch (e) {
    console.error("❌ Error resetting pot:", e);
    process.exit(1);
  }
}

main().catch((e) => { console.error("Script failed:", e); process.exit(1); });


