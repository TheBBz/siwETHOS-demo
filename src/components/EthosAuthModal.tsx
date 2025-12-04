'use client';

/**
 * Ethos Auth Modal
 *
 * A polished modal for Sign-In with Ethereum (SIWE) authentication.
 * Features wallet selection, step-by-step progress feedback, and Ethos profile display.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Web3Icon } from '@bgd-labs/react-web3-icons';
import Image from 'next/image';

// ============================================================================
// Constants & Types
// ============================================================================

// Score level colors (Dark Mode - from Ethos app)
const SCORE_COLORS = {
  untrusted: '#B72B38',     // Red - Level 0
  questionable: '#CC9A1A',  // Amber - Level 1
  neutral: '#C1C0B6',       // Off-White - Level 2
  known: '#8F97DB',         // Slate - Level 3
  established: '#656ECF',   // Light Indigo - Level 4
  reputable: '#4046C2',     // Indigo - Level 5
  exemplary: '#127F31',     // Green - Level 6
  distinguished: '#085922', // Dark Green - Level 7
  revered: '#836DA6',       // Light Purple - Level 8
  renowned: '#7E51B9',      // Deep Purple - Level 9
} as const;

type ModalView = 'wallet-select' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error';

interface WalletInfo {
  id: string;
  name: string;
  walletKey: string; // Key for @bgd-labs/react-web3-icons
  color: string;
  downloadUrl: string;
  checkInstalled: () => boolean;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isPhantom?: boolean;
  isZerion?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  providers?: EthereumProvider[];
}

interface EthosProfile {
  profileId: number;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  score?: number;
  profileUrl?: string | null;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    phantom?: { ethereum?: EthereumProvider };
  }
}

export interface EthosAuthResult {
  code: string;
  address: string;
  profile: EthosProfile;
}

export interface EthosAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: EthosAuthResult) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the color for a credibility score based on Ethos score levels
 */
function getScoreColor(score: number): string {
  if (score >= 2600) return SCORE_COLORS.renowned;
  if (score >= 2400) return SCORE_COLORS.revered;
  if (score >= 2200) return SCORE_COLORS.distinguished;
  if (score >= 2000) return SCORE_COLORS.exemplary;
  if (score >= 1800) return SCORE_COLORS.reputable;
  if (score >= 1600) return SCORE_COLORS.established;
  if (score >= 1400) return SCORE_COLORS.known;
  if (score >= 1200) return SCORE_COLORS.neutral;
  if (score >= 800) return SCORE_COLORS.questionable;
  return SCORE_COLORS.untrusted;
}

/**
 * Get the score level name for a credibility score
 */
function getScoreLevel(score: number): string {
  if (score >= 2600) return 'Renowned';
  if (score >= 2400) return 'Revered';
  if (score >= 2200) return 'Distinguished';
  if (score >= 2000) return 'Exemplary';
  if (score >= 1800) return 'Reputable';
  if (score >= 1600) return 'Established';
  if (score >= 1400) return 'Known';
  if (score >= 1200) return 'Neutral';
  if (score >= 800) return 'Questionable';
  return 'Untrusted';
}

// ============================================================================
// Wallet Definitions
// ============================================================================

const WALLETS: WalletInfo[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    walletKey: 'metamask',
    color: '#F6851B',
    downloadUrl: 'https://metamask.io/download/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      if (ethereum.providers?.length) {
        return ethereum.providers.some((p: EthereumProvider) => p.isMetaMask && !p.isRabby);
      }
      return ethereum.isMetaMask === true && !ethereum.isRabby;
    },
  },
  {
    id: 'rabby',
    name: 'Rabby',
    walletKey: 'rabbywallet',
    color: '#8697FF',
    downloadUrl: 'https://rabby.io/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      return ethereum?.isRabby === true;
    },
  },
  {
    id: 'phantom',
    name: 'Phantom',
    walletKey: 'phantomwallet',
    color: '#AB9FF2',
    downloadUrl: 'https://phantom.app/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return !!window.phantom?.ethereum;
    },
  },
  {
    id: 'zerion',
    name: 'Zerion',
    walletKey: 'zerionwallet',
    color: '#2962EF',
    downloadUrl: 'https://zerion.io/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      return ethereum?.isZerion === true;
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    walletKey: 'coinbasewallet',
    color: '#0052FF',
    downloadUrl: 'https://www.coinbase.com/wallet',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      if (ethereum.providers?.length) {
        return ethereum.providers.some((p: EthereumProvider) => p.isCoinbaseWallet);
      }
      return ethereum.isCoinbaseWallet === true;
    },
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    walletKey: 'bravewallet',
    color: '#FB542B',
    downloadUrl: 'https://brave.com/wallet/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      return ethereum?.isBraveWallet === true;
    },
  },
];

// ============================================================================
// Main Component
// ============================================================================

