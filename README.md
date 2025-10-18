# SolPot – Universal Pot (Devnet)

A Solana dApp where the last depositor wins when the pot reaches capacity or the deadline passes. Built with Next.js + Anchor.

## Prerequisites

- Node.js 18+ and pnpm
- Solana CLI
- Rust (for Anchor)
- Anchor CLI

```bash
# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Rust
curl https://sh.rustup.rs -sSf | sh -s -- -y
source $HOME/.cargo/env

# Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

## 1) Configure Solana (Devnet)

```bash
solana config set --url https://api.devnet.solana.com
solana-keygen new -o ~/.config/solana/id.json --no-bip39-passphrase   # if you don't have a key yet
solana airdrop 2 $(solana address) --url https://api.devnet.solana.com
solana balance
```

## 2) Install dependencies

```bash
pnpm install
```

## 3) Environment variables

Create `.env.local` in the project root:

```env
# Program ID to target (ask a teammate for the active Program ID)
NEXT_PUBLIC_PROGRAM_ID=PASTE_PROGRAM_ID

# Devnet RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Where platform fees are sent
NEXT_PUBLIC_PLATFORM_TREASURY=PASTE_PLATFORM_TREASURY_PUBKEY

# Optional: server-side finalizer keypair (JSON array, not committed)
# FINALIZER_SECRET=[12,34, ... ]   # only if you run the finalize API locally or in prod
```

Notes:
- Use the active Program ID your teammate gives you. Different rounds may use different Program IDs while we stabilize the flow.
- Never commit private keys or FINALIZER_SECRET to git.

## 4) Run the web app

```bash
pnpm dev
```

Open http://localhost:3000 and:
- Click “Connect Wallet” (Devnet)
- View the pot card (progress, capacity, deadline)
- Deposit SOL (0.01 minimum) on Devnet

## 5) Scripts (init / check / finalize)

We provide Node scripts to operate the pot on-chain.

- Initialize a pot (capacity/deadline/fees):
```bash
node scripts/initPot.js
```

- Check pot status (owner program, totals, projected payouts):
```bash
node scripts/checkPot.js
```

- Finalize pot (pays winner and platform, sets Settled):
```bash
node scripts/finalizePot.js
```

Important:
- These scripts use `.env.local`. Ensure `NEXT_PUBLIC_PROGRAM_ID` matches the program that owns the pot PDA you’re working with.
- If you see “AccountOwnedByWrongProgram”, you are mixing program IDs. Fix by setting `NEXT_PUBLIC_PROGRAM_ID` to the pot’s owner (use `solana account <POT_PDA>` to verify “Owner: …”).

## 6) Devnet deploys (only if you need to deploy)

From `anchor/`:

```bash
cd anchor
anchor build
anchor deploy --provider.cluster devnet
solana address -k target/deploy/universal_pot-keypair.json   # Program ID
```

Share the new Program ID with the team and update everyone’s `.env.local`.

## 7) Finalization automation (cron)

You can enable an API endpoint to auto-finalize rounds:

- Add `app/api/finalize/route.ts` which reads the pot and, if status is Finalizing or deadline has passed, calls `finalize()`.
- Set `FINALIZER_SECRET` as a signer keypair (JSON array) in your hosting secrets.
- Schedule a cron to call `/api/finalize` every minute.

Vercel example (Cron Jobs):
- Path: `/api/finalize`
- Schedule: `*/1 * * * *`
- Environment: set `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_SOLANA_RPC_URL`, `NEXT_PUBLIC_PLATFORM_TREASURY`, `FINALIZER_SECRET`.

Frontend also attempts a light auto-finalize when users load the app; cron ensures liveness even without traffic.

## 8) Common issues

- Hydration mismatch (Next.js): Wallet components are dynamically imported client-side. Refresh after connecting.
- `_bn` / PublicKey errors: Usually an invalid Program ID or undefined env. Recheck `.env.local`.
- `AccountOwnedByWrongProgram`: You’re calling a pot owned by a different program. Verify with:
  - `solana account <POT_PDA>` → Owner must equal `NEXT_PUBLIC_PROGRAM_ID`.
  - Derivations: pot PDA = `findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID)`.
- RPC fetch failed: Ensure `NEXT_PUBLIC_SOLANA_RPC_URL` has no typos/backticks/trailing characters.

## 9) Structure (relevant parts)

- `app/` Next.js app router
- `components/`
  - `AppWalletProvider.tsx` – wallet and connection context
  - `hooks/usePot.ts` – reads pot state/balance
  - `hooks/useDeposit.ts` – deposit method
  - `anchorClient.ts` – Anchor program setup
- `anchor/` Anchor program
  - `programs/universal_pot/` – on-chain program code
  - `IDL/universal_pot.json` – IDL
- `scripts/` on-chain helpers
  - `initPot.js`, `checkPot.js`, `finalizePot.js`

## 10) How Universal Pot works

- Pot has capacity (SOL), deadline (timestamp), fee_bps, cooldown (anti-spam)
- Anyone can deposit; last depositor wins when capacity reached or deadline passed
- Distribution (default): Winner 90%, Platform 5%, Rakeback 5% (MVP sends both to platform treasury)
- Finalization is permissionless; anyone can trigger (user, cron, or frontend)

## 11) Contributing

- Create feature branches off `main`
- Run `pnpm dev` for frontend
- On-chain changes: only when needed (coordinate Program ID with team)
- Before pushing:
  - Re-run scripts against Devnet
  - Ensure `.env.local` is not committed
  - Never commit private keys

## 12) Quick FAQ

- "I changed capacity to 2 SOL but UI still shows old state"
  - You must initialize a new pot (script) under the correct Program ID. The UI reads the current pot PDA for that program.
- "How do I know the pot is full?"
  - `node scripts/checkPot.js` → Status 1, `totalDeposited >= capacity`.
- "How do I confirm payouts?"
  - Run finalize, then re-check pot (Status 2), and compare winner/treasury balances before/after.

## 13) TODO - Production Automation

- [ ] **Vercel Cron API**: Create `/api/cron/finalize/route.ts` for automated pot finalization
- [ ] **Environment Setup**: Add `CRON_SECRET`, `SOLANA_KEYPAIR` to Vercel env vars
- [ ] **Vercel Cron Jobs**: Configure `vercel.json` with cron schedule (every 5 minutes)
- [ ] **Security**: Implement rate limiting and error monitoring for cron endpoint
- [ ] **Monitoring**: Add logging and alerting for failed finalizations
