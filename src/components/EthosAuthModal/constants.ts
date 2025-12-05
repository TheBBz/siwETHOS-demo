/**
 * Constants for EthosAuthModal
 */

import { WalletInfo } from './types';

// Score level colors (Dark Mode - from Ethos app)
export const SCORE_COLORS = {
  untrusted: '#B72B38',     // Red - Level 0
  questionable: '#CC9A1A',  // Amber - Level 1
  neutral: '#C1C0B6',       // Off-White - Level 2
  known: '#8F97DB',         // Slate - Level 3
  established: '#656ECF',   // Light Indigo - Level 4
  reputable: '#4046C2',     // Indigo - Level 5
  exemplary: '#127F31',     // Green - Level 6
  distinguished: '#085922', // Dark Green - Level 7
  revered: '#836DA6',       // Light Purple - Level 8
  renowned: '#7E51B9',      // Deep Purple - Level 9
} as const;

// Wallet definitions
export const WALLETS: WalletInfo[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    walletKey: 'metamask',
    color: '#F6851B',
    downloadUrl: 'https://metamask.io/download/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      if (ethereum.providers?.length) {
        return ethereum.providers.some((p) => p.isMetaMask && !p.isRabby);
      }
      return ethereum.isMetaMask === true && !ethereum.isRabby;
    },
  },
  {
    id: 'rabby',
    name: 'Rabby',
    walletKey: 'rabbywallet',
    color: '#8697FF',
    downloadUrl: 'https://rabby.io/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      return ethereum?.isRabby === true;
    },
  },
  {
    id: 'phantom',
    name: 'Phantom',
    walletKey: 'phantomwallet',
    color: '#AB9FF2',
    downloadUrl: 'https://phantom.app/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return !!window.phantom?.ethereum;
    },
  },
  {
    id: 'zerion',
    name: 'Zerion',
    walletKey: 'zerionwallet',
    color: '#2962EF',
    downloadUrl: 'https://zerion.io/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      return ethereum?.isZerion === true;
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    walletKey: 'coinbasewallet',
    color: '#0052FF',
    downloadUrl: 'https://www.coinbase.com/wallet',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      if (ethereum.providers?.length) {
        return ethereum.providers.some((p) => p.isCoinbaseWallet);
      }
      return ethereum.isCoinbaseWallet === true;
    },
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    walletKey: 'bravewallet',
    color: '#FB542B',
    downloadUrl: 'https://brave.com/wallet/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = window.ethereum;
      return ethereum?.isBraveWallet === true;
    },
  },
];
