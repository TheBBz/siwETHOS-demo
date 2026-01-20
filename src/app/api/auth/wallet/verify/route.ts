/**
 * Wallet Verification Endpoint
 *
 * Verifies a SIWE (Sign-In with Ethereum) signature and authenticates the user
 * if they have an Ethos profile linked to their wallet address.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseSIWEMessage, verifySIWEMessage, isValidEthereumAddress } from '@thebbz/siwe-ethos-providers';
import { getStorage } from '@/lib/storage';
import { getProfileByAddress, EthosProfileNotFoundError } from '@/lib/ethos';
import { generateAuthCode, type AuthCodeData } from '@/lib/auth';
import { withCors, corsOptionsResponse } from '@/lib/cors';

interface VerifyRequestBody {
  message: string;
  signature: string;
  address: string;
  redirect_uri?: string;
  state?: string;
}

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerifyRequestBody;
    const { message, signature, address, redirect_uri, state } = body;

    const origin = request.headers.get('origin');

    // Validate required fields
    if (!message || !signature || !address) {
      return withCors(
        NextResponse.json(
          { error: 'Missing required fields: message, signature, address' },
          { status: 400 }
        ),
        origin
      );
    }

    // Validate address format
    if (!isValidEthereumAddress(address)) {
      return withCors(
        NextResponse.json(
          { error: 'Invalid Ethereum address format' },
          { status: 400 }
        ),
        origin
      );
    }

    // Parse the SIWE message
    const parsedMessage = parseSIWEMessage(message);
    if (!parsedMessage) {
      return withCors(
        NextResponse.json({ error: 'Invalid SIWE message format' }, { status: 400 }),
        origin
      );
    }

    // Verify the nonce exists and hasn't been used
    const storage = getStorage();
    const nonceKey = `nonce:${parsedMessage.nonce}`;
    const nonceData = await storage.get<{ expiresAt: string }>(nonceKey);

    if (!nonceData) {
      return withCors(
        NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 }),
        origin
      );
    }

    // Check nonce expiration
    if (new Date(nonceData.expiresAt) < new Date()) {
      await storage.delete(nonceKey);
      return withCors(
        NextResponse.json({ error: 'Nonce has expired' }, { status: 400 }),
        origin
      );
    }

    // Invalidate the nonce (one-time use)
    await storage.delete(nonceKey);

    // Verify the signature
    const verifyResult = await verifySIWEMessage({
      message,
      signature,
      domain: parsedMessage.domain,
      nonce: parsedMessage.nonce,
    });

    if (!verifyResult.success) {
      return withCors(
        NextResponse.json(
          { error: verifyResult.error || 'Signature verification failed' },
          { status: 400 }
        ),
        origin
      );
    }

    // Check message expiration
    if (parsedMessage.expirationTime) {
      const expirationDate = new Date(parsedMessage.expirationTime);
      if (expirationDate < new Date()) {
        return withCors(
          NextResponse.json({ error: 'SIWE message has expired' }, { status: 400 }),
          origin
        );
      }
    }

    // Look up Ethos profile by wallet address
    let ethosUser;
    try {
      ethosUser = await getProfileByAddress(address);
    } catch (error) {
      if (error instanceof EthosProfileNotFoundError) {
        return withCors(
          NextResponse.json(
            {
              error: 'no_ethos_profile',
              error_description: 'No Ethos profile found for this wallet address. Create a profile at ethos.network',
            },
            { status: 404 }
          ),
          origin
        );
      }
      throw error;
    }

    // Generate authorization code for token exchange
    const authCodeData: AuthCodeData = {
      clientId: 'wallet-auth',
      redirectUri: redirect_uri || '',
      scope: 'profile',
      state: state || '',
      authMethod: 'wallet',
      ethosUser,
      walletAddress: verifyResult.address,
      createdAt: Date.now(),
    };

    const code = await generateAuthCode(authCodeData);

    // Return in the format expected by the SDK
    // The SDK expects access_token format with user object
    return withCors(
      NextResponse.json({
        access_token: code,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          sub: `ethos:${ethosUser.profileId}`,
          name: ethosUser.displayName,
          picture: ethosUser.avatarUrl,
          ethos_profile_id: ethosUser.profileId,
          ethos_username: ethosUser.username,
          ethos_score: ethosUser.score,
          ethos_status: ethosUser.status,
          ethos_attestations: ethosUser.attestations?.map(a => `${a.service}:${a.account}`) || [],
          wallet_address: verifyResult.address,
          profile_url: ethosUser.links?.profile || `https://ethos.network/u/${ethosUser.username || ethosUser.profileId}`,
        },
      }),
      origin
    );
  } catch (error) {
    console.error('[Wallet Verify] Error:', error);
    return withCors(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      request.headers.get('origin')
    );
  }
}
