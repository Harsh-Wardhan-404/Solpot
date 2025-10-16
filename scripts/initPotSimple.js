const { Connection, Keypair, Transaction, SystemProgram, PublicKey } = require("@solana/web3.js");
const { AnchorProvider, Program, web3, BN } = require("@coral-xyz/anchor");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("NEXT_PUBLIC_PROGRAM_ID", process.env.NEXT_PUBLIC_PROGRAM_ID);
  
  const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "processed"
  );

  // Use your CLI keypair as payer/authority
  const secret = JSON.parse(require("fs").readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  console.log("Payer address:", payer.publicKey.toBase58());
  console.log("Program ID:", PROGRAM_ID.toBase58());

  // Find the pot PDA
  const [potPda, potBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("pot")], 
    PROGRAM_ID
  );

  console.log("Pot PDA:", potPda.toBase58());
  console.log("Pot bump:", potBump);

  // Create the init_pot instruction manually
  const initPotIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: potPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0), // We'll need to encode the instruction data properly
  };

  // For now, let's just check if we can create the pot account
  try {
    const accountInfo = await connection.getAccountInfo(potPda);
    if (accountInfo) {
      console.log("✅ Pot already exists!");
      console.log("Pot address:", potPda.toBase58());
      return;
    }
  } catch (error) {
    console.log("Pot doesn't exist yet, will create it...");
  }

  // Create a simple transaction to create the pot account
  const transaction = new Transaction();
  
  // Create account instruction
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: potPda,
    lamports: 0, // No SOL needed for the account
    space: 8 + 32 + 8 + 8 + 8 + 32 + 1 + 2 + 32 + 2 + 1, // Pot struct size
    programId: PROGRAM_ID,
  });

  transaction.add(createAccountIx);

  try {
    const signature = await connection.sendTransaction(transaction, [payer]);
    console.log("✅ Transaction sent:", signature);
    await connection.confirmTransaction(signature);
    console.log("✅ Pot account created successfully!");
    console.log("Pot address:", potPda.toBase58());
  } catch (error) {
    console.error("❌ Error creating pot account:", error);
  }
}

main().catch((e) => { 
  console.error("Script failed:", e); 
  process.exit(1); 
});