export function EthosAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: EthosAuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ModalView>('wallet-select');
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<EthosProfile | null>(null);
  const [installedWallets, setInstalledWallets] = useState<string[]>([]);

  // Check installed wallets on mount
  useEffect(() => {
    setMounted(true);
    const installed = WALLETS.filter(w => w.checkInstalled()).map(w => w.id);
    setInstalledWallets(installed);
    return () => setMounted(false);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('wallet-select');
      setSelectedWallet(null);
      setAddress(null);
      setError(null);
      setProfile(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && view !== 'verifying') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, view]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Get the appropriate provider for the selected wallet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getProvider = useCallback((): EthereumProvider | null => {
    if (!selectedWallet || typeof window === 'undefined') return null;
    
    const ethereum = window.ethereum;
    if (!ethereum) return null;

    // Handle Phantom
    if (selectedWallet.id === 'phantom' && window.phantom?.ethereum) {
      return window.phantom.ethereum;
    }

    // Handle multiple providers
    if (ethereum.providers?.length) {
      for (const provider of ethereum.providers) {
        if (selectedWallet.id === 'metamask' && provider.isMetaMask && !provider.isRabby) return provider;
        if (selectedWallet.id === 'rabby' && provider.isRabby) return provider;
        if (selectedWallet.id === 'coinbase' && provider.isCoinbaseWallet) return provider;
      }
    }

    // Default to window.ethereum
    return ethereum;
  }, [selectedWallet]);

  const connectWallet = async (wallet: WalletInfo) => {
    setSelectedWallet(wallet);
    setView('connecting');
    setError(null);

    // Small delay for UX
    await new Promise(r => setTimeout(r, 500));

    const provider = (() => {
      if (wallet.id === 'phantom' && window.phantom?.ethereum) {
        return window.phantom.ethereum;
      }
      const ethereum = window.ethereum;
      if (!ethereum) return null;
      if (ethereum.providers?.length) {
        for (const p of ethereum.providers) {
          if (wallet.id === 'metamask' && p.isMetaMask && !p.isRabby) return p;
          if (wallet.id === 'rabby' && p.isRabby) return p;
          if (wallet.id === 'coinbase' && p.isCoinbaseWallet) return p;
        }
      }
      return ethereum;
    })();

    if (!provider) {
      setError(`${wallet.name} is not installed`);
      setView('error');
      return;
    }

    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setAddress(accounts[0]);
      await signMessage(provider, accounts[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      if (message.includes('rejected') || message.includes('denied') || message.includes('User rejected')) {
        setError('Connection rejected');
      } else {
        setError(message);
      }
      setView('error');
    }
  };

  const signMessage = async (provider: EthereumProvider, walletAddress: string) => {
    setView('signing');

    try {
      // Get nonce from server
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce from server');
      }
      const { nonce, expiresAt } = await nonceResponse.json();

      // Create SIWE message
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        walletAddress,
        '',
        'Sign in with Ethos to verify your wallet ownership.',
        '',
        'This is a signature request, NOT a transaction.',
        'It will not cost any gas fees or move any funds.',
        'Your wallet address will be used to fetch your Ethos profile.',
        '',
        `URI: ${uri}`,
        'Version: 1',
        'Chain ID: 1',
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
        `Expiration Time: ${expiresAt}`,
        'Resources:',
        '- https://ethos.network',
      ].join('\n');

      // Request signature
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      }) as string;

      // Verify signature
      await verifySignature(message, signature, walletAddress);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign';
      if (message.includes('rejected') || message.includes('denied') || message.includes('User rejected')) {
        setError('Signature rejected');
      } else {
        setError(message);
      }
      setView('error');
    }
  };

  const verifySignature = async (message: string, signature: string, walletAddress: string) => {
    setView('verifying');

    try {
      const response = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, address: walletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'no_ethos_profile') {
          throw new Error('No Ethos profile found for this wallet. Create one at ethos.network');
        }
        throw new Error(data.error || 'Verification failed');
      }

      setProfile(data.profile);
      setView('success');
      onSuccess?.({ code: data.code, address: walletAddress, profile: data.profile });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setView('error');
    }
  };

  const goBack = useCallback(() => {
    if (view === 'error' || view === 'connecting') {
      setView('wallet-select');
      setSelectedWallet(null);
      setError(null);
    }
  }, [view]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && view !== 'verifying') onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 glass-card shadow-2xl shadow-primary/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          {(view === 'error' || (view === 'connecting' && selectedWallet)) && (
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-lg transition-colors hover:bg-white/10 text-text-secondary"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {view !== 'error' && view !== 'connecting' && <div className="w-9" />}
          
          <span className="font-semibold text-text-primary">
            {view === 'wallet-select' && 'Connect Wallet'}
            {view === 'connecting' && 'Connecting'}
            {view === 'signing' && 'Sign Message'}
            {view === 'verifying' && 'Verifying'}
            {view === 'success' && 'Connected'}
            {view === 'error' && 'Error'}
          </span>
          
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg transition-colors hover:bg-white/10 text-text-secondary"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {view === 'wallet-select' && (
            <WalletSelectView
              wallets={WALLETS}
              installedWallets={installedWallets}
              onSelect={connectWallet}
            />
          )}

          {view === 'connecting' && selectedWallet && (
            <WalletProgressView
              wallet={selectedWallet}
              title={`Waiting for ${selectedWallet.name}`}
              description="Approve the connection request in your wallet"
            />
          )}

          {view === 'signing' && selectedWallet && (
            <WalletProgressView
              wallet={selectedWallet}
              title="Sign to verify"
              description="Sign the message in your wallet to verify ownership"
              showConnecting
            />
          )}

          {view === 'verifying' && selectedWallet && (
            <WalletProgressView
              wallet={selectedWallet}
              title="Verifying..."
              description="Checking your Ethos profile"
              showConnecting
            />
          )}

          {view === 'success' && profile && (
            <SuccessView
              profile={profile}
              address={address}
              onDone={onClose}
            />
          )}

          {view === 'error' && (
            <ErrorView
              error={error}
              onRetry={goBack}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="text-center pt-4 border-t border-border">
            <span className="text-xs text-text-tertiary">
              Protected by{' '}
              <a
                href="https://ethos.network"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-primary"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Ethos
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ============================================================================
// Sub-Views
// ============================================================================

function WalletSelectView({
  wallets,
  installedWallets,
  onSelect,
}: {
  wallets: WalletInfo[];
  installedWallets: string[];
  onSelect: (wallet: WalletInfo) => void;
}) {
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 512 512"
            className="w-16 h-16"
          >
            <rect width="512" height="512" className="fill-background" rx="100" />
            <path
              className="fill-foreground"
              fillRule="evenodd"
              d="M255.38 255.189a254.98 254.98 0 0 1-1.935 31.411H101v62.2h136.447a251.522 251.522 0 0 1-35.932 62.2H411v-62.2H237.447a250.584 250.584 0 0 0 15.998-62.2H411v-62.2H253.521a250.604 250.604 0 0 0-15.826-62.2H411V100H202.003a251.526 251.526 0 0 1 35.692 62.2H101v62.2h152.521a255 255 0 0 1 1.859 30.789Z"
              clipRule="evenodd"
            />
          </svg>
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
              <span
                className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-light font-medium"
              >
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

function WalletProgressView({
  wallet,
  title,
  description,
  showConnecting,
}: {
  wallet: WalletInfo;
  title: string;
  description: string;
  showConnecting?: boolean;
}) {
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
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-white/5 text-text-secondary border border-white/10"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Connecting
        </div>
      )}
    </div>
  );
}

