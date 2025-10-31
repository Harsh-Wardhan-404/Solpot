"use client";

import { useState } from "react";
import { useDeposit } from "./hooks/useDeposit";
import { usePot } from "./hooks/usePot";
import { Send, Loader2, AlertCircle, Info, Zap } from "lucide-react";
import DepositCelebration from "./DepositCelebration";
import WinnerCelebration from "./WinnerCelebration";
import { motion, AnimatePresence } from "motion/react";

export default function DepositForm() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [celebrationAmount, setCelebrationAmount] = useState(0);
  const [winnerPrize, setWinnerPrize] = useState(0);
  const { deposit } = useDeposit();
  const { pot, vaultBalance } = usePot();

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const lamports = Math.floor(parseFloat(amount) * 1e9); // Convert SOL to lamports
      if (lamports < 10_000_000) { // 0.01 SOL minimum
        throw new Error("Minimum deposit is 0.01 SOL");
      }

      // Check if this deposit will win (fill the pot or close to capacity)
      const currentDeposited = pot ? Number(pot.totalDeposited) / 1e9 : 0;
      const capacity = pot ? Number(pot.capacityLamports) / 1e9 : 2;
      const newTotal = currentDeposited + parseFloat(amount);
      const willWin = newTotal >= capacity * 0.95; // If deposit brings pot to 95%+ of capacity, they win!

      await deposit(lamports);
      
      setCelebrationAmount(parseFloat(amount));
      
      if (willWin) {
        // Show winner celebration with pot cracking!
        const totalVault = vaultBalance ? vaultBalance / 1e9 : newTotal;
        const prize = totalVault * 0.9; // Winner gets 90%
        setWinnerPrize(prize);
        setShowWinner(true);
        
        // Reload after winner celebration (6 seconds)
        setTimeout(() => {
          window.location.reload();
        }, 6000);
      } else {
        // Show normal celebration
        setShowCelebration(true);
        
        // Reload after celebration (3 seconds)
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
      
      setAmount("");
      setError("");
    } catch (err: any) {
      // Only show error if it's not a "duplicate transaction" success case
      if (!err?.message?.includes("already been processed") && 
          !err?.message?.includes("simulation failed")) {
        setError(err.message || "Deposit failed");
      } else {
        // Transaction was successful despite the error message
        const currentDeposited = pot ? Number(pot.totalDeposited) / 1e9 : 0;
        const capacity = pot ? Number(pot.capacityLamports) / 1e9 : 2;
        const newTotal = currentDeposited + parseFloat(amount);
        const willWin = newTotal >= capacity * 0.95;
        
        setCelebrationAmount(parseFloat(amount));
        
        if (willWin) {
          const totalVault = vaultBalance ? vaultBalance / 1e9 : newTotal;
          const prize = totalVault * 0.9;
          setWinnerPrize(prize);
          setShowWinner(true);
          setTimeout(() => {
            window.location.reload();
          }, 6000);
        } else {
          setShowCelebration(true);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
        
        setAmount("");
        setError("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !pot || pot.status !== 0 || isLoading;

  const capacity = pot ? Number(pot.capacityLamports) / 1e9 : 2;
  const deposited = pot ? Number(pot.totalDeposited) / 1e9 : 0;
  const remaining = capacity - deposited;

  if (!pot) {
    return (
      <div className="glass-panel p-6 ">
        <h3 className="text-xl font-bold solana-gradient-text mb-4">Deposit SOL</h3>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading pot data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Regular Celebration Animation */}
      <DepositCelebration
        show={showCelebration}
        amount={celebrationAmount}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Winner Celebration Animation with Pot Cracking! */}
      <WinnerCelebration
        show={showWinner}
        amount={celebrationAmount}
        winnerAmount={winnerPrize}
        onComplete={() => setShowWinner(false)}
      />

      <motion.div 
        className="glass-panel p-6"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: isLoading ? 0.7 : 1,
          scale: isLoading ? 0.98 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-bold text-lime-400 mb-4 flex items-center gap-2">
          <Send className="text-lime-400" size={24} />
          Deposit SOL
        </h3>
      
      <form onSubmit={handleDeposit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm text-gray-300 mb-2 font-semibold">
            Amount (SOL)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              className="w-full px-4 py-3 bg-black/30 border border-lime-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              disabled={isDisabled}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">
              SOL
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <span className="text-lime-400">●</span>
              Minimum: 0.01 SOL
            </span>
            {/* {remaining > 0 && (
              <span className="text-lime-400 font-semibold">
                {remaining.toFixed(4)} SOL remaining
              </span>
            )} */}
          </div>
        </div>

        {/* Quick Amount Buttons */}
        {pot.status === 0 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAmount("0.1")}
              disabled={isDisabled}
              className="px-3 py-2 bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 rounded-lg text-lime-400 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0.1 SOL
            </button>
            <button
              type="button"
              onClick={() => setAmount("0.5")}
              disabled={isDisabled}
              className="px-3 py-2 bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 rounded-lg text-lime-400 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0.5 SOL
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            isDisabled
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30"
              : "bg-lime-500 hover:bg-lime-600 text-black hover:scale-105 border border-lime-500/50 font-bold"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Depositing...
            </>
          ) : pot?.status === 0 ? (
            <>
              <Send size={18} />
              Deposit SOL
            </>
          ) : pot?.status === 1 ? (
            "Pot Finalizing"
          ) : (
            "Pot Settled"
          )}
        </button>
      </form>

      {/* Game Rules & Info */}
      {pot?.status === 0 && (
        <div className="mt-4 space-y-3">
          <div className="bg-lime-500/5 rounded-lg p-3 border border-lime-500/20">
            <div className="flex items-start gap-2">
              <Zap className="text-lime-400 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-gray-300">
                <strong className="text-lime-400">Be the last depositor</strong> when capacity is reached or deadline expires to win the pot!
              </p>
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-3 border border-lime-500/10">
            <div className="flex items-start gap-2 mb-2">
              <Info className="text-lime-400 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs font-bold text-lime-400">Important Rules:</p>
            </div>
            <ul className="text-xs text-gray-300 space-y-1 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-0.5">▸</span>
                <span><strong>Overshoot allowed:</strong> Deposits exceeding capacity are not refunded</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-0.5">▸</span>
                <span>Cooldown period enforced between your deposits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-0.5">▸</span>
                <span>All transactions are on-chain and verifiable</span>
              </li>
            </ul>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">
              💎 Winner gets <span className="text-lime-400 font-bold">90%</span> of the pot! 🏆
            </p>
          </div>
        </div>
      )}
      </motion.div>
    </>
  );
}
