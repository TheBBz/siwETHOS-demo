/**
 * Provider Selection Page
 *
 * Now redirects to the wallet connect page for SIWE authentication.
 */

import { redirect } from 'next/navigation';

interface ProvidersPageProps {
  searchParams: Promise<{ state?: string }>;
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const { state } = await searchParams;

  if (!state) {
    redirect('/error?message=Missing+state+parameter');
  }

  // Redirect to wallet connect page
  redirect(`/connect?state=${encodeURIComponent(state)}`);
}
