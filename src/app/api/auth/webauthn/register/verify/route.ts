/**
 * WebAuthn Registration Verification Endpoint
 *
 * POST /api/auth/webauthn/register/verify
 *
 * Verifies registration credential and stores it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistration, RegistrationVerificationResult } from '@thebbz/siwe-ethos-providers';
import { challengeStore, credentialStore, rpConfig } from '@/lib/webauthn-stores';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, userId, username, ethosProfile } = body;

    console.log('WebAuthn register verify request:', {
      hasCredential: !!credential,
      hasUserId: !!userId,
      hasAuthenticatorData: !!credential?.response?.authenticatorData,
      hasPublicKey: !!credential?.response?.publicKey,
      publicKeyAlgorithm: credential?.response?.publicKeyAlgorithm,
    });

    if (!credential || !userId) {
      return NextResponse.json(
        { error: 'Credential and userId are required' },
        { status: 400 }
      );
    }

    // Get the stored challenge using the challenge from clientDataJSON
    // The credential contains the challenge in its response
    const clientDataJSON = JSON.parse(
      Buffer.from(credential.response.clientDataJSON, 'base64').toString('utf-8')
    );
    const challenge = clientDataJSON.challenge;

    // Consume the challenge from the store
    const storedChallenge = await challengeStore.consume(challenge);

    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    // Build config object
    const config = {
      rpId: rpConfig.id,
      rpName: rpConfig.name,
      origin: rpConfig.origin,
    };

    // Verify the registration with correct signature: (credential, challenge, config)
    const result = await verifyRegistration(credential, storedChallenge, config);

    if (!result.verified || !('credential' in result)) {
      const errorResult = result as { error?: string };
      return NextResponse.json(
        { error: errorResult.error || 'Verification failed' },
        { status: 400 }
      );
    }

    // Type assertion after verification
    const verifiedResult = result as RegistrationVerificationResult;

    // Store the credential linked to Ethos profile
    // The verified result.credential already has the required fields
    // Override the userId to link it to our Ethos profile
    const credentialToStore = {
      ...verifiedResult.credential,
      userId,
      transports: credential.response.transports || verifiedResult.credential.transports || [],
    };
    await credentialStore.create(credentialToStore);

    return NextResponse.json({
      verified: true,
      message: 'Passkey registered successfully',
      credentialId: verifiedResult.credential.credentialId,
      // Return the linked profile info
      linkedProfile: ethosProfile || {
        profileId: userId.replace('ethos_', ''),
        username: username,
      },
    });
  } catch (error) {
    console.error('WebAuthn register verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    );
  }
}
