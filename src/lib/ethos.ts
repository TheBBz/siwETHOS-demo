/**
 * Ethos API Client
 *
 * Service for interacting with the Ethos Network API.
 * Includes caching to reduce API calls and improve performance.
 */

import { getStorage, STORAGE_KEYS } from './storage';

const ETHOS_API_URL = process.env.ETHOS_API_URL || 'https://api.ethos.network';
const ETHOS_CLIENT_NAME = process.env.ETHOS_CLIENT_NAME || 'signinwithethos@0.1.0';
const ETHOS_CACHE_TTL = parseInt(process.env.ETHOS_CACHE_TTL || '600', 10); // 10 minutes

/**
 * Ethos user attestation
 */
export interface EthosAttestation {
  id: number;
  hash: string;
  profileId: number;
  service: string;
  account: string;
  createdAt: number;
  extra?: {
    username?: string;
    url?: string;
  };
}

/**
 * Ethos user profile
 */
export interface EthosUser {
  id: number;
  profileId: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  description: string | null;
  score: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MERGED';
  userkeys: string[];
  xpTotal: number;
  xpStreakDays: number;
  influenceFactor: number;
  influenceFactorPercentile: number;
  links?: {
    profile?: string;
    scoreBreakdown?: string;
  };
  stats?: {
    review?: {
      received?: {
        negative: number;
        neutral: number;
        positive: number;
      };
    };
    vouch?: {
      given?: {
        amountWeiTotal: number;
        count: number;
      };
      received?: {
        amountWeiTotal: number;
        count: number;
      };
    };
  };
  attestations?: EthosAttestation[];
}

/**
 * Error thrown when an Ethos profile is not found
 */
export class EthosProfileNotFoundError extends Error {
  constructor(
    public provider: string,
    public identifier: string
  ) {
    super(`No Ethos profile found for ${provider}:${identifier}`);
    this.name = 'EthosProfileNotFoundError';
  }
}

/**
 * Error thrown when the Ethos API returns an error
 */
export class EthosApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'EthosApiError';
  }
}

/**
 * Generate cache key for an Ethos profile lookup
 */
function getCacheKey(endpoint: string, identifier: string): string {
  return `${STORAGE_KEYS.ETHOS_CACHE}${endpoint}:${identifier}`;
}

/**
 * Fetch an Ethos user profile with caching
 */
async function fetchEthosProfile(
  endpoint: string,
  identifier: string
): Promise<EthosUser> {
  const storage = getStorage();
  const cacheKey = getCacheKey(endpoint, identifier);

  // Check cache first
  const cached = await storage.get<EthosUser>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from Ethos API
  const url = `${ETHOS_API_URL}/api/v2/user/by/${endpoint}/${encodeURIComponent(identifier)}`;

  const response = await fetch(url, {
    headers: {
      'X-Ethos-Client': ETHOS_CLIENT_NAME,
      Accept: 'application/json',
    },
  });

  if (response.status === 404) {
    throw new EthosProfileNotFoundError(endpoint, identifier);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new EthosApiError(
      response.status,
      `Ethos API error: ${response.status} - ${errorText}`
    );
  }

  const user = (await response.json()) as EthosUser;

  // Cache the result
  await storage.set(cacheKey, user, ETHOS_CACHE_TTL);

  return user;
}

/**
 * Get Ethos profile by Twitter/X username
 */
export async function getProfileByTwitter(username: string): Promise<EthosUser> {
  return fetchEthosProfile('x', username);
}

/**
 * Get Ethos profile by Discord user ID
 */
export async function getProfileByDiscord(discordId: string): Promise<EthosUser> {
  return fetchEthosProfile('discord', discordId);
}

/**
 * Get Ethos profile by Farcaster FID
 */
export async function getProfileByFarcaster(fid: string): Promise<EthosUser> {
  return fetchEthosProfile('farcaster', fid);
}

/**
 * Get Ethos profile by Ethereum address
 */
export async function getProfileByAddress(address: string): Promise<EthosUser> {
  return fetchEthosProfile('address', address);
}

/**
 * Get Ethos profile by profile ID
 */
export async function getProfileById(profileId: number): Promise<EthosUser> {
  return fetchEthosProfile('profile-id', profileId.toString());
}

/**
 * Get Ethos profile by endpoint and identifier
 * This is a general function for fetching profiles by various identifiers
 */
export async function getProfileByProvider(
  endpoint: string,
  identifier: string
): Promise<EthosUser> {
  return fetchEthosProfile(endpoint, identifier);
}

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
