/**
 * Telegram Auth Verification API
 * 
 * Verifies Telegram Login Widget data and returns auth code.
 * This is used by the inline widget flow (no redirect).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { SignJWT } from 'jose';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ETHOS_API_URL = 'https://api.ethos.network';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

interface EthosProfile {
  id: number;
  username: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  score: { value: number };
  status: string;
  attestations?: { service: string; account: string }[];
  links?: { profile?: string };
}

export async function POST(request: NextRequest) {
  try {
    const authData: TelegramAuthData = await request.json();

    // Verify the auth data
    if (!verifyTelegramAuth(authData)) {
      return NextResponse.json(
        { error: 'invalid_auth', error_description: 'Invalid Telegram authentication data' },
        { status: 400 }
      );
    }

    // Check auth_date is not too old (allow 1 day)
    const authDate = parseInt(authData.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return NextResponse.json(
        { error: 'auth_expired', error_description: 'Telegram authentication has expired' },
        { status: 400 }
      );
    }

    // Look up Ethos profile by Telegram
    const ethosProfile = await lookupEthosProfile('telegram', authData.id, authData.username);

    if (!ethosProfile) {
      return NextResponse.json(
        { 
          error: 'no_ethos_profile', 
          error_description: 'No Ethos profile linked to this Telegram account. Please link your Telegram at ethos.network first.' 
        },
        { status: 404 }
      );
    }

    // Generate JWT access token
    const name = [authData.first_name, authData.last_name].filter(Boolean).join(' ');
    const profileUrl = ethosProfile.links?.profile || `https://app.ethos.network/profile/telegram/${ethosProfile.username || ethosProfile.id}`;
    
    // Use Ethos profile avatar if available, fallback to Telegram photo
    const avatarUrl = ethosProfile.avatarUrl || authData.photo_url || null;
    const displayName = ethosProfile.displayName || ethosProfile.username || name;
    
    const accessToken = await new SignJWT({
      sub: `ethos:${ethosProfile.id}`,
      name: displayName,
      picture: avatarUrl,
      ethos_profile_id: ethosProfile.id,
      ethos_username: ethosProfile.username,
      ethos_score: ethosProfile.score.value,
      ethos_status: ethosProfile.status,
      auth_method: 'telegram',
      social_provider: 'telegram',
      social_id: authData.id,
      profile_url: profileUrl,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Create auth code
    const authCode = Buffer.from(JSON.stringify({
      accessToken,
      expiresIn: 86400,
      user: {
        sub: `ethos:${ethosProfile.id}`,
        name: displayName,
        picture: avatarUrl,
        profileUrl,
        ethosProfileId: ethosProfile.id,
        ethosUsername: ethosProfile.username,
        ethosScore: ethosProfile.score.value,
        ethosStatus: ethosProfile.status,
        ethosAttestations: ethosProfile.attestations?.map(a => `${a.service}:${a.account}`) || [],
        authMethod: 'telegram',
        socialProvider: 'telegram',
        socialId: authData.id,
      }
    })).toString('base64url');

    return NextResponse.json({ code: authCode });

  } catch (error) {
    console.error('Telegram verify error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Telegram Login Widget auth data
 * https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramAuth(authData: TelegramAuthData): boolean {
  if (!TELEGRAM_BOT_TOKEN) return false;

  const { hash, ...data } = authData;
  
  // Create data-check-string
  const checkString = Object.keys(data)
    .filter(key => data[key as keyof typeof data] !== undefined)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('\n');

  // Create secret key from bot token
  const secretKey = createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  
  // Calculate HMAC
  const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');

  return hmac === hash;
}

async function lookupEthosProfile(service: string, accountId: string, username?: string): Promise<EthosProfile | null> {
  try {
    console.log(`Looking up Ethos profile for ${service}:${accountId}${username ? ` (username: ${username})` : ''}`);
    
    let response = await fetch(
      `${ETHOS_API_URL}/api/v2/user/by/${service}/${encodeURIComponent(accountId)}`,
      { 
        cache: 'no-store',
        headers: {
          'X-Ethos-Client': 'signinwithethos@1.1.0',
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
        username: data.username,
        score: { value: data.score || 0 },
        status: data.status || 'ACTIVE',
        attestations: data.attestations,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        links: data.links,
      };
    }

    // If not found by ID and we have a username, try by username
    if (response.status === 404 && username) {
      console.log(`Trying lookup by username: ${username}`);
      response = await fetch(
        `${ETHOS_API_URL}/api/v2/user/by/${service}/${encodeURIComponent(username)}`,
        { 
          cache: 'no-store',
          headers: {
            'X-Ethos-Client': 'signinwithethos@1.1.0',
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
          username: data.username,
          score: { value: data.score || 0 },
          status: data.status || 'ACTIVE',
          attestations: data.attestations,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          links: data.links,
        };
      }
    }

    console.log('No Ethos profile found');
    return null;
  } catch (error) {
    console.error('Ethos lookup error:', error);
    return null;
  }
}
