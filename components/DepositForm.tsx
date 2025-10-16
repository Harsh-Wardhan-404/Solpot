"use client";

import { useState } from "react";
import { useDeposit } from "./hooks/useDeposit";
import { usePot } from "./hooks/usePot";

export default function DepositForm() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { deposit } = useDeposit();
  const { pot } = usePot();

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

      await deposit(lamports);
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Deposit failed");
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !pot || pot.status !== 0 || isLoading;

  if (!pot) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">Deposit SOL</h3>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading pot data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">Deposit SOL</h3>
      
      <form onSubmit={handleDeposit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Amount (SOL)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isDisabled}
          />
          <p className="text-xs text-gray-400 mt-1">
            Minimum: 0.01 SOL
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isDisabled
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:scale-105"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Depositing...
            </div>
          ) : pot?.status === 0 ? (
            "Deposit SOL"
          ) : pot?.status === 1 ? (
            "Pot Finalizing"
          ) : (
            "Pot Settled"
          )}
        </button>
      </form>

      {pot?.status === 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Last depositor wins when pot reaches capacity or deadline!
          </p>
        </div>
      )}
    </div>
  );
}
