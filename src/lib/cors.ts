/**
 * CORS Helper for WebAuthn API
 *
 * Allows cross-origin requests from the frontend domain.
 */

import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://ethos.thebbz.xyz',
  'https://repcanvas.thebbz.xyz',
  'http://localhost:3000',
  'http://localhost:3001',
];

export function corsHeaders(origin?: string | null): HeadersInit {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export function withCors<T>(response: NextResponse<T>, origin?: string | null): NextResponse<T> {
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsOptionsResponse(origin?: string | null): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
