'use client';

/**
 * Success View
 *
 * Shows successful authentication with profile info
 */

import { useState } from 'react';
import Image from 'next/image';
import { EthosProfile } from '../types';
import { getScoreColor, getScoreLevel } from '../utils';
import { SCORE_COLORS } from '../constants';
import { PasskeyIcon } from '../icons';

interface SuccessViewProps {
  profile: EthosProfile;
  address: string | null;
  onDone: () => void;
  onSignOut?: () => void;
  onAddPasskey?: () => Promise<void>;
  passkeySupported?: boolean;
}

export function SuccessView({
  profile,
  address,
  onDone,
  onSignOut,
  onAddPasskey,
  passkeySupported = false,
}: SuccessViewProps) {
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [passkeyAdded, setPasskeyAdded] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const scoreColor = profile.score !== undefined ? getScoreColor(profile.score) : SCORE_COLORS.reputable;
  const scoreLevel = profile.score !== undefined ? getScoreLevel(profile.score) : '';

  const handleAddPasskey = async () => {
    if (!onAddPasskey) return;
    setAddingPasskey(true);
    setPasskeyError(null);
    try {
      await onAddPasskey();
      setPasskeyAdded(true);
    } catch (err) {
      setPasskeyError(err instanceof Error ? err.message : 'Failed to add passkey');
    } finally {
      setAddingPasskey(false);
    }
  };

  return (
    <div className="text-center py-2">
      {/* Success check */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-success">
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
      <div className="rounded-xl p-4 mb-4 text-left bg-white/5 border border-white/10">
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
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-white/10 text-text-primary">
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

      {/* Add Passkey Option */}
      {passkeySupported && onAddPasskey && !passkeyAdded && (
        <div className="mb-4">
          <button
            onClick={handleAddPasskey}
            disabled={addingPasskey}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
              <PasskeyIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-text-primary block">
                {addingPasskey ? 'Adding Passkey...' : 'Add Passkey'}
              </span>
              <span className="text-xs text-text-tertiary">
                Sign in faster next time with Face ID or Touch ID
              </span>
            </div>
            {addingPasskey ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
          {passkeyError && (
            <p className="text-xs text-red-400 mt-2 text-left">{passkeyError}</p>
          )}
        </div>
      )}

      {/* Passkey Added Confirmation */}
      {passkeyAdded && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span className="text-sm font-medium">Passkey added successfully!</span>
          </div>
          <p className="text-xs text-green-400/70 mt-1">
            You can now sign in with Face ID or Touch ID.
          </p>
        </div>
      )}

      <button
        onClick={onDone}
        className="btn-primary w-full"
      >
        Continue
      </button>

      <div className="flex items-center justify-center gap-4 mt-3">
        {profile.profileUrl && (
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline transition-colors text-primary"
          >
            View profile →
          </a>
        )}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="text-sm hover:underline transition-colors text-text-tertiary hover:text-text-secondary"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
