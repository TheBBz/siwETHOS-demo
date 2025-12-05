'use client';

/**
 * Wallet Selection View
 * 
 * Shows available wallet options
 */

import { Web3Icon } from '@bgd-labs/react-web3-icons';
import { WalletInfo } from '../types';
import { EthosLogo } from '../icons';

interface WalletSelectViewProps {
  wallets: WalletInfo[];
  installedWallets: string[];
  onSelect: (wallet: WalletInfo) => void;
}

export function WalletSelectView({
  wallets,
  installedWallets,
  onSelect,
}: WalletSelectViewProps) {
  // Sort: installed first, then alphabetically
  const sortedWallets = [...wallets].sort((a, b) => {
    const aInstalled = installedWallets.includes(a.id);
    const bInstalled = installedWallets.includes(b.id);
    if (aInstalled && !bInstalled) return -1;
    if (!aInstalled && bInstalled) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-4">
      {/* Ethos Logo and description */}
      <div className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <EthosLogo />
        </div>
        <p className="text-sm text-text-tertiary">
          Connect your wallet to sign in with Ethos
        </p>
      </div>

      {/* Wallet list */}
      <div className="space-y-2">
        {sortedWallets.map((wallet) => {
          const isInstalled = installedWallets.includes(wallet.id);
          
          return (
            <button
              key={wallet.id}
              onClick={() => isInstalled ? onSelect(wallet) : window.open(wallet.downloadUrl, '_blank')}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white/5 shrink-0">
                <Web3Icon walletKey={wallet.walletKey} className="w-7 h-7" />
              </div>
              <span className="flex-1 text-left font-medium text-text-primary">
                {wallet.name}
              </span>
              {isInstalled ? (
                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-light font-medium">
                  Installed
                </span>
              ) : (
                <svg
                  className="w-4 h-4 text-text-tertiary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
