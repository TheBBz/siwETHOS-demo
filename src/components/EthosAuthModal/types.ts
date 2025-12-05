/**
 * Type definitions for EthosAuthModal
 */

export type ModalView = 
  | 'provider-select' 
  | 'wallet-select' 
  | 'connecting' 
  | 'signing' 
  | 'verifying' 
  | 'success' 
  | 'error' 
  | 'farcaster-qr'
  | 'discord-loading'
  | 'telegram-loading'
  | 'twitter-loading'
  | 'signing-out';

export interface WalletInfo {
  id: string;
  name: string;
  walletKey: string;
  color: string;
  downloadUrl: string;
  checkInstalled: () => boolean;
}

export interface SocialProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isPhantom?: boolean;
  isZerion?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  providers?: EthereumProvider[];
}

export interface EthosProfile {
  profileId: number;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  score?: number;
  profileUrl?: string | null;
}

export interface EthosAuthResult {
  code: string;
  address: string;
  profile: EthosProfile;
}

export interface PendingOAuth {
  code: string;
  provider: string;
  error?: string;
  errorDescription?: string;
}

export interface EthosAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: EthosAuthResult) => void;
  onSignOut?: () => void;
  pendingOAuth?: PendingOAuth | null;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    phantom?: { ethereum?: EthereumProvider };
  }
}
