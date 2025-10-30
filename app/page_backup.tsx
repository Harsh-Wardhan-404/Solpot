"use client";

import dynamic from 'next/dynamic';
import AnimatedBackground from '@/components/AnimatedBackground';
import Dock from '@/components/Dock';
import RotatingText from '@/components/RotatingText';
import { Home, Coins, Trophy, Settings, Wallet, Timer } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import PotCard from '@/components/PotCard';
import DepositForm from '@/components/DepositForm';

// Dynamically import wallet components to avoid hydration issues
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'pots' | 'leaderboard' | 'wallet' | 'settings'>('home');
  
  // Refs for scroll animations
  const statsRef = useRef(null);
  const howItWorksRef = useRef(null);
  const whyPlayRef = useRef(null);
  const ctaRef = useRef(null);
  
  // InView hooks for scroll animations
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const isHowItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.2 });
  const isWhyPlayInView = useInView(whyPlayRef, { once: true, amount: 0.3 });
  const isCtaInView = useInView(ctaRef, { once: true, amount: 0.5 });

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
      {/* Animated Background */}
      <AnimatedBackground />

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
            <div className="max-w-7xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-20 mt-16 flex flex-col items-center justify-center min-h-[60vh]">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center justify-center"
                >
                  <h2 className="text-7xl font-bold text-white mb-6 tracking-tight">
                    SOLPOT
                  </h2>
                  <div className="text-3xl font-bold mb-8 w-full flex justify-center">
                    <div className="inline-flex justify-center items-center min-h-[2.5rem]">
                      <RotatingText
                        texts={[
                          'Last Depositor Takes All 💰',
                          'Win 90% of the Pot 🏆',
                          'Time Your Move Perfectly ⏰',
                          'Built on Solana 🚀'
                        ]}
                        rotationInterval={3000}
                        staggerDuration={0.02}
                        mainClassName="text-lime-400 flex justify-center items-center text-center"
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                      />
                    </div>
                  </div>
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed"
                >
                  The revolutionary on-chain game on Solana. Deposit SOL, time your move perfectly, 
                  and win <span className="text-lime-400 font-semibold">90% of the pot</span> if you're the last depositor!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="inline-flex items-center gap-3 bg-black/40 border border-lime-500/30 px-6 py-3 rounded-lg backdrop-blur-sm"
                >
                  <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                  <span className="text-lime-400 font-semibold">100% On-Chain • Fully Transparent • Solana Devnet</span>
                </motion.div>
              </div>

              {/* Stats Row */}
              <motion.div
                ref={statsRef}
                initial={{ opacity: 0, y: 50 }}
                animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="grid grid-cols-3 gap-6 mb-20 max-w-4xl mx-auto"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={isStatsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-black/40 border border-lime-500/20 rounded-xl p-6 text-center backdrop-blur-sm hover:border-lime-500/40 transition-all duration-300"
                >
                  <div className="text-4xl font-bold text-lime-400 mb-2">90%</div>
                  <div className="text-sm text-gray-400">Winner Takes</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={isStatsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-black/40 border border-lime-500/20 rounded-xl p-6 text-center backdrop-blur-sm hover:border-lime-500/40 transition-all duration-300"
                >
                  <div className="text-4xl font-bold text-lime-400 mb-2">2 SOL</div>
                  <div className="text-sm text-gray-400">Pot Capacity</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={isStatsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-black/40 border border-lime-500/20 rounded-xl p-6 text-center backdrop-blur-sm hover:border-lime-500/40 transition-all duration-300"
                >
                  <div className="text-4xl font-bold text-lime-400 mb-2">24h</div>
                  <div className="text-sm text-gray-400">Round Duration</div>
                </motion.div>
              </motion.div>

              {/* How It Works */}
              <motion.div
                ref={howItWorksRef}
                initial={{ opacity: 0, y: 50 }}
                animate={isHowItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-20"
              >
                <motion.h3 
                  initial={{ opacity: 0, y: 30 }}
                  animate={isHowItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl font-bold text-white text-center mb-12"
                >
                  How It Works
                </motion.h3>
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={isHowItWorksInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.9 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="relative"
                  >
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isHowItWorksInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 200 }}
                      className="absolute -top-4 -left-4 w-12 h-12 bg-lime-500/20 border-2 border-lime-400 rounded-full flex items-center justify-center text-lime-400 font-bold text-xl"
                    >
                      1
                    </motion.div>
                    <div className="bg-black/40 border border-lime-500/20 rounded-xl p-8 pt-12 backdrop-blur-sm h-full hover:border-lime-500/40 transition-all duration-300">
                      <Coins className="text-lime-400 mb-4" size={40} />
                      <h4 className="text-xl font-bold text-white mb-3">Connect & Deposit</h4>
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Connect your Solana wallet</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Minimum deposit: <strong className="text-white">0.01 SOL</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Cooldown period enforced</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>

                  {/* Step 2 */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={isHowItWorksInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="relative"
                  >
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isHowItWorksInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
                      className="absolute -top-4 -left-4 w-12 h-12 bg-lime-500/20 border-2 border-lime-400 rounded-full flex items-center justify-center text-lime-400 font-bold text-xl"
                    >
                      2
                    </motion.div>
                    <div className="bg-black/40 border border-lime-500/20 rounded-xl p-8 pt-12 backdrop-blur-sm h-full hover:border-lime-500/40 transition-all duration-300">
                      <Timer className="text-lime-400 mb-4" size={40} />
                      <h4 className="text-xl font-bold text-white mb-3">Time Your Move</h4>
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Pot reaches <strong className="text-white">capacity</strong> OR</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span><strong className="text-white">24-hour deadline</strong> expires</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Overshoot allowed - no refunds!</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>

                  {/* Step 3 */}
                  <motion.div 
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={isHowItWorksInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 50, scale: 0.9 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="relative"
                  >
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isHowItWorksInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ duration: 0.5, delay: 0.7, type: "spring", stiffness: 200 }}
                      className="absolute -top-4 -left-4 w-12 h-12 bg-lime-500/20 border-2 border-lime-400 rounded-full flex items-center justify-center text-lime-400 font-bold text-xl"
                    >
                      3
                    </motion.div>
                    <div className="bg-black/40 border border-lime-500/20 rounded-xl p-8 pt-12 backdrop-blur-sm h-full hover:border-lime-500/40 transition-all duration-300">
                      <Trophy className="text-lime-400 mb-4" size={40} />
                      <h4 className="text-xl font-bold text-white mb-3">Win The Pot</h4>
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Last depositor wins!</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Winner: <strong className="text-lime-400">90%</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-lime-400 mt-1">→</span>
                          <span>Platform: 5% • Rakeback: 5%</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Why SolPot */}
              <motion.div
                ref={whyPlayRef}
                initial={{ opacity: 0, y: 50 }}
                animate={isWhyPlayInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-16"
              >
                <motion.h3 
                  initial={{ opacity: 0, y: 30 }}
                  animate={isWhyPlayInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl font-bold text-white text-center mb-12"
                >
                  Why Play SolPot?
                </motion.h3>
                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  <motion.div 
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={isWhyPlayInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -30, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-black/40 border border-lime-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-lime-500/40 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-lime-500/20 border border-lime-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-lime-400 text-xl">✓</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">100% Transparent</h4>
                        <p className="text-gray-400 text-sm">All transactions verified on Solana blockchain. No hidden mechanics.</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 30, scale: 0.95 }}
                    animate={isWhyPlayInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 30, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-black/40 border border-lime-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-lime-500/40 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-lime-500/20 border border-lime-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-lime-400 text-xl">⚡</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">Lightning Fast</h4>
                        <p className="text-gray-400 text-sm">Powered by Solana - instant deposits, near-zero fees.</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={isWhyPlayInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -30, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-black/40 border border-lime-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-lime-500/40 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-lime-500/20 border border-lime-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-lime-400 text-xl">🔒</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">Permissionless</h4>
                        <p className="text-gray-400 text-sm">Anyone can finalize. No central authority needed.</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 30, scale: 0.95 }}
                    animate={isWhyPlayInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 30, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-black/40 border border-lime-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-lime-500/40 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-lime-500/20 border border-lime-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-lime-400 text-xl">💎</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">Fair Distribution</h4>
                        <p className="text-gray-400 text-sm">90% to winner, 5% platform, 5% rakeback - crystal clear.</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                ref={ctaRef}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={isCtaInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center bg-gradient-to-br from-lime-500/10 to-lime-600/5 border border-lime-500/30 rounded-2xl p-12 hover:border-lime-500/50 transition-all duration-300"
              >
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl font-bold text-white mb-4"
                >
                  Ready to Play?
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-gray-300 mb-8 text-lg"
                >
                  Connect your wallet and join the action. May the best timer win!
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={isCtaInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage('pots')}
                  className="bg-lime-500 hover:bg-lime-600 text-black font-bold text-xl px-12 py-4 rounded-xl transition-all duration-300 inline-flex items-center gap-3"
                >
                  <Coins size={28} />
                  Enter The Pot
                  <span className="text-2xl">→</span>
                </motion.button>
              </motion.div>
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