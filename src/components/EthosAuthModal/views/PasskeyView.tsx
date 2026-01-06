'use client';

/**
 * Passkey View
 *
 * WebAuthn/Passkey sign-in view for users with existing passkeys.
 * Passkey registration happens post-auth from the SuccessView.
 */

import { useState, useCallback } from 'react';
import { PasskeyIcon } from '../icons';

interface PasskeyViewProps {
  onAuthenticate: () => Promise<void>;
  onCancel: () => void;
  isSupported: boolean;
}

export function PasskeyView({
  onAuthenticate,
  onCancel,
  isSupported,
}: PasskeyViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onAuthenticate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [onAuthenticate]);

  if (!isSupported) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
          <PasskeyIcon className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">
          Passkeys Not Supported
        </h3>
        <p className="text-sm text-text-secondary">
          Your browser or device doesn&apos;t support passkeys.
          Try using a different browser or device.
        </p>
        <button
          onClick={onCancel}
          className="w-full py-3 px-4 rounded-xl font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-text-primary transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Icon and Title */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3">
          <PasskeyIcon className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">
          Sign in with Passkey
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Use your fingerprint, face, or device PIN to sign in
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Authentication button */}
      <div className="space-y-3">
        <button
          onClick={handleAuthenticate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Continue with Passkey
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isLoading}
          className="w-full py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          Back to options
        </button>
      </div>

      {/* Help text */}
      <div className="pt-2 border-t border-white/5">
        <p className="text-xs text-text-tertiary text-center">
          Don&apos;t have a passkey yet? Sign in with another method first,
          then add a passkey from your profile.
        </p>
      </div>
    </div>
  );
}
