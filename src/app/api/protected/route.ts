/**
 * Protected API Route Demo
 *
 * Demonstrates authenticated routes.
 * Requires authentication but no minimum score.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decodeJWT } from '@thebbz/siwe-ethos-server';

/**
 * GET /api/protected
 *
 * Returns the authenticated user's information.
 * Requires a valid JWT in the Authorization header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const result = decodeJWT(token);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const payload = result.jwt.payload;

    return NextResponse.json({
      message: 'You are authenticated!',
      user: {
        sub: payload.sub,
        profileId: payload.ethosProfileId,
        username: payload.ethosUsername,
        score: payload.ethosScore,
        level: payload.ethosLevel,
        authMethod: payload.authMethod,
        walletAddress: payload.walletAddress,
        socialProvider: payload.socialProvider,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Protected route error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

/**
 * POST /api/protected
 *
 * Example of posting data to a protected endpoint.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const result = decodeJWT(token);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const payload = result.jwt.payload;
    const body = await request.json().catch(() => ({}));

    return NextResponse.json({
      message: 'Data received and processed',
      user: payload.sub,
      data: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Protected POST error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
