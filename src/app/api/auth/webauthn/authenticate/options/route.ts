/**
 * WebAuthn Authentication Options Endpoint
 *
 * POST /api/auth/webauthn/authenticate/options
 *
 * Generates authentication options for signing in with an existing passkey.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAuthenticationChallenge,
  buildAuthenticationOptions,
} from '@thebbz/siwe-ethos-providers';
import { challengeStore, rpConfig } from '@/lib/webauthn-stores';

export async function POST(_request: NextRequest) {
  try {
    // Create challenge (returns StoredChallenge object)
    const storedChallenge = createAuthenticationChallenge(
      undefined, // No specific user - allow any passkey for this RP
      120000 // 2 minutes TTL
    );

    // Store the challenge
    await challengeStore.store(storedChallenge);

    // Build authentication options
    const options = buildAuthenticationOptions({
      rpId: rpConfig.id,
      challenge: storedChallenge.challenge,
      timeout: 120000,
      userVerification: 'preferred',
      allowCredentials: [], // Empty = discoverable credentials
    });

    return NextResponse.json({
      options,
      sessionId: storedChallenge.challenge, // Use challenge as session ID
    });
  } catch (error) {
    console.error('WebAuthn authenticate options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}
