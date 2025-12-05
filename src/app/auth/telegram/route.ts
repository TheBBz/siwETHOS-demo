/**
 * Telegram Login Widget Page
 * 
 * Shows the Telegram Login Widget. User clicks to authenticate via Telegram.
 */

import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

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

  if (!TELEGRAM_BOT_USERNAME) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Telegram Login not configured' },
      { status: 500 }
    );
  }

  // Build callback URL with state
  const callbackUrl = new URL('/auth/telegram/callback', request.nextUrl.origin);
  callbackUrl.searchParams.set('redirect_uri', redirectUri);
  callbackUrl.searchParams.set('state', state);
  if (minScore) callbackUrl.searchParams.set('min_score', minScore);

  // Return HTML page with Telegram Login Widget
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in with Telegram - Ethos</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 400px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 500;
    }
    p {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 32px;
      font-size: 14px;
    }
    .telegram-login {
      display: inline-block;
    }
    .back-link {
      margin-top: 24px;
      display: block;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      font-size: 14px;
    }
    .back-link:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sign in with Telegram</h1>
    <p>Connect your Telegram account to sign in with Ethos</p>
    
    <div class="telegram-login">
      <script 
        async 
        src="https://telegram.org/js/telegram-widget.js?22" 
        data-telegram-login="${TELEGRAM_BOT_USERNAME}"
        data-size="large"
        data-radius="12"
        data-auth-url="${callbackUrl.toString()}"
        data-request-access="write"
      ></script>
    </div>
    
    <a href="${redirectUri}?error=cancelled&state=${state}" class="back-link">
      ← Cancel and go back
    </a>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
