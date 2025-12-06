/**
 * Ethos API Client
 *
 * Service for interacting with the Ethos Network API.
 * Uses @thebbz/siwe-ethos-providers package with caching layer.
 */

import { getStorage, STORAGE_KEYS } from './storage';
import {
  fetchEthosProfile as fetchProfile,
  getProfileByAddress as getByAddress,
  getProfileByTwitter as getByTwitter,
  getProfileByDiscord as getByDiscord,
  getProfileByFarcaster as getByFarcaster,
  getProfileById as getById,
  getScoreByAddress,
  EthosProfile,
  EthosProfileNotFoundError,
  EthosApiError,
  EthosLookupType,
} from '@thebbz/siwe-ethos-providers';

// Re-export types from the package
export type { EthosProfile as EthosUser, EthosLookupType };
export { EthosProfileNotFoundError, EthosApiError };

const ETHOS_CACHE_TTL = parseInt(process.env.ETHOS_CACHE_TTL || '600', 10); // 10 minutes

/**
 * Generate cache key for an Ethos profile lookup
 */
function getCacheKey(endpoint: string, identifier: string): string {
  return `${STORAGE_KEYS.ETHOS_CACHE}${endpoint}:${identifier}`;
}

/**
 * Fetch an Ethos user profile with caching
 * Uses the package's fetchEthosProfile under the hood
 */
async function fetchEthosProfileWithCache(
  type: EthosLookupType,
  identifier: string
): Promise<EthosProfile> {
  const storage = getStorage();
  const cacheKey = getCacheKey(type, identifier);

  // Check cache first
  const cached = await storage.get<EthosProfile>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from Ethos API using the package
  const profile = await fetchProfile(type, identifier);

  // Cache the result
  await storage.set(cacheKey, profile, ETHOS_CACHE_TTL);

  return profile;
}

/**
 * Get Ethos profile by Twitter/X username
 */
export async function getProfileByTwitter(username: string): Promise<EthosProfile> {
  return fetchEthosProfileWithCache('x', username);
}

/**
 * Get Ethos profile by Discord user ID
 */
export async function getProfileByDiscord(discordId: string): Promise<EthosProfile> {
  return fetchEthosProfileWithCache('discord', discordId);
}

/**
 * Get Ethos profile by Farcaster FID
 */
export async function getProfileByFarcaster(fid: string): Promise<EthosProfile> {
  return fetchEthosProfileWithCache('farcaster', fid);
}

/**
 * Get Ethos profile by Ethereum address
 */
export async function getProfileByAddress(address: string): Promise<EthosProfile> {
  return fetchEthosProfileWithCache('address', address);
}

/**
 * Get Ethos profile by profile ID
 */
export async function getProfileById(profileId: number): Promise<EthosProfile> {
  return fetchEthosProfileWithCache('profile-id', profileId.toString());
}

/**
 * Get Ethos profile by Telegram user ID
 */
export async function getProfileByTelegram(telegramId: string): Promise<EthosProfile> {
  return fetchEthosProfileWithCache('telegram', telegramId);
}

/**
 * Get Ethos profile by endpoint and identifier
 * This is a general function for fetching profiles by various identifiers
 */
export async function getProfileByProvider(
  endpoint: EthosLookupType,
  identifier: string
): Promise<EthosProfile> {
  return fetchEthosProfileWithCache(endpoint, identifier);
}

/**
 * Get score by address (lightweight, no cache)
 * Returns { score, ok, error?, profile? }
 */
export { getScoreByAddress };

/**
 * Direct access to package functions (no caching)
 */
export {
  getByAddress as fetchProfileByAddress,
  getByTwitter as fetchProfileByTwitter,
  getByDiscord as fetchProfileByDiscord,
  getByFarcaster as fetchProfileByFarcaster,
  getById as fetchProfileById,
};

/**
 * Clear cached profile data (for testing or manual refresh)
 */
export async function clearProfileCache(
  endpoint: string,
  identifier: string
): Promise<void> {
  const storage = getStorage();
  const cacheKey = getCacheKey(endpoint, identifier);
  await storage.delete(cacheKey);
}
