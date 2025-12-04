/**
 * Authentication Utilities
 *
 * JWT generation, verification, and auth code management.
 */

import { SignJWT, jwtVerify } from 'jose';
import { getStorage, STORAGE_KEYS } from './storage';
import type { EthosUser } from './ethos';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-in-production'
);
const JWT_ISSUER = process.env.AUTH_SERVER_URL || 'https://ethos.thebbz.xyz';
const JWT_EXPIRY = '1h';

/**
 * Authorization code data
 */
export interface AuthCodeData {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  authMethod: string;
  ethosUser: EthosUser;
  walletAddress?: string;
  createdAt: number;
}

/**
 * State data stored during the authentication flow
 */
export interface AuthStateData {
  clientId: string;
  redirectUri: string;
  scope: string;
  originalState: string;
  authMethod?: string;
  codeVerifier?: string;
  sessionData?: Record<string, unknown>;
  createdAt: number;
}

/**
 * JWT payload for access tokens
 */
export interface AccessTokenPayload {
  sub: string; // Ethos profile ID
  name: string;
  picture: string | null;
  ethos_profile_id: number;
  ethos_username: string | null;
  ethos_score: number;
  ethos_status: string;
  ethos_attestations: string[];
  auth_method: string;
  wallet_address: string;
  client_id: string;
  scope: string;
}

/**
 * Generate a random string for codes and states
 */
export function generateRandomString(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Store state data for the authentication flow
 */
export async function storeAuthState(
  state: string,
  data: AuthStateData
): Promise<void> {
  const storage = getStorage();
  await storage.set(
    `${STORAGE_KEYS.STATE}${state}`,
    data,
    300 // 5 minutes TTL
  );
}

/**
 * Retrieve and delete state data
 */
export async function getAuthState(state: string): Promise<AuthStateData | null> {
  const storage = getStorage();
  const key = `${STORAGE_KEYS.STATE}${state}`;
  const data = await storage.get<AuthStateData>(key);

  if (data) {
    await storage.delete(key);
  }

  return data;
}

/**
 * Generate and store an authorization code
 */
export async function generateAuthCode(data: AuthCodeData): Promise<string> {
  const storage = getStorage();
  const code = generateRandomString(48);

  await storage.set(
    `${STORAGE_KEYS.AUTH_CODE}${code}`,
    data,
    300 // 5 minutes TTL
  );

  return code;
}

/**
 * Retrieve and delete an authorization code
 */
export async function getAuthCode(code: string): Promise<AuthCodeData | null> {
  const storage = getStorage();
  const key = `${STORAGE_KEYS.AUTH_CODE}${code}`;
  const data = await storage.get<AuthCodeData>(key);

  if (data) {
    await storage.delete(key);
  }

  return data;
}

/**
 * Generate an access token JWT
 */
export async function generateAccessToken(
  ethosUser: EthosUser,
  authMethod: string,
  walletAddress: string,
  clientId: string,
  scope: string
): Promise<string> {
  const payload: AccessTokenPayload = {
    sub: `ethos:${ethosUser.profileId}`,
    name: ethosUser.displayName || ethosUser.username || `Profile ${ethosUser.profileId}`,
    picture: ethosUser.avatarUrl,
    ethos_profile_id: ethosUser.profileId,
    ethos_username: ethosUser.username,
    ethos_score: ethosUser.score,
    ethos_status: ethosUser.status,
    ethos_attestations: ethosUser.userkeys || [],
    auth_method: authMethod,
    wallet_address: walletAddress,
    client_id: clientId,
    scope,
  };

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(clientId)
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify an access token JWT
 */
export async function verifyAccessToken(
  token: string,
  clientId?: string
): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: clientId,
    });

    return payload as unknown as AccessTokenPayload;
  } catch (error) {
    throw new Error(`Invalid access token: ${(error as Error).message}`);
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}
