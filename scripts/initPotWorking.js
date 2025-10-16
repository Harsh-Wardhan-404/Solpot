const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
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

  // Check if pot already exists
  try {
    const accountInfo = await connection.getAccountInfo(potPda);
    if (accountInfo) {
      console.log("✅ Pot already exists!");
      console.log("Pot address:", potPda.toBase58());
      console.log("Account data length:", accountInfo.data.length);
      return;
    }
  } catch (error) {
    console.log("Pot doesn't exist yet");
  }

  console.log("❌ Pot doesn't exist. You need to call the init_pot instruction.");
  console.log("This requires the Anchor program to be properly set up.");
  console.log("For now, let's proceed with the frontend setup.");
}

main().catch((e) => { 
  console.error("Script failed:", e); 
  process.exit(1); 
});
