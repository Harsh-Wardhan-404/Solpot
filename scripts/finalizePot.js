const { AnchorProvider, Program, web3, BN } = require("@coral-xyz/anchor");
const { Connection, clusterApiUrl, Keypair, PublicKey } = require("@solana/web3.js");
const idl = require("../anchor/IDL/universal_pot.json");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");

(async () => {
  const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || idl.address || (idl.metadata && idl.metadata.address));
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet"), "confirmed");
  const secret = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const wallet = {
    publicKey: payer.publicKey,
    signTransaction: async (tx) => { tx.partialSign(payer); return tx; },
    signAllTransactions: async (txs) => txs.map(tx => { tx.partialSign(payer); return tx; }),
  };
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
  const patchedIdl = { ...idl, metadata: { ...(idl.metadata||{}), address: PROGRAM_ID.toBase58() } };
  const program = new Program(patchedIdl, provider);

  const [potPda] = PublicKey.findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID);
  const pot = await program.account.pot.fetch(potPda);
  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault")], PROGRAM_ID);

  const winner = pot.lastDepositor;
  const platformTreasury = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_TREASURY);
  const bal = async (pk) => (await connection.getBalance(pk));

  // Check if pot is already settled
  if (pot.status === 2) {
    console.log("ℹ️ Pot already settled (Status = 2). Skipping finalization.");
  } else {
    const beforeWinner = await bal(winner);
    const beforePlatform = await bal(platformTreasury);
    const beforeVault = await bal(vaultPda);

    console.log("Finalizing…");
    const sig = await program.methods.finalize().accounts({
      pot: potPda,
      vault: vaultPda,
      winner,
      platformTreasury,
      systemProgram: web3.SystemProgram.programId,
    }).rpc();
    console.log("Tx:", sig);
    await connection.confirmTransaction(sig, "confirmed");

    const afterWinner = await bal(winner);
    const afterPlatform = await bal(platformTreasury);
    const afterVault = await bal(vaultPda);

    const toSol = x => (x/1e9).toFixed(4);
    console.log("Winner +Δ SOL:", toSol(afterWinner - beforeWinner));
    console.log("Platform +Δ SOL:", toSol(afterPlatform - beforePlatform));
    console.log("Vault -Δ SOL:", toSol(beforeVault - afterVault));
  }

  // Auto-init next round (random capacity) best-effort
  try {
    const capacityLamports = (() => {
      const min = Number(process.env.MYSTERY_MIN_CAP_SOL ?? 1);
      const max = Number(process.env.MYSTERY_MAX_CAP_SOL ?? 3);
      const step = Number(process.env.MYSTERY_STEP_SOL ?? 0.1);
      const steps = Math.max(1, Math.floor((max - min) / step + 0.0000001));
      const k = Math.floor(Math.random() * (steps + 1));
      const capSol = Number((min + k * step).toFixed(6));
      return new BN(Math.floor(capSol * 1e9));
    })();
    const deadlineTs = new BN(Math.floor(Date.now()/1000) + 24*60*60);
    const feeBps = 500;
    const cooldownSecs = 5;

    // Check if pot exists and is settled, then reset for next round
    let potAfter = null;
    try { potAfter = await program.account.pot.fetch(potPda); } catch {}
    if (potAfter && potAfter.status === 2) {
      try {
        await program.methods
          .resetPot(capacityLamports, deadlineTs, feeBps, cooldownSecs)
          .accounts({
            authority: payer.publicKey,
            pot: potPda,
            vault: vaultPda,
          })
          .rpc();
        console.log("✅ Next round initialized:", potPda.toBase58());
      } catch (e) {
        console.log("ℹ️ Auto-reset skipped:", e.message || String(e));
      }
    } else if (potAfter && potAfter.status === 0) {
      console.log("ℹ️ Pot already open; skipping auto-init.");
    } else {
      console.log("ℹ️ Pot not in expected state; skipping auto-init.");
    }
  } catch (e) {
    console.log("ℹ️ Auto-init failed (non-fatal):", e.message || String(e));
  }
})();