'use client';

/**
 * Social Loading View
 * 
 * Shows loading state when verifying OAuth authentication
 */

import { FarcasterIcon, DiscordIcon, TelegramIcon, TwitterIcon, EthosLogo } from '../icons';

type SocialProviderType = 'farcaster' | 'discord' | 'telegram' | 'twitter' | 'social' | 'unknown';

interface SocialLoadingViewProps {
  provider: SocialProviderType | string;
  message?: string;
}

const providerConfig: Record<string, { name: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  farcaster: {
    name: 'Farcaster',
    color: '#855DCD',
    Icon: FarcasterIcon,
  },
  discord: {
    name: 'Discord',
    color: '#5865F2',
    Icon: DiscordIcon,
  },
  telegram: {
    name: 'Telegram',
    color: '#229ED9',
    Icon: TelegramIcon,
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    Icon: TwitterIcon,
  },
};

// Default config for unknown providers
const defaultConfig = {
  name: 'Ethos',
  color: '#6366f1',
  Icon: () => <EthosLogo />,
};

export function SocialLoadingView({ provider, message }: SocialLoadingViewProps) {
  const config = providerConfig[provider] || defaultConfig;
  const { Icon } = config;

  return (
    <div className="text-center py-6">
      {/* Provider icon with spinner */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: config.color }}
        >
          <Icon className="w-10 h-10 text-white" />
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
            stroke={config.color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="100 200"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-text-primary">
        {message || `Connecting to ${config.name}`}
      </h3>
      <p className="text-sm mb-4 text-text-secondary">
        Verifying your Ethos profile...
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-white/5 text-text-secondary border border-white/10">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
        Please wait...
      </div>
    </div>
  );
}
