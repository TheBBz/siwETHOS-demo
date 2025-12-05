/**
 * Twitter/X OAuth2 Authorization Endpoint
 * 
 * Redirects user to Twitter for authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

// Twitter OAuth2 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_AUTHORIZE_URL = 'https://twitter.com/i/oauth2/authorize';

// Scopes we request from Twitter
const TWITTER_SCOPES = ['tweet.read', 'users.read'].join(' ');

export async function GET(request: NextRequest) {
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

  if (!TWITTER_CLIENT_ID) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Twitter OAuth not configured' },
      { status: 500 }
    );
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  // Store session data
  const sessionData = JSON.stringify({
    redirectUri,
    state,
    codeVerifier,
    minScore: minScore ? parseInt(minScore) : undefined,
    provider: 'twitter',
    createdAt: Date.now(),
  });

  // Build Twitter OAuth URL
  const twitterCallbackUrl = new URL('/auth/twitter/callback', request.nextUrl.origin).toString();
  
  const twitterAuthUrl = new URL(TWITTER_AUTHORIZE_URL);
  twitterAuthUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
  twitterAuthUrl.searchParams.set('redirect_uri', twitterCallbackUrl);
  twitterAuthUrl.searchParams.set('response_type', 'code');
  twitterAuthUrl.searchParams.set('scope', TWITTER_SCOPES);
  twitterAuthUrl.searchParams.set('state', state);
  twitterAuthUrl.searchParams.set('code_challenge', codeChallenge);
  twitterAuthUrl.searchParams.set('code_challenge_method', 'S256');

  // Set session cookie and redirect
  const response = NextResponse.redirect(twitterAuthUrl.toString());
  response.cookies.set('oauth_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
