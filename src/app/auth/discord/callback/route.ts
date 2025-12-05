/**
 * Discord OAuth2 Callback Handler
 * 
 * Receives authorization code from Discord, exchanges it for tokens,
 * fetches user info, links to Ethos profile, and redirects back to app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_USER_URL = 'https://discord.com/api/users/@me';

// Ethos API
const ETHOS_API_URL = 'https://api.ethos.network';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
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

  // Handle OAuth errors from Discord
  if (error) {
    return redirectWithError(session.redirectUri, error, searchParams.get('error_description') || 'OAuth error');
  }

  if (!code) {
    return redirectWithError(session.redirectUri, 'invalid_request', 'No authorization code');
  }

  try {
    // Step 1: Exchange code for tokens
    const discordCallbackUrl = new URL('/auth/discord/callback', request.nextUrl.origin).toString();
    
    const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: discordCallbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}));
      console.error('Discord token error:', error);
      return redirectWithError(session.redirectUri, 'token_error', 'Failed to exchange code');
    }

    const tokens = await tokenResponse.json();

    // Step 2: Fetch Discord user info
    const userResponse = await fetch(DISCORD_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return redirectWithError(session.redirectUri, 'user_fetch_error', 'Failed to fetch user info');
    }

    const discordUser: DiscordUser = await userResponse.json();
    console.log('Discord user:', discordUser);

    // Step 3: Look up Ethos profile by Discord attestation
    // Try both ID and username since Ethos might use either
    const ethosProfile = await lookupEthosProfile('discord', discordUser.id, discordUser.username);

    if (!ethosProfile) {
      return redirectWithError(
        session.redirectUri, 
        'no_ethos_profile', 
        'No Ethos profile linked to this Discord account. Please link your Discord at ethos.network first.'
      );
    }

    // Step 4: Check minimum score if required
    if (session.minScore !== undefined && ethosProfile.score.value < session.minScore) {
      return redirectWithError(
        session.redirectUri,
        'score_too_low',
        `Your Ethos score (${ethosProfile.score.value}) is below the minimum required (${session.minScore})`
      );
    }

    // Step 5: Generate JWT access token
    // Use Ethos profile data (avatar, displayName) instead of Discord data
    const accessToken = await new SignJWT({
      sub: `ethos:${ethosProfile.profileId}`,
      name: ethosProfile.displayName || ethosProfile.username || discordUser.global_name || discordUser.username,
      picture: ethosProfile.avatarUrl,
      ethos_profile_id: ethosProfile.profileId,
      ethos_username: ethosProfile.username,
      ethos_score: ethosProfile.score.value,
      ethos_status: ethosProfile.status,
      auth_method: 'discord',
      social_provider: 'discord',
      social_id: discordUser.id,
      profile_url: ethosProfile.links?.profile || `https://app.ethos.network/profile/discord/${ethosProfile.username || ethosProfile.profileId}`,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Step 6: Redirect back to app with code (app will exchange for token)
    // For simplicity, we'll include the token directly in a short-lived code
    // Use Ethos profile data (avatar, displayName) - this is what the modal displays
    const authCode = Buffer.from(JSON.stringify({
      accessToken,
      expiresIn: 86400,
      user: {
        sub: `ethos:${ethosProfile.profileId}`,
        name: ethosProfile.displayName || ethosProfile.username || discordUser.global_name || discordUser.username,
        picture: ethosProfile.avatarUrl,
        ethosProfileId: ethosProfile.profileId,
        ethosUsername: ethosProfile.username,
        ethosScore: ethosProfile.score.value,
        ethosStatus: ethosProfile.status,
        ethosAttestations: ethosProfile.attestations?.map(a => `${a.service}:${a.account}`) || [],
        authMethod: 'discord',
        socialProvider: 'discord',
        socialId: discordUser.id,
        profileUrl: ethosProfile.links?.profile || `https://app.ethos.network/profile/discord/${ethosProfile.username || ethosProfile.profileId}`,
      }
    })).toString('base64url');

    const redirectUrl = new URL(session.redirectUri);
    redirectUrl.searchParams.set('code', authCode);
    redirectUrl.searchParams.set('state', session.state);

    // Clear session cookie
    const response = NextResponse.redirect(redirectUrl.toString());
    response.cookies.delete('oauth_session');
    return response;

  } catch (error) {
    console.error('Discord callback error:', error);
    return redirectWithError(session.redirectUri, 'server_error', 'Internal server error');
  }
}

/**
 * Look up Ethos profile by social attestation
 * Uses Ethos API v2 endpoint: /api/v2/user/by/{provider}/{identifier}
 */
async function lookupEthosProfile(service: string, accountId: string, username?: string): Promise<EthosProfile | null> {
  try {
    // Map service to Ethos provider name
    const provider = service === 'twitter' ? 'x' : service;
    
    console.log(`Looking up Ethos profile for ${provider}:${accountId} (username: ${username})`);
    
    // Try by Discord ID first
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
      console.log('No Ethos profile found for this Discord account');
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
