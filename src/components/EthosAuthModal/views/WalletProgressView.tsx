'use client';

/**
 * Wallet Progress View
 * 
 * Shows connection/signing progress for wallet auth
 */

import { Web3Icon } from '@bgd-labs/react-web3-icons';
import { WalletInfo } from '../types';

interface WalletProgressViewProps {
  wallet: WalletInfo;
  title: string;
  description: string;
  showConnecting?: boolean;
}

export function WalletProgressView({
  wallet,
  title,
  description,
  showConnecting,
}: WalletProgressViewProps) {
  return (
    <div className="text-center py-6">
      {/* Wallet icon with spinner */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden bg-white/10">
          <Web3Icon walletKey={wallet.walletKey} className="w-10 h-10" />
        </div>
        {/* Circular progress */}
        <svg
          className="absolute w-20 h-20 -rotate-90 animate-spin"
          style={{ animationDuration: '2s' }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            className="stroke-border"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="100 200"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-text-primary">
        {title}
      </h3>
      <p className="text-sm mb-4 text-text-secondary">
        {description}
      </p>

      {showConnecting && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-white/5 text-text-secondary border border-white/10">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Connecting
        </div>
      )}
    </div>
  );
}
