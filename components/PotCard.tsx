"use client";

import { usePot } from "./hooks/usePot";
import { Timer, TrendingUp, Trophy, User, Shield, Zap, Clock } from "lucide-react";

export default function PotCard() {
  const { pot, vaultBalance } = usePot();

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
  const progress = Math.min(deposited / capacity, 1.0);
  const remaining = capacity - deposited;

  const now = Math.floor(Date.now() / 1000);
  const deadline = Number(pot.deadlineTs);
  const timeLeft = Math.max(0, deadline - now);
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

  // Calculate projected payouts
  const totalVault = vaultBalance || deposited;
  const winnerPayout = (totalVault * 0.90).toFixed(4);
  const platformFee = (totalVault * 0.05).toFixed(4);
  const rakeback = (totalVault * 0.05).toFixed(4);

  return (
    <div className="glass-panel p-6 ">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-lime-400 flex items-center gap-2">
          <Trophy className="text-lime-400" size={28} />
          Universal Pot
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
          {currentStatus}
        </span>
      </div>

      <div className="space-y-6">
        {/* Mystery Pot block (capacity hidden) */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-purple-300 mb-1 font-semibold">Mystery Pot</p>
            <p className="text-gray-300 text-sm">
              Capacity is hidden for this round. Keep an eye on deposits and time left.
            </p>
          </div>

          {/* Show total deposited only */}
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-1">Total Deposited</p>
            <p className="text-2xl font-mono text-white">
              {(Number(pot.totalDeposited) / 1e9).toFixed(3)} SOL
            </p>
          </div>
        </div>

        {/* Time Left */}
        <div className="text-center bg-lime-500/5 rounded-xl p-4 border border-lime-500/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Timer className="text-lime-400" size={20} />
            <p className="text-gray-300 text-sm font-semibold">Time Remaining</p>
          </div>
          <p className="text-3xl font-mono text-white font-bold">
            {hours.toString().padStart(2, '0')}:
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </p>
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
              <h3 className="text-sm font-bold text-lime-400">Projected Payouts</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-lime-500/5 rounded-lg p-2 border border-lime-500/20">
                <div className="text-lime-400 font-bold">{winnerPayout} SOL</div>
                <div className="text-gray-400">Winner (90%)</div>
              </div>
              <div className="bg-lime-500/5 rounded-lg p-2 border border-lime-500/20">
                <div className="text-lime-400 font-bold">{platformFee} SOL</div>
                <div className="text-gray-400">Platform (5%)</div>
              </div>
              <div className="bg-lime-500/5 rounded-lg p-2 border border-lime-500/20">
                <div className="text-lime-400 font-bold">{rakeback} SOL</div>
                <div className="text-gray-400">Rakeback (5%)</div>
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
    </div>
  );
}


// Replace the original capacity/progress UI with this:
