"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import { web3 } from "@coral-xyz/anchor";
import { useAnchorProgram } from "../anchorClient";

export function usePot() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const program = useAnchorProgram(connection, wallet as any);

  const [pot, setPot] = useState<any>(null);
  const [vaultBalance, setVaultBalance] = useState<number>(0);

  const [potPda] = useMemo(() => {
    if (!program?.programId) return [null];
    try {
      return web3.PublicKey.findProgramAddressSync([Buffer.from("pot")], program.programId);
    } catch (error) {
      console.error("Failed to find pot PDA:", error);
      return [null];
    }
  }, [program]);
  
  const [vaultPda] = useMemo(() => {
    if (!program?.programId) return [null];
    try {
      return web3.PublicKey.findProgramAddressSync([Buffer.from("vault")], program.programId);
    } catch (error) {
      console.error("Failed to find vault PDA:", error);
      return [null];
    }
  }, [program]);

  useEffect(() => {
  if (!program || !potPda || !vaultPda) return;
    let sub: number | null = null;
    (async () => {
      try {
        const data = await (program.account as any).pot.fetchNullable(potPda);
        setPot(data);
        const bal = await program.provider.connection.getBalance(vaultPda);
        setVaultBalance(bal);
      } catch (error) {
        console.error("Failed to fetch pot data:", error);
      }
    })();
    sub = program.provider.connection.onAccountChange(vaultPda, async () => {
      try {
        const bal = await program.provider.connection.getBalance(vaultPda);
        setVaultBalance(bal);
      } catch (error) {
        console.error("Failed to update vault balance:", error);
      }
    });
    return () => {
      if (sub) program.provider.connection.removeAccountChangeListener(sub);
    };
  }, [program, potPda, vaultPda]);

  return { program, potPda, vaultPda, pot, vaultBalance };
}


