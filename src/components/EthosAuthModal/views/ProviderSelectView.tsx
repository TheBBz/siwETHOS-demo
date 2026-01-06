'use client';

/**
 * Provider Selection View
 * 
 * Shows wallet and social login options
 */

import { useState, useEffect } from 'react';
import { EthosLogo, WalletIcon, FarcasterIcon, DiscordIcon, TelegramIcon, TwitterIcon, PasskeyIcon } from '../icons';

interface ProviderSelectViewProps {
  onSelectWallet: () => void;
  onSelectFarcaster: () => void;
  onSelectDiscord?: () => void;
  onSelectTelegram?: () => void;
  onSelectTwitter?: () => void;
  onSelectPasskey?: () => void;
  passkeySupported?: boolean;
}

export function ProviderSelectView({
  onSelectWallet,
  onSelectFarcaster,
  onSelectDiscord,
  onSelectTelegram,
  onSelectTwitter,
  onSelectPasskey,
  passkeySupported = false,
}: ProviderSelectViewProps) {
  const [isBrave, setIsBrave] = useState(false);
  const [showBraveWarning, setShowBraveWarning] = useState(false);

  // Detect Brave browser
  useEffect(() => {
    const checkBrave = async () => {
      // @ts-expect-error - Brave specific API
      if (navigator.brave && await navigator.brave.isBrave()) {
        setIsBrave(true);
      }
    };
    checkBrave();
  }, []);

  const handleTwitterClick = () => {
    if (isBrave) {
      setShowBraveWarning(true);
    } else {
      onSelectTwitter?.();
    }
  };

  const proceedWithTwitter = () => {
    setShowBraveWarning(false);
    onSelectTwitter?.();
  };

  // Show Brave warning modal
  if (showBraveWarning) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[#FB542B] flex items-center justify-center">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Brave Browser Detected</h3>
        <p className="text-sm text-text-secondary">
          X/Twitter login may not work properly with Brave Shields enabled due to cookie blocking.
        </p>
        <div className="bg-white/5 rounded-lg p-3 text-left text-xs text-text-tertiary">
          <p className="font-medium text-text-secondary mb-1">To fix this:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the Brave Shields icon (🦁) on the X login page</li>
            <li>Set &quot;Cookies&quot; to &quot;Allow all cookies&quot;</li>
            <li>Or temporarily disable Shields for x.com</li>
          </ol>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setShowBraveWarning(false)}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={proceedWithTwitter}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-900"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ethos Logo and description */}
      <div className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <EthosLogo />
        </div>
        <p className="text-sm text-text-tertiary">
          Choose how you want to sign in
        </p>
      </div>

      {/* Provider options */}
      <div className="space-y-2">
        {/* Wallet option */}
        <button
          onClick={onSelectWallet}
          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-600 shrink-0">
            <WalletIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-text-primary block">Connect Wallet</span>
            <span className="text-xs text-text-tertiary">MetaMask, Rabby, Phantom & more</span>
          </div>
          <svg className="w-5 h-5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Passkey option */}
        {onSelectPasskey && (
          <button
            onClick={onSelectPasskey}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
              <PasskeyIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-text-primary block">Use Passkey</span>
              <span className="text-xs text-text-tertiary">
                {passkeySupported ? 'Face ID, Touch ID, or PIN' : 'Not supported on this device'}
              </span>
            </div>
            <svg className="w-5 h-5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-text-tertiary">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social providers grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Farcaster */}
          <button
            onClick={onSelectFarcaster}
            className="flex items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#855DCD] shrink-0">
              <FarcasterIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-text-primary text-sm">Farcaster</span>
          </button>

          {/* Discord */}
          <button
            onClick={onSelectDiscord}
            disabled={!onSelectDiscord}
            className="flex items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#5865F2] shrink-0">
              <DiscordIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-text-primary text-sm">Discord</span>
          </button>

          {/* Telegram */}
          <button
            onClick={onSelectTelegram}
            disabled={!onSelectTelegram}
            className="flex items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#229ED9] shrink-0">
              <TelegramIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-text-primary text-sm">Telegram</span>
          </button>

          {/* Twitter/X */}
          <button
            onClick={handleTwitterClick}
            disabled={!onSelectTwitter}
            className="flex items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black shrink-0">
              <TwitterIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-text-primary text-sm">X (Twitter)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
