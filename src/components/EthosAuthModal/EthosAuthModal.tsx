'use client';

/**
 * Ethos Auth Modal
 *
 * A polished modal for Sign-In with Ethereum (SIWE) authentication.
 * Features wallet selection, step-by-step progress feedback, and Ethos profile display.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

import type {
  ModalView,
  WalletInfo,
  EthereumProvider,
  EthosProfile,
  EthosAuthModalProps,
} from './types';
import { WALLETS } from './constants';
import {
  ProviderSelectView,
  WalletSelectView,
  WalletProgressView,
  FarcasterQRView,
  SuccessView,
  ErrorView,
  SocialLoadingView,
  SignOutView,
} from './views';

// ============================================================================
// Main Component
// ============================================================================

export function EthosAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onSignOut,
  pendingOAuth,
}: EthosAuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ModalView>('provider-select');
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<EthosProfile | null>(null);
  const [installedWallets, setInstalledWallets] = useState<string[]>([]);
  const [socialProvider, setSocialProvider] = useState<string | null>(null);
  
  // Farcaster state
  const [farcasterQrUrl, setFarcasterQrUrl] = useState<string | null>(null);
  const [farcasterChannelToken, setFarcasterChannelToken] = useState<string | null>(null);
  const [farcasterDeepLink, setFarcasterDeepLink] = useState<string | null>(null);

  // Track processed OAuth codes to prevent re-processing
  const processedOAuthRef = useRef<string | null>(null);

  // Check installed wallets on mount
  useEffect(() => {
    setMounted(true);
    const installed = WALLETS.filter(w => w.checkInstalled()).map(w => w.id);
    setInstalledWallets(installed);
    return () => setMounted(false);
  }, []);

  // Process OAuth callback code
  const processOAuthCallback = useCallback(async (code: string, provider: string) => {
    // Skip if already processed this code
    if (processedOAuthRef.current === code) {
      return;
    }
    processedOAuthRef.current = code;
    
    setSocialProvider(provider);
    setView('verifying');

    try {
      // Decode the auth code (it's base64url encoded JSON)
      // Use TextDecoder to properly handle UTF-8 characters (emojis, special chars)
      const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoded = JSON.parse(new TextDecoder('utf-8').decode(bytes));
      
      // Add a small delay for better UX
      await new Promise(r => setTimeout(r, 1500));

      // Extract profile from the decoded data
      const profileData: EthosProfile = {
        profileId: decoded.user.ethosProfileId,
        displayName: decoded.user.name,
        username: decoded.user.ethosUsername,
        avatarUrl: decoded.user.picture,
        score: decoded.user.ethosScore,
        profileUrl: decoded.user.profileUrl,
      };

      setProfile(profileData);
      setView('success');
      onSuccess?.({ code, address: '', profile: profileData });
    } catch (err) {
      console.error('Failed to process OAuth callback:', err);
      setError('Failed to verify authentication');
      setView('error');
    }
  }, [onSuccess]);

  // Handle pending OAuth callback - run once when we have pendingOAuth
  useEffect(() => {
    if (pendingOAuth && isOpen) {
      processOAuthCallback(pendingOAuth.code, pendingOAuth.provider);
    }
  }, [pendingOAuth, isOpen, processOAuthCallback]);

  // Reset state when modal opens (but not if we have pending OAuth or in a flow)
  useEffect(() => {
    if (isOpen && !pendingOAuth && view === 'provider-select') {
      // Clear the processed ref when opening fresh
      processedOAuthRef.current = null;
      setSelectedWallet(null);
      setAddress(null);
      setError(null);
      setProfile(null);
      setSocialProvider(null);
      setFarcasterQrUrl(null);
      setFarcasterChannelToken(null);
      setFarcasterDeepLink(null);
    }
  }, [isOpen, pendingOAuth, view]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && view !== 'verifying' && view !== 'signing-out') {
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

  // Suppress unused var warning for getProvider (kept for future use)
  void getProvider;

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

      // Map API response to profile format
      const profileData: EthosProfile = {
        profileId: data.user.ethos_profile_id,
        displayName: data.user.name,
        username: data.user.ethos_username,
        avatarUrl: data.user.picture,
        score: data.user.ethos_score,
        profileUrl: data.user.profile_url,
      };

      setProfile(profileData);
      setView('success');
      onSuccess?.({ code: data.access_token, address: walletAddress, profile: profileData });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setView('error');
    }
  };

  // Farcaster authentication
  const connectFarcaster = async () => {
    setView('farcaster-qr');
    setError(null);

    try {
      // Create Farcaster channel via our API
      const response = await fetch('/api/auth/farcaster/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create Farcaster channel');
      }

      const { channelToken, url, qrCodeDataUrl } = await response.json();
      
      setFarcasterChannelToken(channelToken);
      setFarcasterQrUrl(qrCodeDataUrl);
      setFarcasterDeepLink(url);

      // Start polling for completion
      pollFarcasterChannel(channelToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
      setView('error');
    }
  };

  const pollFarcasterChannel = async (channelToken: string) => {
    const maxAttempts = 60; // 2 minutes
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Session expired. Please try again.');
        setView('error');
        return;
      }

      try {
        const response = await fetch('/api/auth/farcaster/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        if (data.state === 'completed') {
          // Show verifying step first
          setSocialProvider('farcaster');
          setView('verifying');
          
          // Brief delay for UX, then show success
          await new Promise(r => setTimeout(r, 1500));
          
          setProfile(data.profile);
          setView('success');
          onSuccess?.({ code: data.code, address: '', profile: data.profile });
          return;
        } else if (data.state === 'error' || data.state === 'expired') {
          setError(data.state === 'expired' ? 'Session expired. Please try again.' : 'Sign in failed.');
          setView('error');
          return;
        }

        // Still pending, continue polling
        attempts++;
        setTimeout(poll, 2000);
      } catch (err) {
        console.error('Polling error:', err);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // Suppress unused var warning for farcasterChannelToken (kept for future use)
  void farcasterChannelToken;

  // Social OAuth redirects - store provider in sessionStorage for callback handling
  const connectDiscord = () => {
    sessionStorage.setItem('oauth_provider', 'discord');
    const state = crypto.randomUUID();
    const redirectUri = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `/auth/discord?redirect_uri=${redirectUri}&state=${state}`;
  };

  const connectTelegram = () => {
    sessionStorage.setItem('oauth_provider', 'telegram');
    const state = crypto.randomUUID();
    const redirectUri = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `/auth/telegram?redirect_uri=${redirectUri}&state=${state}`;
  };

  const connectTwitter = () => {
    sessionStorage.setItem('oauth_provider', 'twitter');
    const state = crypto.randomUUID();
    const redirectUri = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `/auth/twitter?redirect_uri=${redirectUri}&state=${state}`;
  };

  const goBack = useCallback(() => {
    if (view === 'error' || view === 'connecting' || view === 'wallet-select' || view === 'farcaster-qr') {
      setView('provider-select');
      setSelectedWallet(null);
      setError(null);
      setFarcasterQrUrl(null);
      setFarcasterChannelToken(null);
      setFarcasterDeepLink(null);
    }
  }, [view]);

  if (!mounted || !isOpen) return null;

  const getTitle = () => {
    switch (view) {
      case 'provider-select': return 'Sign in with Ethos';
      case 'wallet-select': return 'Connect Wallet';
      case 'connecting': return 'Connecting';
      case 'signing': return 'Sign Message';
      case 'verifying': return 'Verifying';
      case 'success': return 'Connected';
      case 'error': return 'Error';
      case 'farcaster-qr': return 'Sign in with Farcaster';
      case 'signing-out': return 'Signing Out';
      default: return 'Sign In';
    }
  };

  const showBackButton = view === 'error' || view === 'connecting' || view === 'wallet-select' || view === 'farcaster-qr';

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && view !== 'verifying' && view !== 'signing-out') onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 glass-card shadow-2xl shadow-primary/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          {showBackButton ? (
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-lg transition-colors hover:bg-white/10 text-text-secondary"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-9" />
          )}
          
          <span className="font-semibold text-text-primary">
            {getTitle()}
          </span>
          
          {view !== 'signing-out' ? (
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg transition-colors hover:bg-white/10 text-text-secondary"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {view === 'provider-select' && (
            <ProviderSelectView
              onSelectWallet={() => setView('wallet-select')}
              onSelectFarcaster={connectFarcaster}
              onSelectDiscord={connectDiscord}
              onSelectTelegram={connectTelegram}
              onSelectTwitter={connectTwitter}
            />
          )}

          {view === 'wallet-select' && (
            <WalletSelectView
              wallets={WALLETS}
              installedWallets={installedWallets}
              onSelect={connectWallet}
            />
          )}
          
          {view === 'farcaster-qr' && (
            <FarcasterQRView
              qrUrl={farcasterQrUrl}
              deepLink={farcasterDeepLink}
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

          {view === 'verifying' && !selectedWallet && (
            <SocialLoadingView
              provider={socialProvider || 'social'}
              message="Verifying your connection..."
            />
          )}

          {view === 'success' && profile && (
            <SuccessView
              profile={profile}
              address={address}
              onDone={onClose}
              onSignOut={() => {
                // Show sign out animation
                setView('signing-out');
              }}
            />
          )}

          {view === 'signing-out' && (
            <SignOutView
              onComplete={() => {
                // Reset modal state
                setView('provider-select');
                setProfile(null);
                setAddress(null);
                setSelectedWallet(null);
                setSocialProvider(null);
                // Call parent's sign out handler
                onSignOut?.();
                // Close modal
                onClose();
              }}
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

export default EthosAuthModal;
