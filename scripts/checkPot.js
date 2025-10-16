const { AnchorProvider, Program, web3, BN } = require("@coral-xyz/anchor");
const { Connection, clusterApiUrl, PublicKey } = require("@solana/web3.js");
const idl = require("../anchor/IDL/universal_pot.json");
require("dotenv").config({ path: ".env.local" });

(async () => {
  const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet"), "processed");
  const provider = new AnchorProvider(connection, { publicKey: null }, { preflightCommitment: "processed" });
  const program = new Program({ ...idl, metadata: { ...(idl.metadata||{}), address: PROGRAM_ID.toBase58() } }, provider);

  const [potPda] = PublicKey.findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID);
  const pot = await program.account.pot.fetchNullable(potPda);
  if (!pot) { console.log("Pot not initialized"); return; }

  const vaultLamports = (await connection.getAccountInfo(potPda))?.lamports || 0;
  const toSol = x => (Number(x)/1e9).toFixed(4);

  console.log("Pot PDA:", potPda.toBase58());
  console.log("Status:", pot.status, "(0 Open, 1 Finalizing, 2 Settled)");
  console.log("Capacity SOL:", toSol(pot.capacityLamports));
  console.log("Total deposited SOL:", toSol(pot.totalDeposited));
  console.log("Vault balance SOL:", toSol(vaultLamports));
  console.log("Last depositor:", pot.lastDepositor.toBase58());

  const platformFee = Math.floor(vaultLamports * pot.feeBps / 10000);
  const rakeback = Math.floor(vaultLamports / 20); // 5%
  const winnerPayout = vaultLamports - platformFee - rakeback;
  console.log("Projected winner payout SOL:", toSol(winnerPayout));
  console.log("Platform fee SOL:", toSol(platformFee));
  console.log("Rakeback SOL:", toSol(rakeback));
})();