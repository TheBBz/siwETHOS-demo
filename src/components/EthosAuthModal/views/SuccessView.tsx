'use client';

/**
 * Success View
 * 
 * Shows successful authentication with profile info
 */

import Image from 'next/image';
import { EthosProfile } from '../types';
import { getScoreColor, getScoreLevel } from '../utils';
import { SCORE_COLORS } from '../constants';

interface SuccessViewProps {
  profile: EthosProfile;
  address: string | null;
  onDone: () => void;
  onSignOut?: () => void;
}

export function SuccessView({
  profile,
  address,
  onDone,
  onSignOut,
}: SuccessViewProps) {
  const scoreColor = profile.score !== undefined ? getScoreColor(profile.score) : SCORE_COLORS.reputable;
  const scoreLevel = profile.score !== undefined ? getScoreLevel(profile.score) : '';

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
