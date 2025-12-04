/**
 * Redis Storage Adapter
 *
 * Standard Redis storage using ioredis.
 * Ideal for self-hosted deployments with Docker.
 */

import Redis from 'ioredis';
import type { StorageAdapter } from './types';

export class RedisAdapter implements StorageAdapter {
  private client: Redis;

  constructor(url?: string) {
    const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const keys = await this.client.keys(pattern);
    return keys;
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
