'use client';

/**
 * Telegram Widget View
 * 
 * Embeds the Telegram Login Widget inline in the modal
 */

import { useEffect, useRef, useState } from 'react';

interface TelegramWidgetViewProps {
  botUsername: string;
  onAuth: (user: TelegramUser) => void;
  onCancel: () => void;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramUser) => void;
    };
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export function TelegramWidgetView({
  botUsername,
  onAuth,
  onCancel,
}: TelegramWidgetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    
    // Set up the global callback
    window.onTelegramAuth = (user: TelegramUser) => {
      console.log('Telegram auth callback:', user);
      onAuth(user);
    };

    // Create and inject the Telegram script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    script.onload = () => {
      setLoading(false);
    };

    script.onerror = () => {
      setLoading(false);
      setError('Failed to load Telegram widget');
    };

    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      // Cleanup
      delete window.onTelegramAuth;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [botUsername, onAuth]);

  return (
    <div className="text-center py-2">
      <p className="text-sm text-text-secondary mb-4">
        Click the button below to sign in with Telegram
      </p>

      {/* Telegram Widget Container */}
      <div className="flex justify-center mb-6 min-h-[48px]">
        {loading && !error && (
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span className="text-sm">Loading Telegram...</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}

        <div 
          ref={containerRef} 
          className={loading || error ? 'hidden' : 'flex justify-center'}
        />
      </div>

      {/* Info text */}
      <p className="text-xs text-text-tertiary mt-4 px-4">
        A popup will open to authenticate with Telegram. 
        Make sure popups are allowed for this site.
      </p>

      {/* Back button */}
      <button
        onClick={onCancel}
        className="mt-6 w-full text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
      >
        ← Choose a different method
      </button>
    </div>
  );
}
