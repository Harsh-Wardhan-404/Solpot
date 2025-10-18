// scripts/finalizeRaw.js
const { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram } = require("@solana/web3.js");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");

// finalize discriminator (from your IDL build)
const FINALIZE_DISCRIMINATOR = Buffer.from([171, 61, 218, 56, 127, 115, 12, 217]); // same as INSTRUCTION_DISCRIMINATORS.finalize

function u8ToBufLE(num, bytes) {
  const b = Buffer.alloc(bytes);
  b.writeUIntLE(num, 0, bytes);
  return b;
}

function u64LE(n) {
    const b = Buffer.alloc(8);
    b.writeBigUInt64LE(BigInt(n));
    return b;
  }
  function i64LE(n) {
    const b = Buffer.alloc(8);
    b.writeBigInt64LE(BigInt(n)); // deadline is i64 in your program
    return b;
  }

(async () => {
  const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || process.env.PROGRAM_ID || (process.env.NEXT_PUBLIC_PROGRAM_ID === '' ? undefined : undefined) || require('../anchor/IDL/universal_pot.json').address);
  const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet");
  const PLATFORM_TREASURY = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_TREASURY);

  const connection = new Connection(RPC_URL, "confirmed");

  // signer (authority not required; finalize is permissionless)
  const secret = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  // pot PDA
  const [potPda] = PublicKey.findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID);
  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault")], PROGRAM_ID);

  // fetch pot to know winner (lastDepositor)
  const potAcc = await connection.getAccountInfo(potPda, "confirmed");
  if (!potAcc) {
    console.error("Pot account not found.");
    process.exit(1);
  }

  // Minimal decode to read lastDepositor (unsafe fast path: offset based on your Pot layout).
  // Since that’s brittle, accept passing winner via .env to avoid decoding:
  // Set WINNER_PUBKEY in .env.local if decode isn’t trivial.
  let winnerPubkey;
  if (process.env.WINNER_PUBKEY) {
    winnerPubkey = new PublicKey(process.env.WINNER_PUBKEY);
  } else {
    console.log("Set WINNER_PUBKEY in .env.local to avoid IDL decoding.");
    process.exit(1);
  }

  const ixData = Buffer.concat([FINALIZE_DISCRIMINATOR]); // finalize has no args

  const keys = [
    { pubkey: potPda, isSigner: false, isWritable: true },
    { pubkey: vaultPda, isSigner: false, isWritable: true },
    { pubkey: winnerPubkey, isSigner: false, isWritable: true },
    { pubkey: PLATFORM_TREASURY, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = { programId: PROGRAM_ID, keys, data: ixData };

  const tx = new Transaction().add(ix);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  tx.sign(payer);

  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(sig, "confirmed");
  console.log("Finalize tx:", sig);

  // best-effort auto-init next round via initPot raw ix
  try {
    const INIT_DISCRIMINATOR = Buffer.from([96, 74, 54, 30, 99, 102, 115, 37]);
    const min = Number(process.env.MYSTERY_MIN_CAP_SOL ?? 1);
    const max = Number(process.env.MYSTERY_MAX_CAP_SOL ?? 3);
    const step = Number(process.env.MYSTERY_STEP_SOL ?? 0.1);
    const steps = Math.max(1, Math.floor((max - min) / step + 1e-7));
    const k = Math.floor(Math.random() * (steps + 1));
    const capSol = Number((min + k * step).toFixed(6));
    const capacityLamports = Math.floor(capSol * 1e9);

    const deadlineTs = Math.floor(Date.now()/1000) + 24*60*60;
    const feeBps = 500;
    const cooldownSecs = 5;

    const data = Buffer.concat([
        INIT_DISCRIMINATOR,
        u64LE(capacityLamports),   // u64
        i64LE(deadlineTs),         // i64
        Buffer.from([feeBps & 0xff, (feeBps >> 8) & 0xff]),       // u16
        Buffer.from([cooldownSecs & 0xff, (cooldownSecs >> 8) & 0xff]), // u16
      ]);

    const initKeys = [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // authority
      { pubkey: potPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const initIx = { programId: PROGRAM_ID, keys: initKeys, data };
    const tx2 = new Transaction().add(initIx);
    tx2.feePayer = payer.publicKey;
    tx2.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
    tx2.sign(payer);

    const sig2 = await connection.sendRawTransaction(tx2.serialize(), { skipPreflight: false });
    await connection.confirmTransaction(sig2, "confirmed");
    console.log("Next round init tx:", sig2);
  } catch (e) {
    console.log("Auto-init skipped (non-fatal):", e.message || String(e));
  }
})();