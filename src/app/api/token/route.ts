/**
 * Token Endpoint
 *
 * Exchanges authorization code for access token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateClient } from '@/lib/clients';
import { getAuthCode, generateAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let body: Record<string, string>;

  // Parse request body (support both JSON and form-encoded)
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
  }

  const { grant_type, code, redirect_uri, client_id, client_secret } = body;

  // Validate grant type
  if (grant_type !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Only authorization_code grant is supported' },
      { status: 400 }
    );
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing code parameter' },
      { status: 400 }
    );
  }

  if (!client_id || !client_secret) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Missing client credentials' },
      { status: 401 }
    );
  }

  // Validate client credentials
  const client = await validateClient(client_id, client_secret);
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Invalid client credentials' },
      { status: 401 }
    );
  }

  // Retrieve authorization code data
  const authCodeData = await getAuthCode(code);
  if (!authCodeData) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
      { status: 400 }
    );
  }

  // Validate that the code was issued to this client
  if (authCodeData.clientId !== client_id) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code was not issued to this client' },
      { status: 400 }
    );
  }

  // Validate redirect URI matches
  if (redirect_uri && authCodeData.redirectUri !== redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
      { status: 400 }
    );
  }

  // Generate access token
  const accessToken = await generateAccessToken(
    authCodeData.ethosUser,
    authCodeData.authMethod,
    authCodeData.walletAddress || '',
    client_id,
    authCodeData.scope
  );

  // Return token response
  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: authCodeData.scope,
  });
}
