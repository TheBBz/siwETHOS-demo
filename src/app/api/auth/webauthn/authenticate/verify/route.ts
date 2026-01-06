/**
 * WebAuthn Authentication Verification Endpoint
 *
 * POST /api/auth/webauthn/authenticate/verify
 *
 * Verifies authentication credential and returns linked Ethos profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthentication } from '@thebbz/siwe-ethos-providers';
import { challengeStore, credentialStore, rpConfig } from '@/lib/webauthn-stores';
import { getProfileById } from '@/lib/ethos';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, sessionId } = body;

    if (!credential || !sessionId) {
      return NextResponse.json(
        { error: 'Credential and sessionId are required' },
        { status: 400 }
      );
    }

    // Get the stored credential
    const storedCredential = await credentialStore.findById(credential.id);

    if (!storedCredential) {
      return NextResponse.json(
        { error: 'Credential not found. Please register a passkey first.' },
        { status: 400 }
      );
    }

    // Get the stored challenge using sessionId (which is the challenge)
    const storedChallenge = await challengeStore.consume(sessionId);

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

    console.log('Verifying authentication with:', {
      credentialId: credential.id,
      storedCredentialId: storedCredential.credentialId,
      storedPublicKeyLength: storedCredential.publicKey?.length,
      storedAlgorithm: storedCredential.algorithm,
      challengeType: storedChallenge.type,
    });

    // Verify the authentication with correct signature: (credential, challenge, storedCredential, config)
    const result = await verifyAuthentication(
      credential,
      storedChallenge,
      storedCredential,
      config
    );

    console.log('Verification result:', result);

    if (!result.verified) {
      const errorResult = result as { error?: string; code?: string };
      console.log('Verification failed:', errorResult);
      return NextResponse.json(
        { error: errorResult.error || 'Authentication failed' },
        { status: 400 }
      );
    }

    // Update counter if verification succeeded (newCounter is at top level)
    if ('newCounter' in result) {
      await credentialStore.update(credential.id, {
        counter: result.newCounter,
      });
    }

    // Get the linked Ethos profile ID from userId
    const ethosProfileId = storedCredential.userId.replace('ethos_', '');
    const profileId = parseInt(ethosProfileId) || 0;

    // Fetch the actual Ethos profile
    let ethosProfile;
    try {
      ethosProfile = await getProfileById(profileId);
    } catch (error) {
      console.warn('Failed to fetch Ethos profile, using fallback:', error);
      ethosProfile = null;
    }

    // Create an auth code (base64url encoded JSON)
    const authData = {
      user: {
        ethosProfileId: profileId,
        name: ethosProfile?.displayName || 'Passkey User',
        ethosUsername: ethosProfile?.username || 'passkey_user',
        picture: ethosProfile?.avatarUrl || null,
        ethosScore: ethosProfile?.score ?? 1200,
        profileUrl: ethosProfile?.username
          ? `https://ethos.network/profile/${ethosProfile.username}`
          : null,
        authMethod: 'passkey',
      },
    };

    const code = Buffer.from(JSON.stringify(authData))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return NextResponse.json({
      verified: true,
      code,
      profile: {
        profileId,
        displayName: ethosProfile?.displayName || 'Passkey User',
        username: ethosProfile?.username || 'passkey_user',
        avatarUrl: ethosProfile?.avatarUrl || null,
        score: ethosProfile?.score ?? 1200,
        profileUrl: ethosProfile?.username
          ? `https://ethos.network/profile/${ethosProfile.username}`
          : null,
      },
    });
  } catch (error) {
    console.error('WebAuthn authenticate verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    );
  }
}
