/**
 * Debug endpoint to check storage and client state
 */

import { NextResponse } from 'next/server';
import { getClient, ensureDemoClient, listClients } from '@/lib/clients';

export async function GET() {
  // Force create demo client
  console.log('Debug: Creating demo client...');
  await ensureDemoClient();
  console.log('Debug: Demo client created');

  // Get all clients
  const clients = await listClients();
  console.log('Debug: Clients:', clients);

  // Get specific demo client
  const demoClient = await getClient('demo_client');
  console.log('Debug: Demo client:', demoClient);

  return NextResponse.json({
    clientCount: clients.length,
    clients: clients.map(c => ({
      clientId: c.clientId,
      name: c.name,
      redirectUris: c.redirectUris,
    })),
    demoClient: demoClient ? {
      clientId: demoClient.clientId,
      name: demoClient.name,
      redirectUris: demoClient.redirectUris,
    } : null,
  });
}
