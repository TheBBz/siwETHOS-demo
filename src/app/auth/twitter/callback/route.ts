/**
 * Twitter/X OAuth2 Callback Handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// Twitter OAuth2 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWITTER_USER_URL = 'https://api.twitter.com/2/users/me';

// Ethos API
const ETHOS_API_URL = 'https://api.ethos.network';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface EthosProfile {
  id: number;
  profileId: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  score: { value: number };
  status: string;
  attestations?: { service: string; account: string }[];
  links?: { profile?: string };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get session data from cookie
  const sessionCookie = request.cookies.get('oauth_session');
  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'invalid_session', error_description: 'OAuth session not found' },
      { status: 400 }
    );
  }

  let session: {
    redirectUri: string;
    state: string;
    codeVerifier: string;
    minScore?: number;
    provider: string;
  };
  
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    return NextResponse.json(
      { error: 'invalid_session', error_description: 'Invalid session data' },
      { status: 400 }
    );
  }

  // Verify state matches
  if (state !== session.state) {
    return redirectWithError(session.redirectUri, 'invalid_state', 'State mismatch');
  }

  // Handle OAuth errors
  if (error) {
    return redirectWithError(session.redirectUri, error, searchParams.get('error_description') || 'OAuth error');
  }

  if (!code) {
    return redirectWithError(session.redirectUri, 'invalid_request', 'No authorization code');
  }

  try {
    // Step 1: Exchange code for tokens (with PKCE)
    const twitterCallbackUrl = new URL('/auth/twitter/callback', request.nextUrl.origin).toString();
    
    const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: twitterCallbackUrl,
        code_verifier: session.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}));
      console.error('Twitter token error:', error);
      console.error('Token response status:', tokenResponse.status);
      return redirectWithError(session.redirectUri, 'token_error', `Failed to exchange code: ${JSON.stringify(error)}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Twitter tokens received');

    // Step 2: Fetch Twitter user info
    const userResponse = await fetch(`${TWITTER_USER_URL}?user.fields=profile_image_url`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('Twitter user fetch error:', error);
      return redirectWithError(session.redirectUri, 'user_fetch_error', 'Failed to fetch user info');
    }

    const { data: twitterUser }: { data: TwitterUser } = await userResponse.json();
    console.log('Twitter user:', twitterUser);

    // Step 3: Look up Ethos profile by Twitter/X attestation
    // Try by ID first (more reliable), then by username
    const ethosProfile = await lookupEthosProfile('x', twitterUser.id, twitterUser.username);

    if (!ethosProfile) {
      return redirectWithError(
        session.redirectUri, 
        'no_ethos_profile', 
        'No Ethos profile linked to this X/Twitter account. Please link your X account at ethos.network first.'
      );
    }

    // Step 4: Check minimum score
    if (session.minScore !== undefined && ethosProfile.score.value < session.minScore) {
      return redirectWithError(
        session.redirectUri,
        'score_too_low',
        `Your Ethos score (${ethosProfile.score.value}) is below the minimum required (${session.minScore})`
      );
    }

    // Step 5: Generate JWT access token (using Ethos profile data, not Twitter data)
    const accessToken = await new SignJWT({
      sub: `ethos:${ethosProfile.id}`,
      name: ethosProfile.displayName || ethosProfile.username,
      picture: ethosProfile.avatarUrl || null,
      ethos_profile_id: ethosProfile.id,
      ethos_username: ethosProfile.username,
      ethos_score: ethosProfile.score.value,
      ethos_status: ethosProfile.status,
      auth_method: 'twitter',
      social_provider: 'twitter',
      social_id: twitterUser.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Step 6: Redirect back with auth code (using Ethos profile data)
    const profileUrl = `https://app.ethos.network/profile/x/${ethosProfile.username || ethosProfile.id}`;
    const authCode = Buffer.from(JSON.stringify({
      accessToken,
      expiresIn: 86400,
      user: {
        sub: `ethos:${ethosProfile.id}`,
        name: ethosProfile.displayName || ethosProfile.username,
        picture: ethosProfile.avatarUrl || null,
        profileUrl,
        ethosProfileId: ethosProfile.id,
        ethosUsername: ethosProfile.username,
        ethosScore: ethosProfile.score.value,
        ethosStatus: ethosProfile.status,
        ethosAttestations: ethosProfile.attestations?.map(a => `${a.service}:${a.account}`) || [],
        authMethod: 'twitter',
        socialProvider: 'twitter',
        socialId: twitterUser.id,
      }
    })).toString('base64url');

    const redirectUrl = new URL(session.redirectUri);
    redirectUrl.searchParams.set('code', authCode);
    redirectUrl.searchParams.set('state', session.state);

    const response = NextResponse.redirect(redirectUrl.toString());
    response.cookies.delete('oauth_session');
    return response;

  } catch (error) {
    console.error('Twitter callback error:', error);
    return redirectWithError(session.redirectUri, 'server_error', 'Internal server error');
  }
}

/**
 * Look up Ethos profile by social attestation
 * Uses Ethos API v2 endpoint: /api/v2/user/by/{provider}/{identifier}
 */
