'use client';

/**
 * Farcaster QR Code View
 * 
 * Shows QR code for Farcaster authentication
 */

import { useState } from 'react';
import Image from 'next/image';
import { FarcasterIcon } from '../icons';

interface FarcasterQRViewProps {
  qrUrl: string | null;
  deepLink: string | null;
}

export function FarcasterQRView({
  qrUrl,
  deepLink,
}: FarcasterQRViewProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (deepLink) {
      navigator.clipboard.writeText(deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="text-center py-2">
      <p className="text-sm text-text-secondary mb-4">
        Scan the QR code with Warpcast
      </p>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        {qrUrl ? (
          <div className="bg-white rounded-2xl p-4">
            <Image src={qrUrl} alt="Scan with Warpcast" width={192} height={192} unoptimized />
          </div>
        ) : (
          <div className="w-56 h-56 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-text-tertiary animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-[#855DCD]/20 text-[#c4b5fd] border border-[#855DCD]/30 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#855DCD] animate-pulse" />
        Waiting for approval...
      </div>

      {/* Open in Warpcast button */}
      {deepLink && (
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium transition-all bg-[#855DCD] hover:bg-[#7048b8] text-white mb-3"
        >
          <FarcasterIcon className="w-5 h-5" />
          Open in Warpcast
        </a>
      )}

      {/* Copy link button */}
      {deepLink && (
        <button
          onClick={copyLink}
          className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy link instead'}
        </button>
      )}
    </div>
  );
}
