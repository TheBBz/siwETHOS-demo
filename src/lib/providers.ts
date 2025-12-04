/**
 * Authentication Methods Registry
 *
 * Manages authentication methods for Sign in with Ethos.
 * Currently focused on wallet-based (SIWE) authentication.
 */

/**
 * Auth method metadata for UI display
 */
interface AuthMethodMetadata {
  id: string;
  name: string;
  icon: string;
  color: string;
  buttonText: string;
}

/**
 * Wallet auth method metadata for UI display
 */
const WALLET_AUTH_METADATA: AuthMethodMetadata = {
  id: 'wallet',
  name: 'Ethereum Wallet',
  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
  </svg>`,
  color: '#1F21B6',
  buttonText: 'Connect Wallet',
};

/**
 * Initialize authentication methods
 */
export function initializeProviders(): void {
  console.log('Wallet-based authentication initialized');
  console.log('  - wallet: ✓ enabled (SIWE)');
}

/**
 * Get auth method metadata for UI display
 * Returns wallet auth metadata
 */
export function getProviderMetadata(): Array<{
  id: string;
  name: string;
  icon: string;
  color: string;
  buttonText: string;
}> {
  return [WALLET_AUTH_METADATA];
}

/**
 * Check if authentication is available
 * Always returns true for wallet-based auth
 */
export function hasConfiguredProviders(): boolean {
  return true;
}

/**
 * Check if wallet authentication is enabled
 */
export function isWalletAuthEnabled(): boolean {
  return true;
}

// Initialize on module load
let initialized = false;

export function ensureProvidersInitialized(): void {
  if (!initialized) {
    initializeProviders();
    initialized = true;
  }
}
