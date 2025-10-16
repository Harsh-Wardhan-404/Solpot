"use client";

import dynamic from 'next/dynamic';
import PotCard from '@/components/PotCard';
import DepositForm from '@/components/DepositForm';

// Dynamically import wallet components to avoid hydration issues
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <h1 className="text-3xl font-bold text-white">SolPot</h1>
        <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-semibold !px-6 !py-2 !rounded-lg !transition-all !duration-300 !transform hover:!scale-105" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              Universal Pot
            </h2>
            <p className="text-xl text-gray-300">
              Last depositor wins! Deposit SOL and be the final one to claim the pot.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <PotCard />
            <DepositForm />
          </div>

          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">How it works</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• Deposit any amount of SOL (minimum 0.01 SOL)</p>
                <p>• Last depositor wins 90% of the pot</p>
                <p>• Platform takes 5%, rakeback pool gets 5%</p>
                <p>• Pot ends when capacity reached or deadline passes</p>
                <p>• No refunds - overfilling is allowed but costly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
