'use client';

/**
 * Error View
 * 
 * Shows authentication error with retry option
 */

interface ErrorViewProps {
  error: string | null;
  onRetry: () => void;
}

export function ErrorView({
  error,
  onRetry,
}: ErrorViewProps) {
  return (
    <div className="text-center py-6">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-error">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-text-primary">
        Connection Failed
      </h3>
      <p className="text-sm mb-6 text-text-secondary">
        {error || 'Something went wrong'}
      </p>

      <button
        onClick={onRetry}
        className="btn-secondary w-full"
      >
        Try Again
      </button>
    </div>
  );
}
