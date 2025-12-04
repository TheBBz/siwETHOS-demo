/**
 * Error Page
 *
 * Displays authentication errors with helpful messages.
 */

import Link from 'next/link';

interface ErrorPageProps {
  searchParams: Promise<{
    message?: string;
    type?: string;
    provider?: string;
    identifier?: string;
  }>;
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { message, type, provider, identifier } = await searchParams;

  // Determine error content based on type
  let title = 'Authentication Error';
  let description = message || 'An error occurred during authentication.';
  let showEthosLink = false;

  if (type === 'no_profile') {
    title = 'No Ethos Profile Found';
    description = `We couldn't find an Ethos profile linked to your ${provider || 'social'} account${identifier ? ` (@${identifier})` : ''}.`;
    showEthosLink = true;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Content */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>

        {/* Actions */}
        <div className="space-y-3">
          {showEthosLink && (
            <a
              href="https://ethos.network"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
            >
              Create an Ethos Profile
            </a>
          )}

          <Link
            href="/"
            className="block w-full px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Go Back
          </Link>
        </div>

        {/* Help Text */}
        {showEthosLink && (
          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Need help?</strong> Make sure your {provider || 'social'} account is linked to your Ethos profile at{' '}
              <a
                href="https://app.ethos.network/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                app.ethos.network
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
