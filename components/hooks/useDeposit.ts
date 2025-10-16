"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN, web3 } from "@coral-xyz/anchor";
import { useCallback } from "react";
import { usePot } from "./usePot";

export function useDeposit() {
  const { publicKey } = useWallet();
  const { program, potPda, vaultPda } = usePot();

  const deposit = useCallback(async (lamports: number) => {
    if (!program || !publicKey || !potPda) throw new Error("Wallet not connected or pot not ready");
    
    try {
      const [depositorPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("depositor"), potPda.toBuffer(), publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .deposit(new BN(lamports))
        .accounts({
          user: publicKey,
          pot: potPda,
          depositorState: depositorPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      console.error("Deposit failed:", error);
      throw error;
    }
  }, [program, publicKey, potPda, vaultPda]);

  return { deposit };
}


