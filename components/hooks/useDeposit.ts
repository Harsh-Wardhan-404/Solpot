"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { web3 } from "@coral-xyz/anchor";
import BN from "bn.js";
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
      const amount = new BN(lamports);
      const tx = await (program.methods as any)
        .deposit(amount)
        .accounts({
          user: publicKey,
          pot: potPda,
          vault: vaultPda!,
          depositorState: depositorPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      console.log("Deposit successful:", tx);
    } catch (error: any) {
      console.error("Deposit failed:", error);
      
      // Handle specific Solana transaction errors
      if (error?.message?.includes("This transaction has already been processed")) {
        // Transaction was successful but client received duplicate error
        console.log("Transaction was actually successful (duplicate error)");
        return; // Don't throw error, transaction succeeded
      }
      
      if (error?.message?.includes("Transaction simulation failed")) {
        // Check if it's a simulation error but transaction might still succeed
        if (error.message.includes("already been processed")) {
          console.log("Transaction was actually successful (simulation error)");
          return; // Don't throw error, transaction succeeded
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  }, [program, publicKey, potPda, vaultPda]);

  return { deposit };
}

