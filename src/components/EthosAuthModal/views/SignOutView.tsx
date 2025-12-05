'use client';

/**
 * Sign Out View
 * 
 * Shows a graceful sign out animation
 */

import { useEffect, useState } from 'react';

interface SignOutViewProps {
  onComplete: () => void;
}

export function SignOutView({ onComplete }: SignOutViewProps) {
  const [stage, setStage] = useState<'clearing' | 'securing' | 'done'>('clearing');

  useEffect(() => {
    // Animate through stages
    const timer1 = setTimeout(() => setStage('securing'), 800);
    const timer2 = setTimeout(() => setStage('done'), 1600);
    const timer3 = setTimeout(() => onComplete(), 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  const getMessage = () => {
    switch (stage) {
      case 'clearing':
        return 'Clearing session...';
      case 'securing':
        return 'Securing sign out...';
      case 'done':
        return 'Signed out successfully';
    }
  };

  return (
    <div className="text-center py-6">
      {/* Animated icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {stage !== 'done' ? (
            // Lock animation
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
              <svg 
                className={`w-8 h-8 text-primary transition-all duration-500 ${
                  stage === 'securing' ? 'scale-110' : 'scale-100'
                }`}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                {stage === 'clearing' ? (
                  // Unlocked
                  <path d="M7 11V7a5 5 0 0 1 9.9-1M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                ) : (
                  // Locked
                  <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4" />
                )}
              </svg>
              
              {/* Spinning ring */}
              <svg 
                className="absolute inset-0 w-16 h-16 animate-spin"
                style={{ animationDuration: '2s' }}
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="40 140"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
                    <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ) : (
            // Success checkmark
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-success animate-in zoom-in duration-300">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" className="animate-in slide-in-from-left duration-300" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Status message */}
      <p className={`text-sm font-medium transition-all duration-300 ${
        stage === 'done' ? 'text-success' : 'text-text-secondary'
      }`}>
        {getMessage()}
      </p>

      {/* Progress dots */}
      {stage !== 'done' && (
        <div className="flex justify-center gap-1 mt-4">
          <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            stage === 'clearing' ? 'bg-primary' : 'bg-white/20'
          }`} />
          <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            stage === 'securing' ? 'bg-primary' : 'bg-white/20'
          }`} />
          <span className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      )}
    </div>
  );
}
