/**
 * Client Management
 *
 * Client registration and validation for the auth server.
 */

import { getStorage, STORAGE_KEYS } from './storage';

/**
 * Registered client
 */
export interface AuthClient {
  clientId: string;
  clientSecretHash: string;
  name: string;
  redirectUris: string[];
  createdAt: number;
}

/**
 * Hash a client secret using Web Crypto API
 */
async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get a client by ID
 */
export async function getClient(clientId: string): Promise<AuthClient | null> {
  const storage = getStorage();
  return storage.get<AuthClient>(`${STORAGE_KEYS.CLIENT}${clientId}`);
}

/**
 * Validate client credentials
 */
export async function validateClient(
  clientId: string,
  clientSecret: string
): Promise<AuthClient | null> {
  const client = await getClient(clientId);

  if (!client) {
    return null;
  }

  const secretHash = await hashSecret(clientSecret);
  if (client.clientSecretHash !== secretHash) {
    return null;
  }

  return client;
}

/**
 * Check if a URI is a safe localhost redirect (for development)
 */
function isLocalhostUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname.endsWith('.localhost')
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URI is a valid HTTPS URI (for production)
 */
function isSecureUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate redirect URI for a client
 * 
 * Security model:
 * - Demo client: allows any localhost URI (development only)
 * - Other clients: must match registered URIs or patterns
 * - Wildcard patterns supported (e.g., https://*.example.com/callback)
 */
export async function validateRedirectUri(
  clientId: string,
  redirectUri: string
): Promise<boolean> {
  const client = await getClient(clientId);

  if (!client) {
    return false;
  }

  // Basic URI validation
  try {
    new URL(redirectUri);
  } catch {
    return false; // Invalid URL
  }

  // Demo client in development: allow any localhost redirect
  if (clientId === 'demo_client' && isLocalhostUri(redirectUri)) {
    return true;
  }

  // Check if client allows dynamic redirects (wildcard '*' as only URI)
  if (client.redirectUris.length === 1 && client.redirectUris[0] === '*') {
    // Only allow secure URIs or localhost for dynamic redirects
    return isSecureUri(redirectUri) || isLocalhostUri(redirectUri);
  }

  // Check if redirect URI matches any registered URI or pattern
  return client.redirectUris.some((uri) => {
    // Exact match
    if (uri === redirectUri) {
      return true;
    }

    // Handle wildcard subdomains (e.g., https://*.example.com/callback)
    if (uri.includes('*')) {
      const pattern = uri
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars except *
        .replace(/\*/g, '[^/]+'); // * matches any subdomain segment
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(redirectUri);
    }

    return false;
  });
}

/**
 * Register a new client
 */
export async function registerClient(
  name: string,
  redirectUris: string[],
  clientId?: string,
  clientSecret?: string
): Promise<{ clientId: string; clientSecret: string }> {
  const storage = getStorage();

  // Generate client ID and secret if not provided
  const id = clientId || generateClientId();
  const secret = clientSecret || generateClientSecret();
  const secretHash = await hashSecret(secret);

  const client: AuthClient = {
    clientId: id,
    clientSecretHash: secretHash,
    name,
    redirectUris,
    createdAt: Date.now(),
  };

  await storage.set(`${STORAGE_KEYS.CLIENT}${id}`, client);

  return { clientId: id, clientSecret: secret };
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<void> {
  const storage = getStorage();
  await storage.delete(`${STORAGE_KEYS.CLIENT}${clientId}`);
}

/**
 * List all clients
 */
export async function listClients(): Promise<AuthClient[]> {
  const storage = getStorage();
  const keys = await storage.keys(`${STORAGE_KEYS.CLIENT}*`);

  const clients: AuthClient[] = [];
  for (const key of keys) {
    const client = await storage.get<AuthClient>(key);
    if (client) {
      clients.push(client);
    }
  }

  return clients;
}

/**
 * Generate a random client ID
 */
function generateClientId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'ethos_';
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 16; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Generate a random client secret
 */
function generateClientSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'ethos_secret_';
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 32; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Ensure a demo client exists (for development)
 * Demo client allows any localhost redirect URI dynamically
 */
export async function ensureDemoClient(): Promise<void> {
  const demoClientId = 'demo_client';
  
  // Check if demo client already exists
  const existing = await getClient(demoClientId);
  if (existing) {
    return; // Already exists, no need to recreate
  }
  
  // Create demo client - empty redirectUris since we allow any localhost dynamically
  await registerClient(
    'Demo Application',
    [], // No hardcoded URIs needed - localhost is allowed dynamically for demo_client
    demoClientId,
    'demo_secret'
  );
  console.log('Demo client created: demo_client / demo_secret (allows any localhost redirect)');
}
