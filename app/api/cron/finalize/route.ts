import { NextRequest, NextResponse } from 'next/server';
import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import idl from '@/anchor/IDL/universal_pot.json';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
    
    // Load your keypair from environment
    const secret = JSON.parse(process.env.SOLANA_KEYPAIR!);
    const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

    const wallet = {
      publicKey: payer.publicKey,
      signTransaction: async (tx: any) => { tx.partialSign(payer); return tx; },
      signAllTransactions: async (txs: any[]) => txs.map(tx => { tx.partialSign(payer); return tx; }),
    };

    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
    // Ensure IDL has the correct address for this Program constructor variant
    const patchedIdl = { ...(idl as any), metadata: { ...((idl as any).metadata || {}), address: PROGRAM_ID.toBase58() } };
    const program = new Program(patchedIdl as any, provider as any);

    const [potPda] = PublicKey.findProgramAddressSync([Buffer.from('pot')], PROGRAM_ID);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID);
    
    const pot = await program.account.pot.fetch(potPda);
    
    // Check if pot needs finalization
    if (pot.status === 2) {
      console.log('Pot already settled, attempting reset...');
      
      // Reset pot for next round
      const capacityLamports = (() => {
        const min = Number(process.env.MYSTERY_MIN_CAP_SOL ?? 1);
        const max = Number(process.env.MYSTERY_MAX_CAP_SOL ?? 5);
        const step = Number(process.env.MYSTERY_STEP_SOL ?? 0.1);
        const steps = Math.max(1, Math.floor((max - min) / step + 0.0000001));
        const k = Math.floor(Math.random() * (steps + 1));
        const capSol = Number((min + k * step).toFixed(6));
        return new BN(Math.floor(capSol * 1e9));
      })();
      
      const deadlineTs = new BN(Math.floor(Date.now() / 1000) + 24 * 60 * 60);
      const feeBps = 500;
      const cooldownSecs = 5;

      const sig = await program.methods
        .resetPot(capacityLamports, deadlineTs, feeBps, cooldownSecs)
        .accounts({
          authority: payer.publicKey,
          pot: potPda,
          vault: vaultPda,
        })
        .rpc();

      return NextResponse.json({ 
        success: true, 
        action: 'reset',
        tx: sig,
        message: 'Pot reset for next round'
      });
    } 
    else if (pot.status === 1 || (pot.status === 0 && pot.deadlineTs.toNumber() <= Math.floor(Date.now() / 1000))) {
      console.log('Finalizing pot...');
      
      const winner = pot.lastDepositor;
      const platformTreasury = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_TREASURY!);

      const sig = await program.methods.finalize().accounts({
        pot: potPda,
        vault: vaultPda,
        winner,
        platformTreasury,
        systemProgram: web3.SystemProgram.programId,
      }).rpc();

      return NextResponse.json({ 
        success: true, 
        action: 'finalize',
        tx: sig,
        message: 'Pot finalized successfully'
      });
    } 
    else {
      return NextResponse.json({ 
        success: true, 
        action: 'none',
        message: 'Pot is still active, no action needed'
      });
    }

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}
