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
  TelegramWidgetView,
  PasskeyView,
  SuccessView,
  ErrorView,
  SocialLoadingView,
  SignOutView,
} from './views';
import type { TelegramUser } from './views';

// Telegram bot username from env (will be fetched from API)
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'siwETHOS_bot';

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

  // Passkey state
  const [passkeySupported, setPasskeySupported] = useState(false);

  // Track processed OAuth codes to prevent re-processing
  const processedOAuthRef = useRef<string | null>(null);

  // Check installed wallets and passkey support on mount
  useEffect(() => {
    setMounted(true);
    const installed = WALLETS.filter(w => w.checkInstalled()).map(w => w.id);
    setInstalledWallets(installed);

    // Check WebAuthn support
    const checkPasskeySupport = async () => {
      if (typeof window === 'undefined') return;
      try {
        const available =
          !!window.PublicKeyCredential &&
          typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
        if (available) {
          const supported = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setPasskeySupported(supported);
        }
      } catch {
        setPasskeySupported(false);
      }
    };
    checkPasskeySupport();

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
      // Check if this is an error response
      if (pendingOAuth.error) {
        const errorMessage = pendingOAuth.errorDescription || pendingOAuth.error;
        setError(errorMessage);
        setView('error');
        return;
      }
      
      // Process successful OAuth callback
      if (pendingOAuth.code) {
        processOAuthCallback(pendingOAuth.code, pendingOAuth.provider);
      }
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
    // Show the inline Telegram widget instead of redirecting
    setSocialProvider('telegram');
    setView('telegram-widget');
  };

  // Handle Telegram widget auth callback
  const handleTelegramAuth = useCallback(async (telegramUser: TelegramUser) => {
    setView('verifying');
    setSocialProvider('telegram');
    
    try {
      // Send Telegram auth data to our callback endpoint
      const response = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: telegramUser.id.toString(),
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          photo_url: telegramUser.photo_url,
          auth_date: telegramUser.auth_date.toString(),
          hash: telegramUser.hash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      
      // Process the auth code like other OAuth flows
      // Use TextDecoder for proper UTF-8 emoji support
      const base64 = data.code.replace(/-/g, '+').replace(/_/g, '/');
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const jsonString = new TextDecoder('utf-8').decode(bytes);
      const decoded = JSON.parse(jsonString);
      
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
      onSuccess?.({ code: data.code, address: '', profile: profileData });
    } catch (err) {
      console.error('Telegram auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setView('error');
    }
  }, [onSuccess]);

  const connectTwitter = () => {
    sessionStorage.setItem('oauth_provider', 'twitter');
    const state = crypto.randomUUID();
    const redirectUri = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `/auth/twitter?redirect_uri=${redirectUri}&state=${state}`;
  };

  // Passkey authentication
  const connectPasskey = () => {
    setView('passkey');
    setError(null);
  };

  // Base64URL encoding/decoding helpers
  const base64UrlEncode = (buffer: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const base64UrlDecode = (str: string): Uint8Array => {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const handlePasskeyAuth = useCallback(async () => {
    setView('verifying');
    setSocialProvider('passkey');

    try {
      // Get authentication options
      const optionsRes = await fetch('/api/auth/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!optionsRes.ok) {
        throw new Error('Failed to get authentication options');
      }

      const { options, sessionId } = await optionsRes.json();

      // Decode challenge
      const challengeBuffer = base64UrlDecode(options.challenge);

      // Request credential
      const credential = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: challengeBuffer.buffer as ArrayBuffer,
          allowCredentials: options.allowCredentials?.map((cred: { id: string; type: string; transports?: string[] }) => ({
            ...cred,
            id: base64UrlDecode(cred.id).buffer as ArrayBuffer,
          })) || [],
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No credential returned');
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // Serialize credential for server
      const serializedCredential = {
        id: credential.id,
        rawId: base64UrlEncode(new Uint8Array(credential.rawId)),
        type: credential.type,
        response: {
          clientDataJSON: base64UrlEncode(new Uint8Array(response.clientDataJSON)),
          authenticatorData: base64UrlEncode(new Uint8Array(response.authenticatorData)),
          signature: base64UrlEncode(new Uint8Array(response.signature)),
          userHandle: response.userHandle ? base64UrlEncode(new Uint8Array(response.userHandle)) : undefined,
        },
      };

      // Verify with server
      const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: serializedCredential,
          sessionId,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await verifyRes.json();

      setProfile(data.profile);
      setView('success');
      onSuccess?.({ code: data.code, address: '', profile: data.profile });
    } catch (err) {
      console.error('Passkey auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setView('error');
    }
  }, [onSuccess]);

  const handlePasskeyRegister = useCallback(async (username: string, ethosProfileId?: number, fromSuccessView = false) => {
    // Only change view if not registering from success view (which has its own loading state)
    if (!fromSuccessView) {
      setView('verifying');
      setSocialProvider('passkey');
    }

    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ethosProfileId }),
      });

      if (!optionsRes.ok) {
        throw new Error('Failed to get registration options');
      }

      const { options, userId } = await optionsRes.json();

      // Decode challenge and user ID
      const challengeBuffer = base64UrlDecode(options.challenge);
      const userIdBuffer = base64UrlDecode(options.user.id);

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: challengeBuffer.buffer as ArrayBuffer,
          user: {
            ...options.user,
            id: userIdBuffer.buffer as ArrayBuffer,
          },
          excludeCredentials: options.excludeCredentials?.map((cred: { id: string; type: string; transports?: string[] }) => ({
            ...cred,
            id: base64UrlDecode(cred.id).buffer as ArrayBuffer,
          })) || [],
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No credential created');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Get additional data from modern WebAuthn Level 2 API
      const authenticatorData = response.getAuthenticatorData?.();
      const publicKey = response.getPublicKey?.();
      const publicKeyAlgorithm = response.getPublicKeyAlgorithm?.();

      // Serialize credential for server
      const serializedCredential = {
        id: credential.id,
        rawId: base64UrlEncode(new Uint8Array(credential.rawId)),
        type: credential.type,
        response: {
          clientDataJSON: base64UrlEncode(new Uint8Array(response.clientDataJSON)),
          attestationObject: base64UrlEncode(new Uint8Array(response.attestationObject)),
          // Include Level 2 API data for easier server-side verification
          authenticatorData: authenticatorData ? base64UrlEncode(new Uint8Array(authenticatorData)) : undefined,
          publicKey: publicKey ? base64UrlEncode(new Uint8Array(publicKey)) : undefined,
          publicKeyAlgorithm: publicKeyAlgorithm,
          transports: response.getTransports?.() || [],
        },
      };

      // Verify with server
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: serializedCredential,
          userId,
          username,
          ethosProfile: profile ? {
            profileId: profile.profileId,
            username: profile.username,
            displayName: profile.displayName,
          } : undefined,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await verifyRes.json();

      // If registering from success view (already authenticated), don't change the profile
      if (!profile) {
        setProfile(data.profile);
        setView('success');
        onSuccess?.({ code: data.code, address: '', profile: data.profile });
      }
      // Return success for post-auth registration
      return data;
    } catch (err) {
      console.error('Passkey register error:', err);
      // If not already authenticated, show error view
      if (!profile) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        setView('error');
      }
      throw err;
    }
  }, [onSuccess, profile]);

  // Handler for adding passkey from success view (post-auth)
  const handleAddPasskeyFromSuccess = useCallback(async () => {
    if (!profile) {
      throw new Error('No profile available');
    }

    // Use the authenticated user's info
    const username = profile.username || profile.displayName || `user_${profile.profileId}`;
    // Pass fromSuccessView=true to prevent view changes (SuccessView handles its own loading state)
    await handlePasskeyRegister(username, profile.profileId, true);
  }, [profile, handlePasskeyRegister]);

  const goBack = useCallback(() => {
    if (view === 'error' || view === 'connecting' || view === 'wallet-select' || view === 'farcaster-qr' || view === 'telegram-widget' || view === 'passkey') {
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
      case 'telegram-widget': return 'Sign in with Telegram';
      case 'passkey': return 'Use Passkey';
      case 'signing-out': return 'Signing Out';
      default: return 'Sign In';
    }
  };

  const showBackButton = view === 'error' || view === 'connecting' || view === 'wallet-select' || view === 'farcaster-qr' || view === 'telegram-widget' || view === 'passkey';

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
              onSelectPasskey={connectPasskey}
              passkeySupported={passkeySupported}
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

          {view === 'telegram-widget' && (
            <TelegramWidgetView
              botUsername={TELEGRAM_BOT_USERNAME}
              onAuth={handleTelegramAuth}
              onCancel={goBack}
            />
          )}

          {view === 'passkey' && (
            <PasskeyView
              onAuthenticate={handlePasskeyAuth}
              onCancel={goBack}
              isSupported={passkeySupported}
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
              onAddPasskey={handleAddPasskeyFromSuccess}
              passkeySupported={passkeySupported}
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
