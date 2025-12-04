/**
 * Wallet Connect Page
 *
 * SIWE (Sign-In with Ethereum) authentication page with Ethos Network branding.
 * Users connect their wallet, sign a message, and authenticate with their Ethos profile.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Connection state type
type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'signing'
  | 'verifying'
  | 'success'
  | 'error';

// Ethereum provider type
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
}

function ConnectPageContent() {
  const searchParams = useSearchParams();

  const [state, setState] = useState<ConnectionState>('idle');
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState<boolean>(false);

  const redirectUri = searchParams.get('redirect_uri');
  const stateParam = searchParams.get('state');

  // Check for wallet on mount
  useEffect(() => {
    setHasWallet(typeof window !== 'undefined' && !!(window as Window & { ethereum?: EthereumProvider }).ethereum);
  }, []);

  // Validate required params
  useEffect(() => {
    if (!redirectUri) {
      setError('Missing redirect_uri parameter');
      setState('error');
    }
  }, [redirectUri]);

  /**
   * Connect to wallet
   */
  const connectWallet = async () => {
    const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask or another wallet.');
      setState('error');
      return;
    }

    setState('connecting');
    setError(null);

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setAddress(accounts[0]);
      await signMessage(accounts[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      setState('error');
    }
  };

  /**
   * Sign SIWE message
   */
  const signMessage = async (walletAddress: string) => {
    const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!ethereum) return;

    setState('signing');

    try {
      // Get nonce from server
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }
      const { nonce, expiresAt } = await nonceResponse.json();

      // Create SIWE message
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();
      const expirationTime = expiresAt;

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        walletAddress,
        '',
        'Sign in with Ethos - Verify your identity to access your Ethos profile.',
        '',
        `URI: ${uri}`,
        'Version: 1',
        'Chain ID: 1',
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
        `Expiration Time: ${expirationTime}`,
        'Resources:',
        '- https://ethos.network',
      ].join('\n');

      // Request signature
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      }) as string;

      // Verify signature with server
      await verifySignature(message, signature, walletAddress);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign message';
      if (message.includes('rejected') || message.includes('denied')) {
        setError('Signature request was rejected');
      } else {
        setError(message);
      }
      setState('error');
    }
  };

  /**
   * Verify signature with server
   */
  const verifySignature = async (
    message: string,
    signature: string,
    walletAddress: string
  ) => {
    setState('verifying');

    try {
      const response = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          signature,
          address: walletAddress,
          redirect_uri: redirectUri,
          state: stateParam,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      const data = await response.json();

      setState('success');

      // Redirect back to client with authorization code
      setTimeout(() => {
        const url = new URL(redirectUri!);
        url.searchParams.set('code', data.code);
        if (stateParam) {
          url.searchParams.set('state', stateParam);
        }
        window.location.href = url.toString();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setState('error');
    }
  };

  /**
   * Retry connection
   */
  const retry = () => {
    setState('idle');
    setError(null);
    setAddress(null);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 hero-gradient overflow-hidden relative"
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="gradient-orb w-[400px] h-[400px] -top-[100px] -right-[100px]" />
        <div 
          className="gradient-orb w-[300px] h-[300px] bottom-[10%] -left-[50px]"
          style={{ animationDelay: '-7s' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <EthosLogo />
          <h1
            className="text-2xl font-bold mt-4 text-gradient"
          >
            Sign in with Ethos
          </h1>
          <p
            className="mt-2 text-text-secondary"
          >
            Connect your wallet to access your Ethos profile
          </p>
        </div>

        {/* Main Card */}
        <div
          className="glass-card p-6"
        >
          {/* Idle State - Show connect button */}
          {state === 'idle' && (
            <div className="space-y-4">
              <button
                onClick={connectWallet}
                disabled={!hasWallet}
                className={`w-full py-4 px-6 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasWallet ? 'btn-primary' : 'rounded-xl bg-border text-text-secondary'
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  <WalletIcon />
                  Connect Wallet
                </span>
              </button>

              {!hasWallet && (
                <p
                  className="text-sm text-center text-warning"
                >
                  No wallet detected.{' '}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline text-primary"
                  >
                    Install MetaMask
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Connecting State */}
          {state === 'connecting' && (
            <StatusDisplay
              icon={<Spinner />}
              title="Connecting..."
              description="Please approve the connection request in your wallet"
            />
          )}

          {/* Signing State */}
          {state === 'signing' && (
            <StatusDisplay
              icon={<Spinner />}
              title="Sign Message"
              description="Please sign the message in your wallet to verify ownership"
              address={address}
            />
          )}

          {/* Verifying State */}
          {state === 'verifying' && (
            <StatusDisplay
              icon={<Spinner />}
              title="Verifying..."
              description="Verifying your signature and Ethos profile"
              address={address}
            />
          )}

          {/* Success State */}
          {state === 'success' && (
            <StatusDisplay
              icon={<CheckIcon />}
              title="Success!"
              description="Redirecting you back to the application..."
              address={address}
            />
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="space-y-4">
              <StatusDisplay
                icon={<ErrorIcon />}
                title="Authentication Failed"
                description={error || 'An unknown error occurred'}
                isError
              />
              <button
                onClick={retry}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-surface-hover text-text-primary border border-border"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p
            className="text-sm text-text-secondary"
          >
            Don&apos;t have an Ethos profile?{' '}
            <a
              href="https://ethos.network"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline text-primary"
            >
              Get started
            </a>
          </p>
        </div>

        {/* Powered by */}
        <div className="mt-8 text-center">
          <p
            className="text-xs text-text-secondary"
          >
            Powered by{' '}
            <a
              href="https://ethos.network"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-primary"
            >
              Ethos Network
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function StatusDisplay({
  icon,
  title,
  description,
  address,
  isError,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  address?: string | null;
  isError?: boolean;
}) {
  return (
    <div className="text-center py-4">
      <div className="flex justify-center mb-4">{icon}</div>
      <h2
        className={`text-xl font-semibold mb-2 ${isError ? 'text-error' : 'text-text-primary'}`}
      >
        {title}
      </h2>
      <p
        className="text-sm mb-3 text-text-secondary"
      >
        {description}
      </p>
      {address && (
        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono bg-background border border-border text-text-primary"
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {formatAddress(address)}
        </div>
      )}
    </div>
  );
}

function EthosLogo() {
  return (
    <div
      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl ethos-gradient"
    >
      <svg
        className="w-8 h-8 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </div>
  );
}

function WalletIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

function Spinner() {
  return (
    <div
      className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin border-border border-t-primary"
    />
  );
}

function CheckIcon() {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center bg-primary"
    >
      <svg
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center bg-error"
    >
      <svg
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </div>
  );
}

// ============================================================================
// Main Export with Suspense Boundary
// ============================================================================

export default function ConnectPage() {
  return (
    <Suspense fallback={<ConnectPageLoading />}>
      <ConnectPageContent />
    </Suspense>
  );
}

function ConnectPageLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-background"
    >
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto border-border border-t-primary"
        />
        <p className="mt-4 text-text-secondary">
          Loading...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}