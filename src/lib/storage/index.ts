/**
 * Storage Module
 *
 * Exports storage adapters and provides a factory function
 * to create the appropriate adapter based on configuration.
 */

import type { StorageAdapter } from './types';
import { MemoryAdapter } from './memory';
import { UpstashAdapter } from './upstash';
import { RedisAdapter } from './redis';

export type { StorageAdapter } from './types';
export { STORAGE_KEYS } from './types';
export { MemoryAdapter } from './memory';
export { UpstashAdapter } from './upstash';
export { RedisAdapter } from './redis';

/**
 * Storage adapter type
 */
export type StorageAdapterType = 'memory' | 'upstash' | 'redis';

/**
 * Create a storage adapter based on environment configuration
 */
export function createStorageAdapter(type?: StorageAdapterType): StorageAdapter {
  const adapterType = type || (process.env.STORAGE_ADAPTER as StorageAdapterType) || 'memory';

  switch (adapterType) {
    case 'upstash':
      return new UpstashAdapter();

    case 'redis':
      return new RedisAdapter();

    case 'memory':
    default:
      console.warn(
        'Using in-memory storage adapter. Data will be lost on restart. ' +
          'Set STORAGE_ADAPTER=upstash or STORAGE_ADAPTER=redis for persistence.'
      );
      return new MemoryAdapter();
  }
}

/**
 * Singleton storage instance
 */
let storageInstance: StorageAdapter | null = null;

/**
 * Get the global storage instance
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = createStorageAdapter();
  }
  return storageInstance;
}

/**
 * Set a custom storage instance (for testing)
 */
export function setStorage(adapter: StorageAdapter): void {
  storageInstance = adapter;
}

/**
 * Reset the storage instance (for testing)
 */
export async function resetStorage(): Promise<void> {
  if (storageInstance) {
    await storageInstance.close();
    storageInstance = null;
  }
}
