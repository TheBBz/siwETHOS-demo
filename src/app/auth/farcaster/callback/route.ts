/**
 * Farcaster SIWF Callback Handler
 * 
 * Handles the callback from Farcaster Sign In flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// Ethos API
const ETHOS_API_URL = 'https://api.ethos.network';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, displayName, pfpUrl } = body;

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

    if (session.provider !== 'farcaster') {
      return NextResponse.json(
        { error: 'invalid_session', error_description: 'Session is not for Farcaster' },
        { status: 400 }
      );
    }

    if (!fid) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing FID' },
        { status: 400 }
      );
    }

    console.log('Farcaster user:', { fid, username, displayName });

    // Look up Ethos profile by FID
    const ethosProfile = await lookupEthosProfile(fid.toString(), username);

    if (!ethosProfile) {
      console.log('No Ethos profile found for this Farcaster account');
      // Redirect with error
      const redirectUrl = new URL(session.redirectUri);
      redirectUrl.searchParams.set('error', 'no_ethos_profile');
      redirectUrl.searchParams.set('error_description', 'No Ethos profile linked to this Farcaster account. Please link your Farcaster account at ethos.network first.');
      redirectUrl.searchParams.set('state', session.state);
      
      const response = NextResponse.json({ redirect: redirectUrl.toString() });
      response.cookies.delete('oauth_session');
      return response;
    }

    // Check minimum score requirement
    if (session.minScore && ethosProfile.score.value < session.minScore) {
      const redirectUrl = new URL(session.redirectUri);
      redirectUrl.searchParams.set('error', 'score_too_low');
      redirectUrl.searchParams.set('error_description', `Ethos score ${ethosProfile.score.value} is below minimum required score of ${session.minScore}`);
      redirectUrl.searchParams.set('state', session.state);
      
      const response = NextResponse.json({ redirect: redirectUrl.toString() });
      response.cookies.delete('oauth_session');
      return response;
    }

    // Generate JWT access token
    const accessToken = await new SignJWT({
      sub: `ethos:${ethosProfile.id}`,
      name: ethosProfile.displayName || ethosProfile.username || displayName,
      picture: ethosProfile.avatarUrl || pfpUrl || null,
      ethos_profile_id: ethosProfile.id,
      ethos_username: ethosProfile.username,
      ethos_score: ethosProfile.score.value,
      ethos_status: ethosProfile.status,
      auth_method: 'farcaster',
      social_provider: 'farcaster',
      social_id: fid.toString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Create auth code with user data
    const profileUrl = `https://app.ethos.network/profile/farcaster/${ethosProfile.username || ethosProfile.id}`;
    const authCode = Buffer.from(JSON.stringify({
      accessToken,
      expiresIn: 86400,
      user: {
        sub: `ethos:${ethosProfile.id}`,
        name: ethosProfile.displayName || ethosProfile.username || displayName,
        picture: ethosProfile.avatarUrl || pfpUrl || null,
        profileUrl,
        ethosProfileId: ethosProfile.id,
        ethosUsername: ethosProfile.username,
        ethosScore: ethosProfile.score.value,
        ethosStatus: ethosProfile.status,
        ethosAttestations: ethosProfile.attestations?.map(a => `${a.service}:${a.account}`) || [],
        authMethod: 'farcaster',
        socialProvider: 'farcaster',
        socialId: fid.toString(),
      }
    })).toString('base64url');

    const redirectUrl = new URL(session.redirectUri);
    redirectUrl.searchParams.set('code', authCode);
    redirectUrl.searchParams.set('state', session.state);

    const response = NextResponse.json({ redirect: redirectUrl.toString() });
    response.cookies.delete('oauth_session');
    return response;

  } catch (error) {
    console.error('Farcaster callback error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Look up Ethos profile by Farcaster FID
 */
async function lookupEthosProfile(fid: string, username?: string): Promise<EthosProfile | null> {
  try {
    console.log(`Looking up Ethos profile for farcaster:${fid} (username: ${username})`);

    // Try by FID first
    let response = await fetch(
      `${ETHOS_API_URL}/api/v2/user/by/farcaster/${encodeURIComponent(fid)}`,
      {
        cache: 'no-store',
        headers: {
          'X-Ethos-Client': 'signinwithethos@0.1.0',
          'Accept': 'application/json',
        }
      }
    );

    console.log(`Ethos lookup by FID response: ${response.status}`);

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

    // If not found by FID and we have a username, try by username
    if (response.status === 404 && username) {
      console.log(`Trying lookup by username: ${username}`);
      response = await fetch(
        `${ETHOS_API_URL}/api/v2/user/by/farcaster/${encodeURIComponent(username)}`,
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

    return null;
  } catch (error) {
    console.error('Error looking up Ethos profile:', error);
    return null;
  }
}
