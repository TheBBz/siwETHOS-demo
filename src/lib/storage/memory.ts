/**
 * Memory Storage Adapter
 *
 * In-memory storage for development and testing.
 * Data is lost when the server restarts.
 */

import type { StorageAdapter } from './types';

interface StoredItem<T> {
  value: T;
  expiresAt?: number;
}

export class MemoryAdapter implements StorageAdapter {
  private store: Map<string, StoredItem<unknown>> = new Map();

  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const item: StoredItem<T> = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    };

    this.store.set(key, item);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(pattern: string): Promise<string[]> {
    // Convert simple glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    const matchingKeys: string[] = [];

    // Clean up expired items and collect matching keys
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
        continue;
      }

      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    return matchingKeys;
  }

  async close(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get the number of items in storage (for debugging)
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Clear all items (for testing)
   */
  async clear(): Promise<void> {
    this.store.clear();
  }
}
