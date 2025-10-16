"use client";

import { useCallback } from "react";
import { web3 } from "@coral-xyz/anchor";
import { usePot } from "./usePot";
import { useWallet } from "@solana/wallet-adapter-react";

export function useFinalize() {
  const { program, potPda, vaultPda, pot } = usePot();
  const { publicKey } = useWallet();

  const finalize = useCallback(async (platformTreasury: string) => {
    if (!program) throw new Error("Program not ready");
    const winner = pot?.lastDepositor || publicKey;
    if (!winner) throw new Error("Winner unknown");
    await program.methods
      .finalize()
      .accounts({
        pot: potPda,
        vault: vaultPda,
        winner,
        platformTreasury: new web3.PublicKey(platformTreasury),
      })
      .rpc();
  }, [program, potPda, vaultPda, pot, publicKey]);

  return { finalize };
}


