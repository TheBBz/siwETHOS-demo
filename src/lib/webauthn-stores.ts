/**
 * WebAuthn Challenge and Credential Stores
 *
 * Production-ready stores using Redis for persistence.
 * Falls back to in-memory stores for development.
 */

import {
  MemoryChallengeStore,
  MemoryCredentialStore,
} from '@thebbz/siwe-ethos-providers';
import type {
  ChallengeStore,
  CredentialStore,
  StoredChallenge,
  StoredCredential,
} from '@thebbz/siwe-ethos-providers';
import Redis from 'ioredis';

// ============================================================================
// Redis Connection
// ============================================================================

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL not set, using in-memory stores (not for production)');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    return redis;
  } catch (error) {
    console.error('Failed to create Redis connection:', error);
    return null;
  }
}

// ============================================================================
// Redis Challenge Store
// ============================================================================

const CHALLENGE_PREFIX = 'webauthn:challenge:';
const CHALLENGE_TTL_SECONDS = 300; // 5 minutes

class RedisChallengeStore implements ChallengeStore {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async store(challenge: StoredChallenge): Promise<void> {
    const key = CHALLENGE_PREFIX + challenge.challenge;
    const ttl = Math.ceil((challenge.expiresAt - Date.now()) / 1000);
    await this.redis.setex(key, ttl > 0 ? ttl : CHALLENGE_TTL_SECONDS, JSON.stringify(challenge));
  }

  async consume(value: string): Promise<StoredChallenge | null> {
    const key = CHALLENGE_PREFIX + value;

    // Get and delete atomically using Lua script
    const luaScript = `
      local value = redis.call('GET', KEYS[1])
      if value then
        redis.call('DEL', KEYS[1])
      end
      return value
    `;

    const result = await this.redis.eval(luaScript, 1, key) as string | null;

    if (!result) {
      return null;
    }

    const challenge = JSON.parse(result) as StoredChallenge;

    // Check if expired
    if (Date.now() > challenge.expiresAt) {
      return null;
    }

    return challenge;
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL-based expiration automatically
  }
}

// ============================================================================
// Redis Credential Store
// ============================================================================

const CREDENTIAL_PREFIX = 'webauthn:credential:';
const CREDENTIAL_USER_PREFIX = 'webauthn:user:credentials:';

class RedisCredentialStore implements CredentialStore {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async create(credential: StoredCredential): Promise<void> {
    const key = CREDENTIAL_PREFIX + credential.credentialId;

    // Check if already exists
    const exists = await this.redis.exists(key);
    if (exists) {
      throw new Error('Credential already exists');
    }

    // Store credential
    await this.redis.set(key, JSON.stringify(credential));

    // Add to user's credential set
    const userKey = CREDENTIAL_USER_PREFIX + credential.userId;
    await this.redis.sadd(userKey, credential.credentialId);
  }

  async findById(credentialId: string): Promise<StoredCredential | null> {
    const key = CREDENTIAL_PREFIX + credentialId;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as StoredCredential;
  }

  async findByUserId(userId: string): Promise<StoredCredential[]> {
    const userKey = CREDENTIAL_USER_PREFIX + userId;
    const credentialIds = await this.redis.smembers(userKey);

    if (credentialIds.length === 0) {
      return [];
    }

    const keys = credentialIds.map((id) => CREDENTIAL_PREFIX + id);
    const results = await this.redis.mget(keys);

    return results
      .filter((r): r is string => r !== null)
      .map((r) => JSON.parse(r) as StoredCredential);
  }

  async update(credentialId: string, updates: Partial<StoredCredential>): Promise<void> {
    const key = CREDENTIAL_PREFIX + credentialId;
    const existing = await this.findById(credentialId);

    if (!existing) {
      throw new Error('Credential not found');
    }

    const updated = { ...existing, ...updates };
    await this.redis.set(key, JSON.stringify(updated));
  }

  async delete(credentialId: string): Promise<void> {
    const credential = await this.findById(credentialId);

    if (credential) {
      const key = CREDENTIAL_PREFIX + credentialId;
      const userKey = CREDENTIAL_USER_PREFIX + credential.userId;

      await this.redis.del(key);
      await this.redis.srem(userKey, credentialId);
    }
  }
}

// ============================================================================
// Store Initialization
// ============================================================================

function createStores(): { challengeStore: ChallengeStore; credentialStore: CredentialStore } {
  const redisClient = getRedis();

  if (redisClient) {
    console.log('Using Redis stores for WebAuthn');
    return {
      challengeStore: new RedisChallengeStore(redisClient),
      credentialStore: new RedisCredentialStore(redisClient),
    };
  }

  console.log('Using in-memory stores for WebAuthn (development only)');
  return {
    challengeStore: new MemoryChallengeStore(),
    credentialStore: new MemoryCredentialStore(),
  };
}

const stores = createStores();

export const challengeStore = stores.challengeStore;
export const credentialStore = stores.credentialStore;

// ============================================================================
// Relying Party Configuration
// ============================================================================

// For cross-subdomain WebAuthn, RP ID must be the parent domain
// Frontend: ethos.thebbz.xyz, Backend: api.thebbz.xyz -> RP ID: thebbz.xyz
export const rpConfig = {
  id: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
  name: process.env.NEXT_PUBLIC_RP_NAME || 'Sign in with Ethos',
  // Accept requests from multiple origins (frontend + backend domains)
  origin: process.env.NEXT_PUBLIC_RP_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'],
};
