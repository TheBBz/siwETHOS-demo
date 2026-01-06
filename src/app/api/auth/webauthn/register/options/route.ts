/**
 * WebAuthn Registration Options Endpoint
 *
 * POST /api/auth/webauthn/register/options
 *
 * Generates registration options for creating a new passkey.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createRegistrationChallenge,
  buildRegistrationOptions,
  generateUserId,
} from '@thebbz/siwe-ethos-providers';
import { challengeStore, credentialStore, rpConfig } from '@/lib/webauthn-stores';
import { withCors, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const { username, ethosProfileId } = body;

    if (!username || typeof username !== 'string') {
      return withCors(NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      ), origin);
    }

    // Generate a unique user ID (or use ethosProfileId if provided)
    const userId = ethosProfileId ? `ethos_${ethosProfileId}` : generateUserId();

    // Create challenge (returns StoredChallenge object)
    const storedChallenge = createRegistrationChallenge(
      { id: userId, name: username, displayName: username },
      120000 // 2 minutes TTL
    );

    // Store the challenge
    await challengeStore.store(storedChallenge);

    // Get existing credentials for this user (to exclude)
    const existingCredentials = await credentialStore.findByUserId(userId);

    // Build registration options
    const options = buildRegistrationOptions({
      rp: {
        id: rpConfig.id,
        name: rpConfig.name,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      challenge: storedChallenge.challenge,
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        transports: cred.transports,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      timeout: 120000,
    });

    return withCors(NextResponse.json({
      options,
      userId,
    }), origin);
  } catch (error) {
    console.error('WebAuthn register options error:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    ), origin);
  }
}
