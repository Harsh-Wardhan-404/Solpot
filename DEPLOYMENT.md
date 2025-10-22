# Universal Pot - Deployment Guide 🚀

This guide covers deploying the Universal Pot project to production, including the frontend, Solana program, and automated pot management.

## Prerequisites

- Node.js 18+ and pnpm
- Solana CLI installed
- Vercel account
- Domain name (optional)

## 1. Solana Program Deployment

### Deploy to Mainnet (Production)

```bash
# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Build and deploy
cd anchor
anchor build
anchor deploy

# Note the new program ID and update .env.local
```

### Update Environment Variables

```bash
# Update .env.local with mainnet program ID
NEXT_PUBLIC_PROGRAM_ID=YOUR_MAINNET_PROGRAM_ID
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PLATFORM_TREASURY=YOUR_MAINNET_TREASURY_ADDRESS
```

## 2. Frontend Deployment (Vercel)

### Install Vercel CLI

```bash
npm i -g vercel
```

### Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts to configure:
# - Project name: universal-pot
# - Framework: Next.js
# - Build command: pnpm build
# - Output directory: .next
```

### Environment Variables in Vercel

Add these in Vercel dashboard → Settings → Environment Variables:

```env
# Public variables (exposed to client)
NEXT_PUBLIC_PROGRAM_ID=YOUR_MAINNET_PROGRAM_ID
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PLATFORM_TREASURY=YOUR_MAINNET_TREASURY_ADDRESS

# Private variables (server-side only)
CRON_SECRET=your-super-secret-cron-key-here
SOLANA_KEYPAIR=[your-mainnet-keypair-as-json-array]
MYSTERY_MIN_CAP_SOL=1
MYSTERY_MAX_CAP_SOL=5
MYSTERY_STEP_SOL=0.1
```

## 3. Automated Pot Management

### Create Cron API Route

Create `app/api/cron/finalize/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import idl from '../../../anchor/IDL/universal_pot.json';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed');
    
    // Load keypair from environment
    const secret = JSON.parse(process.env.SOLANA_KEYPAIR!);
    const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

    const wallet = {
      publicKey: payer.publicKey,
      signTransaction: async (tx: any) => { tx.partialSign(payer); return tx; },
      signAllTransactions: async (txs: any[]) => txs.map(tx => { tx.partialSign(payer); return tx; }),
    };

    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
    const program = new Program(idl as any, PROGRAM_ID, provider);

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
```

### Configure Vercel Cron

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/finalize",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## 4. Custom Domain Setup

### Add Domain in Vercel

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain (e.g., `universalpot.com`)
3. Configure DNS records as instructed

### SSL Certificate

Vercel automatically provides SSL certificates for custom domains.

## 5. Monitoring and Analytics

### Add Error Tracking

```bash
# Install Sentry
pnpm add @sentry/nextjs
```

### Add Analytics

```bash
# Install Vercel Analytics
pnpm add @vercel/analytics
```

## 6. Security Considerations

### Environment Variables

- Never commit `.env.local` to version control
- Use strong, unique values for `CRON_SECRET`
- Rotate `SOLANA_KEYPAIR` regularly
- Use different keypairs for dev/staging/prod

### Rate Limiting

Add rate limiting to API routes:

```typescript
// app/api/cron/finalize/route.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

export async function GET(request: NextRequest) {
  const { success } = await ratelimit.limit("cron");
  if (!success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  // ... rest of function
}
```

## 7. Testing Deployment

### Test Cron Endpoint

```bash
# Test locally
curl -H "Authorization: Bearer your-cron-secret" \
     http://localhost:3000/api/cron/finalize

# Test production
curl -H "Authorization: Bearer your-cron-secret" \
     https://your-domain.com/api/cron/finalize
```

### Test Frontend

1. Visit your deployed URL
2. Connect wallet
3. Test deposit functionality
4. Verify pot finalization works

## 8. Maintenance

### Regular Tasks

- Monitor pot status and finalization
- Check error logs in Vercel dashboard
- Update dependencies regularly
- Monitor SOL balance for gas fees

### Backup Strategy

- Export keypair securely
- Backup environment variables
- Document all configuration

## 9. Troubleshooting

### Common Issues

1. **Cron not running**: Check Vercel cron configuration
2. **Transaction failures**: Verify SOL balance for gas
3. **Environment variables**: Ensure all are set correctly
4. **Program ID mismatch**: Verify program is deployed correctly

### Debug Commands

```bash
# Check program deployment
solana program show YOUR_PROGRAM_ID

# Check account balance
solana balance YOUR_KEYPAIR_ADDRESS

# View logs
vercel logs
```

## 10. Production Checklist

- [ ] Solana program deployed to mainnet
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Cron job configured
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Security measures in place
- [ ] Testing completed
- [ ] Documentation updated

## Support

For issues or questions:
- Check Vercel logs
- Review Solana transaction history
- Monitor program account state
- Test locally first

---

**Note**: This deployment guide assumes you're using Vercel for frontend hosting. You can adapt it for other platforms like Netlify, AWS, or self-hosting.
