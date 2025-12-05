/**
 * Social Auth Token Exchange Endpoint
 * 
 * Exchanges the base64-encoded auth code from social OAuth callbacks
 * for a proper token response.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: Record<string, string>;

  // Parse request body
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
  }

  const { grant_type, code } = body;

  // Validate grant type
  if (grant_type !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Only authorization_code grant is supported' },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing code parameter' },
      { status: 400 }
    );
  }

  try {
    // Decode the base64url-encoded auth code
    const decoded = Buffer.from(code, 'base64url').toString('utf-8');
    const authData = JSON.parse(decoded);

    // Validate the auth data structure
    if (!authData.accessToken || !authData.user) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code format' },
        { status: 400 }
      );
    }

    // Return token response
    return NextResponse.json({
      access_token: authData.accessToken,
      token_type: 'Bearer',
      expires_in: authData.expiresIn || 86400,
      user: authData.user,
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
      { status: 400 }
    );
  }
}
