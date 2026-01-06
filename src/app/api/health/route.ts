/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Used by Docker health checks and load balancers.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ethos-passkey-server',
  });
}
