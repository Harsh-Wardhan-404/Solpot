"use client";

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white mb-4">
          Welcome to SolPot
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Connect your wallet to get started with Solana
        </p>
        <div className="flex justify-center">
          <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-semibold !px-8 !py-3 !rounded-lg !transition-all !duration-300 !transform hover:!scale-105" />
        </div>
      </div>
    </div>
  );
}
