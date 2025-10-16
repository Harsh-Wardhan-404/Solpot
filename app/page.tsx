"use client";

import dynamic from 'next/dynamic';
import PixelBlast from '@/components/PixelBlast';
import Dock from '@/components/Dock';
import { Home, Coins, Trophy, Settings, Wallet, Timer } from 'lucide-react';
import { useState } from 'react';
import PotCard from '@/components/PotCard';
import DepositForm from '@/components/DepositForm';

// Dynamically import wallet components to avoid hydration issues
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'pots' | 'leaderboard' | 'wallet' | 'settings'>('home');

  const dockItems = [
    {
      icon: <Home size={24} className="text-lime-400" />,
      label: "Home",
      onClick: () => setCurrentPage('home')
    },
    {
      icon: <Coins size={24} className="text-lime-400" />,
      label: "Pots",
      onClick: () => setCurrentPage('pots')
    },
    {
      icon: <Trophy size={24} className="text-lime-400" />,
      label: "Leaderboard",
      onClick: () => setCurrentPage('leaderboard')
    },
    {
      icon: <Wallet size={24} className="text-lime-400" />,
      label: "Wallet",
      onClick: () => setCurrentPage('wallet')
    },
    {
      icon: <Settings size={24} className="text-lime-400" />,
      label: "Settings",
      onClick: () => setCurrentPage('settings')
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* PixelBlast Background */}
      <div className="fixed inset-0 z-0">
        <PixelBlast
          variant="circle"
          pixelSize={3}
          color="#84cc16"
          liquid={true}
          liquidStrength={0.2}
          liquidRadius={1.5}
          enableRipples={true}
          rippleIntensityScale={2}
          rippleSpeed={0.5}
          rippleThickness={0.15}
          patternScale={2}
          patternDensity={0.7}
          speed={0.4}
          transparent={true}
          edgeFade={0.2}
          antialias={true}
        />
      </div>

      {/* Content */}
      <div className="relative z-10" style={{ pointerEvents: 'none' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-lime-500/20 border-2 border-lime-400 flex items-center justify-center shadow-lg shadow-lime-500/30">
              <Coins className="text-lime-400" size={28} />
            </div>
            <h1 className="text-4xl font-bold text-lime-400 tracking-tight drop-shadow-lg">
              SOLPOT
            </h1>
          </div>
          <WalletMultiButton className="!bg-lime-500 hover:!bg-lime-600 !text-black !font-bold !px-6 !py-2 !rounded-lg !transition-all !duration-300 !transform hover:!scale-105 !shadow-lg !shadow-lime-500/50" />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 pb-32" style={{ pointerEvents: 'auto' }}>
          {currentPage === 'home' && (
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 mt-20">
                <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-2xl">
                  Welcome to SOLPOT
                </h2>
                <p className="text-2xl text-lime-400 font-semibold mb-4">
                  The Last Depositor Wins! 🎯
                </p>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
                  A revolutionary on-chain game built on Solana where timing is everything.
                  Be the last to deposit before the deadline and claim the entire pot!
                </p>
                <div className="inline-block glass-panel px-6 py-3 solana-glow">
                  <p className="text-lime-400 font-semibold">
                    🔥 Running on Solana Devnet • 100% Permissionless • Fully On-Chain
                  </p>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="glass-panel p-6 text-center solana-glow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lime-500/20 border-2 border-lime-400 flex items-center justify-center">
                    <Coins className="text-lime-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-lime-400 mb-2">Fair & Transparent</h3>
                  <p className="text-gray-300 text-sm">
                    All transactions are on-chain and verifiable. Built with Anchor on Solana for maximum security.
                  </p>
                </div>

                <div className="glass-panel p-6 text-center solana-glow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lime-500/20 border-2 border-lime-400 flex items-center justify-center">
                    <Trophy className="text-lime-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-lime-400 mb-2">90% Winner Take</h3>
                  <p className="text-gray-300 text-sm">
                    Winner gets 90%, Platform 5%, Rakeback 5%. No hidden fees, completely transparent distribution.
                  </p>
                </div>

                <div className="glass-panel p-6 text-center solana-glow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lime-500/20 border-2 border-lime-400 flex items-center justify-center">
                    <Timer className="text-lime-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-lime-400 mb-2">Time-Based Rounds</h3>
                  <p className="text-gray-300 text-sm">
                    Each pot has a fixed capacity (2 SOL) and 24h deadline. Last depositor when either limit hits wins!
                  </p>
                </div>
              </div>

              {/* How It Works Section */}
              <div className="glass-panel p-8 mb-12 solana-glow">
                <h3 className="text-3xl font-bold text-lime-400 mb-6 text-center">How It Works</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="bg-lime-500/20 w-8 h-8 rounded-full flex items-center justify-center text-lime-400 font-bold">1</span>
                      Connect & Deposit
                    </h4>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span>Connect your Solana wallet (Phantom, Solflare, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span>Minimum deposit: <strong className="text-lime-400">0.01 SOL</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span>Cooldown period between deposits to prevent spam</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span><strong>Overshoot allowed:</strong> Deposits exceeding capacity are not refunded</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="bg-lime-500/20 w-8 h-8 rounded-full flex items-center justify-center text-lime-400 font-bold">2</span>
                      Win Conditions
                    </h4>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span>Pot reaches <strong className="text-lime-400">2 SOL capacity</strong> → Last depositor wins</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span><strong className="text-lime-400">24-hour deadline</strong> expires → Last depositor wins</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span>Status changes: Open → Finalizing → Settled</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lime-400 mt-1">▸</span>
                        <span>Anyone can call <code className="bg-black/40 px-2 py-0.5 rounded text-lime-400">finalize()</code> - it's permissionless!</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-lime-500/30">
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Trophy className="text-lime-400" size={20} />
                    Payout Distribution
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-lime-500/10 rounded-lg p-4 border border-lime-500/30">
                      <div className="text-3xl font-bold text-lime-400 mb-1">90%</div>
                      <div className="text-sm text-gray-300">Winner</div>
                    </div>
                    <div className="bg-lime-500/10 rounded-lg p-4 border border-lime-500/30">
                      <div className="text-3xl font-bold text-lime-400 mb-1">5%</div>
                      <div className="text-sm text-gray-300">Platform Fee</div>
                    </div>
                    <div className="bg-lime-500/10 rounded-lg p-4 border border-lime-500/30">
                      <div className="text-3xl font-bold text-lime-400 mb-1">5%</div>
                      <div className="text-sm text-gray-300">Rakeback</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  onClick={() => setCurrentPage('pots')}
                  className="bg-lime-500 hover:bg-lime-600 text-black font-bold text-xl px-12 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-lime-500/50 inline-flex items-center gap-3"
                >
                  <Coins size={24} />
                  View Active Pots
                </button>
                <p className="text-gray-400 text-sm mt-4">
                  Connect your wallet and join the action!
                </p>
              </div>
            </div>
          )}

          {currentPage === 'pots' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-lime-400 mb-2">Active Pots</h2>
                <p className="text-gray-300">Choose a pot and make your deposit</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <PotCard />
                <DepositForm />
              </div>
            </div>
          )}

          {currentPage === 'leaderboard' && (
            <div className="max-w-4xl mx-auto text-center">
              <div className="glass-panel p-12 solana-glow">
                <Trophy className="text-lime-400 mx-auto mb-4" size={64} />
                <h2 className="text-4xl font-bold text-lime-400 mb-4">Leaderboard</h2>
                <p className="text-gray-300 text-lg">Coming Soon...</p>
                <p className="text-gray-400 text-sm mt-2">Track top winners and biggest pots</p>
              </div>
            </div>
          )}

          {currentPage === 'wallet' && (
            <div className="max-w-4xl mx-auto text-center">
              <div className="glass-panel p-12 solana-glow">
                <Wallet className="text-lime-400 mx-auto mb-4" size={64} />
                <h2 className="text-4xl font-bold text-lime-400 mb-4">Wallet</h2>
                <p className="text-gray-300 text-lg">Connect your wallet to view your balance</p>
                <div className="mt-6">
                  <WalletMultiButton className="!bg-lime-500 hover:!bg-lime-600 !text-black !font-bold !px-8 !py-3 !rounded-lg !transition-all !duration-300 !transform hover:!scale-105 !shadow-lg !shadow-lime-500/50 !text-lg" />
                </div>
              </div>
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="max-w-4xl mx-auto text-center">
              <div className="glass-panel p-12 solana-glow">
                <Settings className="text-lime-400 mx-auto mb-4" size={64} />
                <h2 className="text-4xl font-bold text-lime-400 mb-4">Settings</h2>
                <p className="text-gray-300 text-lg">Coming Soon...</p>
                <p className="text-gray-400 text-sm mt-2">Configure your preferences and notifications</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dock Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-auto">
        <Dock items={dockItems} />
      </div>
    </div>
  );
}
