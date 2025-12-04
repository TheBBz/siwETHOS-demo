/**
 * Nonce Generation Endpoint
 *
 * Generates a cryptographic nonce for SIWE message signing.
 * This prevents replay attacks by ensuring each auth attempt uses a unique nonce.
 */

import { NextResponse } from 'next/server';
import { generateNonce } from '@thebbz/siwe-ethos-providers';
import { getStorage } from '@/lib/storage';

const NONCE_EXPIRY_SECONDS = 300; // 5 minutes

export async function GET() {
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

    return NextResponse.json({
      nonce,
      expiresAt,
    });
  } catch (error) {
    console.error('[Nonce] Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
