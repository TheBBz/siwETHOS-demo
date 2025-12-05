/**
 * Farcaster (Sign In With Farcaster) Authorization Endpoint
 * 
 * Creates the Farcaster channel server-side and generates QR code
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || randomBytes(16).toString('hex');
  const minScore = searchParams.get('min_score');

  if (!redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'redirect_uri is required' },
      { status: 400 }
    );
  }

  // Generate nonce for SIWF
  const nonce = randomBytes(16).toString('hex');
  const domain = request.nextUrl.host;
  const callbackUrl = `${request.nextUrl.origin}/auth/farcaster/callback`;

  // Create Farcaster Sign In channel server-side
  let channelToken = '';
  let connectUrl = '';
  let qrCodeDataUrl = '';
  let channelError = '';

  try {
    const channelResponse = await fetch('https://relay.farcaster.xyz/v1/channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siweUri: request.nextUrl.origin,
        domain: domain,
        nonce: nonce,
      })
    });

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      channelError = `Failed to create channel: ${channelResponse.status} ${errorText}`;
    } else {
      const channel = await channelResponse.json();
      channelToken = channel.channelToken;
      connectUrl = channel.url;

      // Generate QR code as data URL
      qrCodeDataUrl = await QRCode.toDataURL(connectUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#ffffff'
        }
      });
    }
  } catch (error) {
    channelError = `Error creating channel: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  // Store session for SIWF
  const sessionData = JSON.stringify({
    redirectUri,
    state,
    minScore: minScore ? parseInt(minScore) : undefined,
    provider: 'farcaster',
    nonce,
    channelToken,
    createdAt: Date.now(),
  });

  // Return HTML page with Farcaster Sign In
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in with Farcaster - Ethos</title>
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
      width: 90%;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 500;
    }
    p {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 24px;
      font-size: 14px;
    }
    .qr-container {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      display: inline-block;
      margin-bottom: 24px;
    }
    .qr-container img {
      display: block;
      width: 200px;
      height: 200px;
    }
    .status {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .status.loading {
      background: rgba(133, 93, 205, 0.2);
      border: 1px solid rgba(133, 93, 205, 0.3);
      color: #c4b5fd;
    }
    .status.error {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .status.success {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #86efac;
    }
    .warpcast-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 24px;
      background: #855DCD;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      margin-bottom: 16px;
    }
    .warpcast-btn:hover {
      background: #7048b8;
      transform: translateY(-1px);
    }
    .warpcast-btn svg {
      width: 22px;
      height: 22px;
    }
    .deeplink-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .deeplink-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.3);
      color: #fff;
      font-size: 11px;
      font-family: monospace;
      margin-top: 8px;
    }
    .deeplink-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
    .back-link {
      display: block;
      margin-top: 20px;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      font-size: 14px;
    }
    .back-link:hover {
      color: rgba(255, 255, 255, 0.8);
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sign in with Farcaster</h1>
    <p>Scan the QR code with Warpcast to sign in</p>
    
    ${channelError ? `
      <div class="status error">${channelError}</div>
    ` : `
      <div class="qr-container">
        <img src="${qrCodeDataUrl}" alt="Scan with Warpcast" />
      </div>
      
      <div id="status" class="status loading">
        <span class="spinner"></span>
        Waiting for approval...
      </div>
      
      <a href="${connectUrl}" class="warpcast-btn" target="_blank">
        <svg viewBox="0 0 1000 1000" fill="none">
          <rect width="1000" height="1000" rx="200" fill="currentColor"/>
          <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" fill="#855DCD"/>
          <path d="M128.889 253.333L182.222 351.111H257.778V253.333H128.889Z" fill="#855DCD"/>
          <path d="M742.222 253.333V351.111H817.778L871.111 253.333H742.222Z" fill="#855DCD"/>
        </svg>
        Open in Warpcast
      </a>
      
      <div class="deeplink-section">
        <span class="deeplink-label">Or copy this link:</span>
        <input type="text" class="deeplink-input" value="${connectUrl}" readonly onclick="this.select()" />
      </div>
    `}
    
    <a href="${redirectUri}?error=cancelled&state=${state}" class="back-link">
      ← Cancel and go back
    </a>
  </div>
  
  ${!channelError ? `
  <script>
    const channelToken = "${channelToken}";
    const callbackUrl = "${callbackUrl}";
    const nonce = "${nonce}";
    let pollInterval = null;
    
    function setStatus(type, message) {
      const status = document.getElementById('status');
      status.className = 'status ' + type;
      status.innerHTML = message;
    }
    
    async function checkChannel() {
      try {
        // Use GET request with Authorization header
        const response = await fetch('https://relay.farcaster.xyz/v1/channel/status', {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Authorization': \`Bearer \${channelToken}\`
          }
        });
        
        if (!response.ok) {
          console.error('Status check failed:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('Channel response:', JSON.stringify(data, null, 2));
        
        // Check for completed state
        if (data.state === 'completed') {
          clearInterval(pollInterval);
          setStatus('success', 'Authenticated! Verifying with Ethos...');
          
          // Extract user data - may be nested in different places
          const fid = data.fid || data.message?.fid;
          const username = data.username || data.body?.username;
          const displayName = data.displayName || data.body?.displayName;
          const pfpUrl = data.pfpUrl || data.body?.pfpUrl;
          const custody = data.custody || data.custodyAddress;
          const message = data.message;
          const signature = data.signature;
          
          console.log('Extracted user data:', { fid, username, displayName });
          
          const callbackResponse = await fetch(callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid,
              username,
              displayName,
              pfpUrl,
              custodyAddress: custody,
              message,
              signature,
              nonce,
            })
          });
          
          const result = await callbackResponse.json();
          console.log('Callback result:', result);
          
          if (result.redirect) {
            window.location.href = result.redirect;
          } else if (result.error) {
            setStatus('error', result.error_description || result.error);
          }
          
        } else if (data.state === 'pending') {
          // Still waiting, continue polling
          console.log('Still pending...');
        } else if (data.state === 'error' || data.state === 'expired') {
          clearInterval(pollInterval);
          setStatus('error', data.state === 'expired' 
            ? 'Session expired. Please refresh to try again.' 
            : 'Sign in was cancelled or failed.');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }
    
    // Start polling immediately
    console.log('Starting to poll with channelToken:', channelToken);
    checkChannel(); // Check immediately
    pollInterval = setInterval(checkChannel, 2000);
    
    // Cleanup
    window.addEventListener('beforeunload', () => {
      if (pollInterval) clearInterval(pollInterval);
    });
  </script>
  ` : ''}
</body>
</html>
  `;

  const response = new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });

  // Set session cookie
  response.cookies.set('oauth_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
