/**
 * Premium API Route Demo
 *
 * Demonstrates score-gated access.
 * Requires authentication AND a minimum Ethos score of 1000.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decodeJWT } from '@thebbz/siwe-ethos-server';

/**
 * GET /api/premium
 *
 * Premium endpoint that requires an Ethos score of at least 1000.
 * Users with lower scores will receive a 403 Forbidden response.
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

    // Check minimum score
    const score = payload.ethosScore ?? 0;
    if (score < 1000) {
      return NextResponse.json(
        {
          error: 'Insufficient score',
          required: 1000,
          current: score,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: 'Welcome to the premium area!',
      premiumContent: {
        user: {
          profileId: payload.ethosProfileId,
          username: payload.ethosUsername,
          score: payload.ethosScore,
          level: payload.ethosLevel,
        },
        benefits: [
          'Access to exclusive features',
          'Priority support',
          'Advanced analytics',
          'Early access to new functionality',
        ],
        unlocked: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Premium route error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
