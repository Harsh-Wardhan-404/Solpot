"use client";

import { usePot } from "./hooks/usePot";

export default function PotCard() {
  const { pot, vaultBalance } = usePot();

  if (!pot) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading pot data...</p>
          <p className="text-sm text-gray-400 mt-2">
            If this persists, the pot may not be initialized yet.
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

  const statusText = {
    0: "Open",
    1: "Finalizing",
    2: "Settled"
  }[pot.status] || "Unknown";

  const statusColor = {
    0: "text-green-400",
    1: "text-yellow-400", 
    2: "text-red-400"
  }[pot.status] || "text-gray-400";

  const lastDepositorAddress = typeof pot.lastDepositor === "string"
    ? pot.lastDepositor
    : pot.lastDepositor?.toBase58?.() ?? "";
  const winnerAddress = typeof pot.winner === "string"
    ? pot.winner
    : pot.winner?.toBase58?.() ?? "";

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Universal Pot</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} bg-white/10`}>
          {statusText}
        </span>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>{deposited.toFixed(2)} SOL deposited</span>
            <span>{capacity.toFixed(2)} SOL capacity</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {remaining > 0 ? `${remaining.toFixed(2)} SOL remaining` : "Pot is full!"}
          </div>
        </div>

        {/* Time Left */}
        <div className="text-center">
          <p className="text-gray-300 text-sm mb-1">Time Remaining</p>
          <p className="text-2xl font-mono text-white">
            {hours.toString().padStart(2, '0')}:
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </p>
        </div>

        {/* Last Depositor */}
        {lastDepositorAddress && lastDepositorAddress !== "11111111111111111111111111111111" && (
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-1">Last Depositor</p>
            <p className="text-white font-mono text-sm">
              {lastDepositorAddress.slice(0, 8)}...{lastDepositorAddress.slice(-8)}
            </p>
          </div>
        )}

        {/* Winner */}
        {pot.status === 2 && winnerAddress && winnerAddress !== "11111111111111111111111111111111" && (
          <div className="text-center bg-green-500/20 rounded-lg p-3">
            <p className="text-green-400 text-sm mb-1">Winner</p>
            <p className="text-white font-mono text-sm">
              {winnerAddress.slice(0, 8)}...{winnerAddress.slice(-8)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
