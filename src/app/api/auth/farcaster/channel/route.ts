/**
 * Farcaster Channel Creation API
 * 
 * Creates a Sign In with Farcaster channel and returns QR code data
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const nonce = randomBytes(16).toString('hex');
    const domain = request.nextUrl.host;

    // Create Farcaster Sign In channel
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
      console.error('Farcaster channel creation failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to create Farcaster channel' },
        { status: 500 }
      );
    }

    const channel = await channelResponse.json();
    const { channelToken, url } = channel;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    });

    // Store channel info in a cookie for later verification
    const response = NextResponse.json({
      channelToken,
      url,
      qrCodeDataUrl,
    });

    // Store session data
    response.cookies.set('farcaster_session', JSON.stringify({
      channelToken,
      nonce,
      createdAt: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Farcaster channel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
