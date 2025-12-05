/**
 * Telegram Login Widget Callback
 * 
 * Receives auth data from Telegram Login Widget, verifies it,
 * looks up Ethos profile, and redirects back to app.
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
  score: { value: number };
  status: string;
  attestations?: { service: string; account: string }[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || '';
  const minScore = searchParams.get('min_score');

  if (!redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'redirect_uri is required' },
      { status: 400 }
    );
  }

  // Extract Telegram auth data from query params
  const authData: TelegramAuthData = {
    id: searchParams.get('id') || '',
    first_name: searchParams.get('first_name') || '',
    last_name: searchParams.get('last_name') || undefined,
    username: searchParams.get('username') || undefined,
    photo_url: searchParams.get('photo_url') || undefined,
    auth_date: searchParams.get('auth_date') || '',
    hash: searchParams.get('hash') || '',
  };

  // Verify the auth data
  if (!verifyTelegramAuth(authData)) {
    return redirectWithError(redirectUri, state, 'invalid_auth', 'Invalid Telegram authentication data');
  }

  // Check auth_date is not too old (allow 1 day)
  const authDate = parseInt(authData.auth_date);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    return redirectWithError(redirectUri, state, 'auth_expired', 'Telegram authentication has expired');
  }

  try {
    // Look up Ethos profile by Telegram
    const ethosProfile = await lookupEthosProfile('telegram', authData.id);

    if (!ethosProfile) {
      return redirectWithError(
        redirectUri,
        state,
        'no_ethos_profile', 
        'No Ethos profile linked to this Telegram account. Please link your Telegram at ethos.network first.'
      );
    }

    // Check minimum score
    const minScoreNum = minScore ? parseInt(minScore) : undefined;
    if (minScoreNum !== undefined && ethosProfile.score.value < minScoreNum) {
      return redirectWithError(
        redirectUri,
        state,
        'score_too_low',
        `Your Ethos score (${ethosProfile.score.value}) is below the minimum required (${minScoreNum})`
      );
    }

    // Generate JWT access token
    const name = [authData.first_name, authData.last_name].filter(Boolean).join(' ');
    const profileUrl = `https://app.ethos.network/profile/telegram/${ethosProfile.username || ethosProfile.id}`;
    
    // Use Ethos profile avatar if available, fallback to Telegram photo
    const avatarUrl = (ethosProfile as { avatar?: string }).avatar || authData.photo_url || null;
    
    const accessToken = await new SignJWT({
      sub: `ethos:${ethosProfile.id}`,
      name: (ethosProfile as { name?: string }).name || name,
      picture: avatarUrl,
      ethos_profile_id: ethosProfile.id,
      ethos_username: ethosProfile.username,
      ethos_score: ethosProfile.score.value,
      ethos_status: ethosProfile.status,
      auth_method: 'telegram',
      social_provider: 'telegram',
      social_id: authData.id,
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
        name: (ethosProfile as { name?: string }).name || name,
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

    // Redirect back to app
    const url = new URL(redirectUri);
    url.searchParams.set('code', authCode);
    if (state) url.searchParams.set('state', state);

    return NextResponse.redirect(url.toString());

  } catch (error) {
    console.error('Telegram callback error:', error);
    return redirectWithError(redirectUri, state, 'server_error', 'Internal server error');
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

async function lookupEthosProfile(service: string, accountId: string): Promise<EthosProfile | null> {
  try {
    const response = await fetch(
      `${ETHOS_API_URL}/api/v1/attestations?service=${service}.org&account=${accountId}`
    );
    
    if (response.ok) {
      const attestations = await response.json();
      if (attestations.length > 0 && attestations[0].profileId) {
        const profileResponse = await fetch(
          `${ETHOS_API_URL}/api/v1/profiles/${attestations[0].profileId}`
        );
        if (profileResponse.ok) {
          return await profileResponse.json();
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Ethos lookup error:', error);
    return null;
  }
}

function redirectWithError(redirectUri: string, state: string, error: string, description: string): NextResponse {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  url.searchParams.set('error_description', description);
  if (state) url.searchParams.set('state', state);
  return NextResponse.redirect(url.toString());
}
