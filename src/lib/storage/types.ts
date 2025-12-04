/**
 * Storage Adapter Interface
 *
 * Defines the interface for storage backends used by the authentication server.
 * Implementations must provide key-value storage with optional TTL.
 */

export interface StorageAdapter {
  /**
   * Get a value by key
   * @param key - The key to retrieve
   * @returns The value or null if not found
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Set a value with optional TTL
   * @param key - The key to set
   * @param value - The value to store
   * @param ttlSeconds - Optional TTL in seconds
   */
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Delete a key
   * @param key - The key to delete
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a key exists
   * @param key - The key to check
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get all keys matching a pattern
   * @param pattern - The pattern to match (e.g., "auth:*")
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Close the connection (for cleanup)
   */
  close(): Promise<void>;
}

/**
 * Storage key prefixes for different data types
 */
export const STORAGE_KEYS = {
  /** Authorization codes */
  AUTH_CODE: 'auth:code:',
  /** State tokens for CSRF protection */
  STATE: 'auth:state:',
  /** Code verifiers */
  CODE_VERIFIER: 'auth:verifier:',
  /** Session data */
  SESSION: 'auth:session:',
  /** Registered clients */
  CLIENT: 'auth:client:',
  /** Ethos profile cache */
  ETHOS_CACHE: 'ethos:cache:',
  /** SIWE nonces */
  SIWE_NONCE: 'nonce:',
} as const;
