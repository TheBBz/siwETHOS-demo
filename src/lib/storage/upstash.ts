/**
 * Upstash Redis Storage Adapter
 *
 * Serverless-friendly Redis storage using Upstash.
 * Ideal for Vercel and other edge deployments.
 */

import { Redis } from '@upstash/redis';
import type { StorageAdapter } from './types';

export class UpstashAdapter implements StorageAdapter {
  private client: Redis;

  constructor(url?: string, token?: string) {
    const redisUrl = url || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = token || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      throw new Error(
        'Upstash Redis credentials not found. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }

    this.client = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.client.get<T>(key);
    return value;
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { ex: ttlSeconds });
    } else {
      await this.client.set(key, value);
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
    // Upstash client doesn't need explicit closing
  }
}