async function lookupEthosProfile(service: string, accountId: string, username?: string): Promise<EthosProfile | null> {
  try {
    // Map service to Ethos provider name (Twitter uses 'x')
    const provider = service === 'twitter' || service === 'x' ? 'x' : service;
    
    console.log(`Looking up Ethos profile for ${provider}:${accountId} (username: ${username})`);
    
    // Try by ID first
    let response = await fetch(
      `${ETHOS_API_URL}/api/v2/user/by/${provider}/${encodeURIComponent(accountId)}`,
      { 
        cache: 'no-store',
        headers: {
          'X-Ethos-Client': 'signinwithethos@0.1.0',
          'Accept': 'application/json',
        }
      }
    );
    
    console.log(`Ethos lookup by ID response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Ethos profile found:', data.username || data.id);
      return {
        id: data.profileId || data.id,
        profileId: data.profileId || data.id,
        displayName: data.displayName || data.username || '',
        username: data.username,
        avatarUrl: data.avatarUrl || null,
        score: { value: data.score || 0 },
        status: data.status || 'ACTIVE',
        attestations: data.attestations,
        links: data.links,
      };
    }
    
    // If not found by ID and we have a username, try by username
    if (response.status === 404 && username) {
      console.log(`Trying lookup by username: ${username}`);
      response = await fetch(
        `${ETHOS_API_URL}/api/v2/user/by/${provider}/${encodeURIComponent(username)}`,
        { 
          cache: 'no-store',
          headers: {
            'X-Ethos-Client': 'signinwithethos@0.1.0',
            'Accept': 'application/json',
          }
        }
      );
      
      console.log(`Ethos lookup by username response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Ethos profile found by username:', data.username || data.id);
        return {
          id: data.profileId || data.id,
          profileId: data.profileId || data.id,
          displayName: data.displayName || data.username || '',
          username: data.username,
          avatarUrl: data.avatarUrl || null,
          score: { value: data.score || 0 },
          status: data.status || 'ACTIVE',
          attestations: data.attestations,
          links: data.links,
        };
      }
    }
    
    if (response.status === 404) {
      console.log('No Ethos profile found for this X/Twitter account');
    } else {
      const errorText = await response.text();
      console.error(`Ethos API error: ${response.status} - ${errorText}`);
    }
    
    return null;
  } catch (error) {
    console.error('Ethos lookup error:', error);
    return null;
  }
}

function redirectWithError(redirectUri: string, error: string, description: string): NextResponse {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  url.searchParams.set('error_description', description);
  
  const response = NextResponse.redirect(url.toString());
  response.cookies.delete('oauth_session');
  return response;
}
