/**
 * Nonce Generation Endpoint
 *
 * Generates a cryptographic nonce for SIWE message signing.
 * This prevents replay attacks by ensuring each auth attempt uses a unique nonce.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from '@thebbz/siwe-ethos-providers';
import { getStorage } from '@/lib/storage';
import { withCors, corsOptionsResponse } from '@/lib/cors';

const NONCE_EXPIRY_SECONDS = 300; // 5 minutes

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get('origin'));
}

export async function GET(request: NextRequest) {
  try {
    // Generate a cryptographically secure nonce
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + NONCE_EXPIRY_SECONDS * 1000).toISOString();

    // Store nonce with expiration
    const storage = getStorage();
    await storage.set(
      `nonce:${nonce}`,
      JSON.stringify({ createdAt: new Date().toISOString(), expiresAt }),
      NONCE_EXPIRY_SECONDS
    );

    return withCors(
      NextResponse.json({ nonce, expiresAt }),
      request.headers.get('origin')
    );
  } catch (error) {
    console.error('[Nonce] Error generating nonce:', error);
    return withCors(
      NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 }),
      request.headers.get('origin')
    );
  }
}
