/**
 * Farcaster Channel Status API
 * 
 * Polls Farcaster relay for sign-in completion and processes the result
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const ETHOS_API_URL = 'https://api.ethos.network';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

interface EthosProfile {
  profileId: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  score: number;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelToken } = body;

    if (!channelToken) {
      return NextResponse.json(
        { error: 'Missing channelToken' },
        { status: 400 }
      );
    }

    // Check channel status with Farcaster relay
    const statusResponse = await fetch('https://relay.farcaster.xyz/v1/channel/status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${channelToken}`,
      },
    });

    if (!statusResponse.ok) {
      console.error('Farcaster status check failed:', statusResponse.status);
      return NextResponse.json(
        { state: 'error', error: 'Failed to check status' },
        { status: 500 }
      );
    }

    const data = await statusResponse.json();

    if (data.state === 'pending') {
      return NextResponse.json({ state: 'pending' });
    }

    if (data.state === 'completed') {
      // Extract user data
      const fid = data.fid;
      const username = data.username;
      const displayName = data.displayName || username;
      const pfpUrl = data.pfpUrl;

      console.log('Farcaster user authenticated:', { fid, username, displayName });

      // Look up Ethos profile
      const ethosProfile = await lookupEthosProfile(fid.toString(), username);

      if (!ethosProfile) {
        return NextResponse.json({
          state: 'completed',
          error: 'no_ethos_profile',
          error_description: 'No Ethos profile linked to this Farcaster account. Please link your Farcaster account at ethos.network first.',
        });
      }

      // Generate JWT access token
      const accessToken = await new SignJWT({
        sub: `ethos:${ethosProfile.profileId}`,
        name: ethosProfile.displayName || ethosProfile.username || displayName,
        picture: ethosProfile.avatarUrl || pfpUrl || null,
        ethos_profile_id: ethosProfile.profileId,
        ethos_username: ethosProfile.username,
        ethos_score: ethosProfile.score,
        ethos_status: ethosProfile.status,
        auth_method: 'farcaster',
        social_provider: 'farcaster',
        social_id: fid.toString(),
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      // Create auth code
      const profileUrl = `https://app.ethos.network/profile/farcaster/${ethosProfile.username || ethosProfile.profileId}`;
      const authCode = Buffer.from(JSON.stringify({
        accessToken,
        expiresIn: 86400,
        user: {
          sub: `ethos:${ethosProfile.profileId}`,
          name: ethosProfile.displayName || ethosProfile.username || displayName,
          picture: ethosProfile.avatarUrl || pfpUrl || null,
          profileUrl,
          ethosProfileId: ethosProfile.profileId,
          ethosUsername: ethosProfile.username,
          ethosScore: ethosProfile.score,
          ethosStatus: ethosProfile.status,
          authMethod: 'farcaster',
          socialProvider: 'farcaster',
          socialId: fid.toString(),
        }
      })).toString('base64url');

      return NextResponse.json({
        state: 'completed',
        code: authCode,
        profile: {
          profileId: ethosProfile.profileId,
          displayName: ethosProfile.displayName || displayName,
          username: ethosProfile.username,
          avatarUrl: ethosProfile.avatarUrl || pfpUrl,
          score: ethosProfile.score,
          profileUrl,
        },
      });
    }

    // Return current state (error/expired)
    return NextResponse.json({ state: data.state });

  } catch (error) {
    console.error('Farcaster status error:', error);
    return NextResponse.json(
      { state: 'error', error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    if (response.ok) {
      const data = await response.json();
      console.log('Ethos profile found:', data.username || data.id);
      return {
        profileId: data.profileId || data.id,
        displayName: data.displayName || data.username || '',
        username: data.username,
        avatarUrl: data.avatarUrl || null,
        score: data.score || 0,
        status: data.status || 'ACTIVE',
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

      if (response.ok) {
        const data = await response.json();
        console.log('Ethos profile found by username:', data.username || data.id);
        return {
          profileId: data.profileId || data.id,
          displayName: data.displayName || data.username || '',
          username: data.username,
          avatarUrl: data.avatarUrl || null,
          score: data.score || 0,
          status: data.status || 'ACTIVE',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error looking up Ethos profile:', error);
    return null;
  }
}