function SuccessView({
  profile,
  address,
  onDone,
}: {
  profile: EthosProfile;
  address: string | null;
  onDone: () => void;
}) {
  const scoreColor = profile.score !== undefined ? getScoreColor(profile.score) : SCORE_COLORS.reputable;
  const scoreLevel = profile.score !== undefined ? getScoreLevel(profile.score) : '';

  return (
    <div className="text-center py-2">
      {/* Success check */}
      <div className="flex justify-center mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center bg-success"
        >
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-1 text-text-primary">
        Welcome!
      </h3>
      <p className="text-sm mb-4 text-text-secondary">
        Signed in with Ethos
      </p>

      {/* Profile Card */}
      <div
        className="rounded-xl p-4 mb-4 text-left bg-white/5 border border-white/10"
      >
        <div className="flex items-center gap-3">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              width={48}
              height={48}
              className="rounded-full object-cover"
              style={{ border: `2px solid ${scoreColor}` }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-white/10 text-text-primary"
            >
              {(profile.displayName || profile.username || '?')[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate text-text-primary">
              {profile.displayName || profile.username || 'Anonymous'}
            </div>
            {address && (
              <div className="text-xs font-mono truncate text-text-tertiary">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
            )}
          </div>

          {profile.score !== undefined && (
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: scoreColor }}>
                {profile.score}
              </div>
              <div className="text-xs" style={{ color: scoreColor }}>
                {scoreLevel}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onDone}
        className="btn-primary w-full"
      >
        Continue
      </button>

      {profile.profileUrl && (
        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm hover:underline transition-colors text-primary"
        >
          View profile →
        </a>
      )}
    </div>
  );
}

function ErrorView({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-6">
      <div className="flex justify-center mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center bg-error"
        >
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-text-primary">
        Connection Failed
      </h3>
      <p className="text-sm mb-6 text-text-secondary">
        {error || 'Something went wrong'}
      </p>

      <button
        onClick={onRetry}
        className="btn-secondary w-full"
      >
        Try Again
      </button>
    </div>
  );
}


