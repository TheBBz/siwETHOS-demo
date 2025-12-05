/**
 * Discord OAuth2 Authorization Endpoint
 * 
 * Redirects user to Discord for authentication.
 * After auth, Discord redirects back to our callback with an authorization code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize';

// Scopes we request from Discord
const DISCORD_SCOPES = ['identify', 'email'].join(' ');

export async function GET(request: NextRequest) {
  // Get redirect_uri and state from query params
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || randomBytes(16).toString('hex');
  const minScore = searchParams.get('min_score');

  if (!redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'redirect_uri is required' },
      { status: 400 }
    );
  }

  if (!DISCORD_CLIENT_ID) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Discord OAuth not configured' },
      { status: 500 }
    );
  }

  // Store state and redirect_uri in a cookie for the callback
  // In production, use a database or Redis for this
  const sessionData = JSON.stringify({
    redirectUri,
    state,
    minScore: minScore ? parseInt(minScore) : undefined,
    provider: 'discord',
    createdAt: Date.now(),
  });

  // Build Discord OAuth URL
  const discordCallbackUrl = new URL('/auth/discord/callback', request.nextUrl.origin).toString();
  
  const discordAuthUrl = new URL(DISCORD_AUTHORIZE_URL);
  discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
  discordAuthUrl.searchParams.set('redirect_uri', discordCallbackUrl);
  discordAuthUrl.searchParams.set('response_type', 'code');
  discordAuthUrl.searchParams.set('scope', DISCORD_SCOPES);
  discordAuthUrl.searchParams.set('state', state);
  discordAuthUrl.searchParams.set('prompt', 'consent');

  // Set session cookie and redirect to Discord
  const response = NextResponse.redirect(discordAuthUrl.toString());
  response.cookies.set('oauth_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
