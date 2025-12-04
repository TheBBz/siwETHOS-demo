/**
 * Demo Callback Page
 *
 * Displays the result of a demo authentication flow.
 */

import Link from 'next/link';

interface DemoCallbackProps {
  searchParams: Promise<{
    code?: string;
    state?: string;
    error?: string;
  }>;
}

export default async function DemoCallbackPage({ searchParams }: DemoCallbackProps) {
  const { code, state, error } = await searchParams;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Successful!</h1>
          <p className="text-gray-600">
            You&apos;ve successfully authenticated with Ethos.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Response Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Authorization Code
              </label>
              <code className="block w-full p-3 bg-gray-100 rounded-lg text-sm text-gray-800 break-all">
                {code || 'No code received'}
              </code>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                State
              </label>
              <code className="block w-full p-3 bg-gray-100 rounded-lg text-sm text-gray-800">
                {state || 'No state received'}
              </code>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Next step:</strong> Exchange this code for an access token using the{' '}
              <code className="bg-blue-100 px-1 rounded">/api/token</code> endpoint.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
