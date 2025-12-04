/**
 * /userinfo Endpoint
 *
 * Returns authenticated user's profile information.
 * Follows OpenID Connect UserInfo format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Extract bearer token from Authorization header
  const authHeader = request.headers.get('authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  try {
    // Verify and decode the token
    const payload = await verifyAccessToken(token);

    // Return user info in OpenID Connect format
    return NextResponse.json({
      sub: payload.sub,
      name: payload.name,
      picture: payload.picture,

      // Ethos-specific claims
      ethos_profile_id: payload.ethos_profile_id,
      ethos_username: payload.ethos_username,
      ethos_score: payload.ethos_score,
      ethos_status: payload.ethos_status,
      ethos_attestations: payload.ethos_attestations,

      // Authentication info
      auth_method: payload.auth_method,
      wallet_address: payload.wallet_address,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: (error as Error).message },
      { status: 401 }
    );
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request);
}
