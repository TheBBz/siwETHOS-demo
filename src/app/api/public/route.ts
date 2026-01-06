/**
 * Public/Optional Auth API Route Demo
 *
 * Demonstrates optional authentication - works for both authenticated and anonymous users.
 * Uses decodeJWT to provide user info when available.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decodeJWT } from '@thebbz/siwe-ethos-server';

/**
 * GET /api/public
 *
 * Public endpoint that optionally includes user info if authenticated.
 * Works without authentication but provides personalized data when logged in.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  // Try to decode JWT if present
  let payload = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const result = decodeJWT(token);
      if (result.success) {
        payload = result.jwt.payload;
      }
    } catch {
      // Token invalid, continue as anonymous
    }
  }

  if (payload) {
    // Authenticated response
    return NextResponse.json({
      message: `Hello, ${payload.ethosUsername || 'Ethos User'}!`,
      authenticated: true,
      user: {
        profileId: payload.ethosProfileId,
        username: payload.ethosUsername,
        score: payload.ethosScore,
        level: payload.ethosLevel,
      },
      personalized: true,
      timestamp: new Date().toISOString(),
    });
  }

  // Anonymous response
  return NextResponse.json({
    message: 'Hello, anonymous visitor!',
    authenticated: false,
    user: null,
    personalized: false,
    hint: 'Sign in with Ethos to see personalized content',
    timestamp: new Date().toISOString(),
  });
}
