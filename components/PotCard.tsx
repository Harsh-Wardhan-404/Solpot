"use client";

import { usePot } from "./hooks/usePot";
import { Timer, TrendingUp, Trophy, User, Shield, Zap, Clock, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function PotCard() {
  const { pot, vaultBalance } = usePot();
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [previousDeposited, setPreviousDeposited] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Detect deposit changes and trigger pulse animation
  useEffect(() => {
    if (pot) {
      const currentDeposited = Number(pot.totalDeposited) / 1e9;
      if (previousDeposited > 0 && currentDeposited > previousDeposited) {
        setShouldPulse(true);
        setTimeout(() => setShouldPulse(false), 1000);
      }
      setPreviousDeposited(currentDeposited);
    }
  }, [pot?.totalDeposited]);

  if (!pot) {
    return (
      <div className="glass-panel p-6 ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading pot data...</p>
          <p className="text-sm text-gray-400 mt-2">
            If this persists, the pot may not be initialized yet.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Run <code className="bg-black/40 px-2 py-0.5 rounded text-lime-400">node scripts/initPot.js</code> to initialize
          </p>
        </div>
      </div>
    );
  }

  const capacity = Number(pot.capacityLamports) / 1e9; // Convert to SOL
  const deposited = Number(pot.totalDeposited) / 1e9; // Convert to SOL
  const progress = Math.min(deposited / Math.max(capacity, 1e-9), 1.0);
  const remaining = capacity - deposited;

  const deadline = Number(pot.deadlineTs);
  const timeLeft = Math.max(0, deadline - currentTime);
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const statusText: Record<number, string> = {
    0: "Open",
    1: "Finalizing",
    2: "Settled"
  };
  const currentStatus = statusText[pot.status] || "Unknown";

  const statusColorMap: Record<number, string> = {
    0: "text-lime-400 bg-lime-400/20 border-lime-400/40",
    1: "text-lime-300 bg-lime-300/20 border-lime-300/40", 
    2: "text-lime-500 bg-lime-500/20 border-lime-500/40"
  };
  const statusColor = statusColorMap[pot.status] || "text-gray-400 bg-gray-400/20 border-gray-400/40";

  const lastDepositorAddress = typeof pot.lastDepositor === "string"
    ? pot.lastDepositor
    : pot.lastDepositor?.toBase58?.() ?? "";
  const winnerAddress = typeof pot.winner === "string"
    ? pot.winner
    : pot.winner?.toBase58?.() ?? "";

  // Calculate projected payouts (convert lamports to SOL)
  const totalVaultSol = vaultBalance ? vaultBalance / 1e9 : deposited;
  const winnerPayout = (totalVaultSol * 0.90).toFixed(4);
  const platformFee = (totalVaultSol * 0.05).toFixed(4);
  const rakeback = (totalVaultSol * 0.05).toFixed(4);

  return (
    <motion.div 
      className="glass-panel p-6"
      animate={{
        scale: shouldPulse ? [1, 1.03, 1] : 1,
        boxShadow: shouldPulse 
          ? [
              '0 0 20px rgba(132, 204, 22, 0.3)',
              '0 0 40px rgba(132, 204, 22, 0.6)',
              '0 0 20px rgba(132, 204, 22, 0.3)'
            ]
          : '0 0 20px rgba(132, 204, 22, 0.2)'
      }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-lime-400 flex items-center gap-2">
          <motion.div
            animate={{ rotate: shouldPulse ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Trophy className="text-lime-400" size={28} />
          </motion.div>
          Universal Pot
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
          {currentStatus}
        </span>
      </div>

      <div className="space-y-6">
        {/* Animated Pot Visualization */}
        <div className="space-y-4">
          {/* Pot Container with liquid */}
          <div className="relative">
            {/* Floating coins animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    x: `${20 + i * 15}%`,
                    y: '100%',
                    opacity: 0 
                  }}
                  animate={{
                    y: ['-20%', '-40%', '-20%'],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeInOut"
                  }}
                >
                  <Coins className="text-lime-400" size={16 + i * 2} />
                </motion.div>
              ))}
            </div>

            {/* The Pot SVG */}
            <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Pot body */}
                <defs>
                  <linearGradient id="potGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#84cc16" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#84cc16" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#84cc16" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#84cc16" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                
                {/* Pot outline */}
                <path
                  d="M 50 80 Q 50 60, 60 50 L 140 50 Q 150 60, 150 80 L 160 160 Q 160 170, 150 170 L 50 170 Q 40 170, 40 160 Z"
                  fill="url(#potGradient)"
                  stroke="#84cc16"
                  strokeWidth="2"
                  className="drop-shadow-lg"
                />
                
                {/* Liquid inside pot - generic animation (does not reveal capacity) */}
                <motion.path
                  d="M 50 170 Q 40 170, 40 160 L 45 120 Q 45 110, 55 110 L 145 110 Q 155 110, 155 120 L 160 160 Q 160 170, 150 170 Z"
                  fill="url(#liquidGradient)"
                  initial={{ scaleY: 0.55, originY: 1 }}
                  animate={{ 
                    scaleY: shouldPulse ? [0.55, 0.65, 0.55] : 0.6,
                    originY: 1
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                
                {/* Liquid wave animation */}
                <motion.ellipse
                  cx="100"
                  cy={140}
                  rx="50"
                  ry="8"
                  fill="#84cc16"
                  fillOpacity="0.6"
                  animate={{ rx: [48, 52, 48], ry: [6, 10, 6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Pot handles */}
                <path
                  d="M 45 70 Q 35 70, 35 80 Q 35 90, 45 90"
                  fill="none"
                  stroke="#84cc16"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 155 70 Q 165 70, 165 80 Q 165 90, 155 90"
                  fill="none"
                  stroke="#84cc16"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                
                {/* Sparkles on pot */}
                {shouldPulse && (
                  <>
                    <motion.circle
                      cx="70"
                      cy="60"
                      r="3"
                      fill="#84cc16"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                      transition={{ duration: 0.8 }}
                    />
                    <motion.circle
                      cx="130"
                      cy="65"
                      r="3"
                      fill="#84cc16"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </>
                )}
              </svg>
              
              {/* Center amount display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div
                  className="text-center"
                  animate={{
                    scale: shouldPulse ? [1, 1.1, 1] : 1
                  }}
                >
                  <p className="text-xs text-gray-400 mb-1">Total In Pot</p>
                  <motion.p 
                    className="text-2xl font-bold font-mono text-white drop-shadow-lg"
                    key={pot.totalDeposited.toString()}
                    animate={{ 
                      scale: shouldPulse ? [1, 1.2, 1] : 1,
                      color: shouldPulse ? ['#ffffff', '#84cc16', '#ffffff'] : '#ffffff'
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {(Number(pot.totalDeposited) / 1e9).toFixed(3)}
                  </motion.p>
                  <p className="text-xs font-semibold text-lime-400">SOL</p>
                </motion.div>
              </div>
            </div>
            
            {/* Floating delta indicator */}
            {shouldPulse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0, 1, 0], y: -30 }}
                transition={{ duration: 1.5 }}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 text-lime-400 font-bold flex items-center gap-1"
              >
                <TrendingUp size={16} />
                <span>+{(Number(pot.totalDeposited) / 1e9 - previousDeposited).toFixed(3)} SOL</span>
              </motion.div>
            )}
          </div>

          {/* Progress Bar removed to avoid hinting capacity */}
        </div>

        {/* Time Left */}
        <div className={`text-center rounded-xl p-4 border ${
          timeLeft <= 0 
            ? "bg-red-500/10 border-red-500/50" 
            : timeLeft <= 300 
            ? "bg-yellow-500/10 border-yellow-500/50" 
            : "bg-lime-500/5 border-lime-500/30"
        }`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Timer className={
              timeLeft <= 0 
                ? "text-red-400" 
                : timeLeft <= 300 
                ? "text-yellow-400" 
                : "text-lime-400"
            } size={20} />
            <p className={`text-sm font-semibold ${
              timeLeft <= 0 
                ? "text-red-300" 
                : timeLeft <= 300 
                ? "text-yellow-300" 
                : "text-gray-300"
            }`}>
              {timeLeft <= 0 ? "Time Expired" : "Time Remaining"}
            </p>
          </div>
          <p className={`text-3xl font-mono font-bold ${
            timeLeft <= 0 
              ? "text-red-400" 
              : timeLeft <= 300 
              ? "text-yellow-400" 
              : "text-white"
          }`}>
            {timeLeft <= 0 
              ? "00:00:00" 
              : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            }
          </p>
          {timeLeft <= 300 && timeLeft > 0 && (
            <p className="text-xs text-yellow-400 mt-2 font-semibold">
              ⚠️ Less than 5 minutes left!
            </p>
          )}
        </div>

        {/* Playful Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Pot Status */}
          <motion.div 
            className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 rounded-xl p-3 border border-lime-500/30 text-center"
            whileHover={{ scale: 1.05, borderColor: 'rgba(132, 204, 22, 0.5)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Trophy className="text-lime-400 mx-auto mb-1" size={24} />
            </motion.div>
            <p className="text-xs text-gray-400 mb-1">Prize Pool</p>
            <p className="text-lg font-bold text-lime-400">{(totalVaultSol * 0.9).toFixed(2)}</p>
            <p className="text-xs text-gray-500">SOL</p>
          </motion.div>

          {/* Participants */}
          <motion.div 
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-3 border border-purple-500/30 text-center"
            whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.div
              animate={{ 
                y: [0, -5, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <User className="text-purple-400 mx-auto mb-1" size={24} />
            </motion.div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <p className="text-lg font-bold text-purple-400">{currentStatus}</p>
            <p className="text-xs text-gray-500">Active</p>
          </motion.div>

          {/* Cooldown (replaces Fill Level) */}
          <motion.div 
            className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-3 border border-cyan-500/30 text-center"
            whileHover={{ scale: 1.05, borderColor: 'rgba(6, 182, 212, 0.5)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Clock className="text-cyan-400 mx-auto mb-1" size={24} />
            </motion.div>
            <p className="text-xs text-gray-400 mb-1">Cooldown</p>
            <p className="text-lg font-bold text-cyan-400">{Number(pot.cooldownSecs)}s</p>
            <p className="text-xs text-gray-500">Between deposits</p>
          </motion.div>
        </div>

        {/* Last Depositor */}
        {lastDepositorAddress && lastDepositorAddress !== "11111111111111111111111111111111" && (
          <div className="text-center bg-lime-500/5 rounded-xl p-4 border border-lime-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="text-lime-400" size={18} />
              <p className="text-gray-300 text-sm font-semibold">Last Depositor</p>
            </div>
            <p className="text-white font-mono text-sm bg-black/30 px-3 py-1 rounded-lg inline-block">
              {lastDepositorAddress.slice(0, 8)}...{lastDepositorAddress.slice(-8)}
            </p>
          </div>
        )}

        {/* Winner */}
        {pot.status === 2 && winnerAddress && winnerAddress !== "11111111111111111111111111111111" && (
          <div className="text-center bg-lime-500/10 rounded-xl p-4 border-2 border-lime-500/50 ">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="text-lime-400" size={20} />
              <p className="text-lime-400 text-sm font-bold">🎉 Winner 🎉</p>
            </div>
            <p className="text-white font-mono text-sm bg-black/30 px-3 py-1 rounded-lg inline-block">
              {winnerAddress.slice(0, 8)}...{winnerAddress.slice(-8)}
            </p>
          </div>
        )}

        {/* Projected Payouts */}
        {pot.status === 0 && (
          <div className="bg-black/20 rounded-xl p-4 border border-lime-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="text-lime-400" size={18} />
              <h3 className="text-sm font-bold text-lime-400">Payout Distribution</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-lime-500/5 rounded-lg p-2 border border-lime-500/20">
                <div className="text-lime-400 font-bold text-lg">90%</div>
                <div className="text-gray-400">Winner</div>
              </div>
              <div className="bg-lime-500/5 rounded-lg p-2 border border-lime-500/20">
                <div className="text-lime-400 font-bold text-lg">5%</div>
                <div className="text-gray-400">Platform</div>
              </div>
              <div className="bg-lime-500/5 rounded-lg p-2 border border-lime-500/20">
                <div className="text-lime-400 font-bold text-lg">5%</div>
                <div className="text-gray-400">Rakeback</div>
              </div>
            </div>
          </div>
        )}

        {/* Game Rules Quick Info */}
        <div className="bg-black/20 rounded-xl p-4 border border-lime-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="text-lime-400" size={18} />
            <h3 className="text-sm font-bold text-lime-400">Game Info</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Min Deposit:</span>
              <span className="text-white font-semibold">0.01 SOL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Cooldown:</span>
              <span className="text-white font-semibold">{Number(pot.cooldownSecs)}s between deposits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Overshoot:</span>
              <span className="text-lime-400 font-semibold">Allowed</span>
            </div>
          </div>
        </div>

        {/* Status-based Actions */}
        {pot.status === 1 && (
          <div className="text-center bg-lime-500/10 rounded-xl p-4 border border-lime-500/30">
            <Clock className="text-lime-400 mx-auto mb-2" size={24} />
            <p className="text-lime-400 font-semibold text-sm">Pot is Finalizing!</p>
            <p className="text-gray-300 text-xs mt-1">
              Anyone can call finalize() to distribute payouts
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}


// Replace the original capacity/progress UI with this:
