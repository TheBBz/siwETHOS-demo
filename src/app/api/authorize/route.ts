/**
 * /authorize Endpoint
 *
 * Initiates the authorization flow.
 * Validates client and redirects to provider selection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRedirectUri, getClient, ensureDemoClient } from '@/lib/clients';
import { generateRandomString, storeAuthState, type AuthStateData } from '@/lib/auth';
import { ensureProvidersInitialized, hasConfiguredProviders } from '@/lib/providers';

export async function GET(request: NextRequest) {
  ensureProvidersInitialized();
  
  // Ensure demo client exists for development
  await ensureDemoClient();

  const searchParams = request.nextUrl.searchParams;

  // Extract authorization parameters
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const scope = searchParams.get('scope') || 'profile';
  const state = searchParams.get('state');

  // Validate required parameters
  if (!clientId) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing client_id parameter' },
      { status: 400 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing redirect_uri parameter' },
      { status: 400 }
    );
  }

  if (responseType !== 'code') {
    return NextResponse.json(
      { error: 'unsupported_response_type', error_description: 'Only response_type=code is supported' },
      { status: 400 }
    );
  }

  // Validate client
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Unknown client_id' },
      { status: 400 }
    );
  }

  // Validate redirect URI
  const isValidRedirect = await validateRedirectUri(clientId, redirectUri);
  if (!isValidRedirect) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid redirect_uri for this client' },
      { status: 400 }
    );
  }

  // Check if any providers are configured
  if (!hasConfiguredProviders()) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'No authentication providers configured' },
      { status: 500 }
    );
  }

  // Generate internal state and store session data
  const internalState = generateRandomString(32);
  const stateData: AuthStateData = {
    clientId,
    redirectUri,
    scope,
    originalState: state || '',
    createdAt: Date.now(),
  };

  await storeAuthState(internalState, stateData);

  // Redirect to wallet connect page
  const connectUrl = new URL('/connect', request.url);
  connectUrl.searchParams.set('state', internalState);
  connectUrl.searchParams.set('redirect_uri', redirectUri);

  return NextResponse.redirect(connectUrl);
}
