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

interface VerifyRequestBody {
  message: string;
  signature: string;
  address: string;
  redirect_uri?: string;
  state?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerifyRequestBody;
    const { message, signature, address, redirect_uri, state } = body;

    // Validate required fields
    if (!message || !signature || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: message, signature, address' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!isValidEthereumAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Parse the SIWE message
    const parsedMessage = parseSIWEMessage(message);
    if (!parsedMessage) {
      return NextResponse.json(
        { error: 'Invalid SIWE message format' },
        { status: 400 }
      );
    }

    // Verify the nonce exists and hasn't been used
    const storage = getStorage();
    const nonceKey = `nonce:${parsedMessage.nonce}`;
    const nonceData = await storage.get<{ expiresAt: string }>(nonceKey);

    if (!nonceData) {
      return NextResponse.json(
        { error: 'Invalid or expired nonce' },
        { status: 400 }
      );
    }

    // Check nonce expiration
    if (new Date(nonceData.expiresAt) < new Date()) {
      await storage.delete(nonceKey);
      return NextResponse.json(
        { error: 'Nonce has expired' },
        { status: 400 }
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
      return NextResponse.json(
        { error: verifyResult.error || 'Signature verification failed' },
        { status: 400 }
      );
    }

    // Check message expiration
    if (parsedMessage.expirationTime) {
      const expirationDate = new Date(parsedMessage.expirationTime);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'SIWE message has expired' },
          { status: 400 }
        );
      }
    }

    // Look up Ethos profile by wallet address
    let ethosUser;
    try {
      ethosUser = await getProfileByAddress(address);
    } catch (error) {
      if (error instanceof EthosProfileNotFoundError) {
        return NextResponse.json(
          {
            error: 'no_ethos_profile',
            error_description: 'No Ethos profile found for this wallet address. Create a profile at ethos.network',
          },
          { status: 404 }
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

    // Return success with auth code
    return NextResponse.json({
      success: true,
      code,
      address: verifyResult.address,
      profile: {
        profileId: ethosUser.profileId,
        displayName: ethosUser.displayName,
        username: ethosUser.username,
        avatarUrl: ethosUser.avatarUrl,
        score: ethosUser.score,
        // Use the profile URL from the API (already correctly formatted)
        profileUrl: ethosUser.links?.profile || null,
      },
    });
  } catch (error) {
    console.error('[Wallet Verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
