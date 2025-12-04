'use client';

/**
 * useEthosAuth Hook
 * 
 * A simple hook for integrating Ethos authentication into any React app.
 * 
 * Usage:
 * ```tsx
 * const { signIn, isOpen, close } = useEthosAuth({
 *   onSuccess: (data) => console.log('Signed in!', data),
 * });
 * 
 * <button onClick={signIn}>Sign in with Ethos</button>
 * ```
 */

import { useState, useCallback } from 'react';
import { EthosAuthModal, type EthosAuthResult } from './EthosAuthModal';

export interface UseEthosAuthOptions {
  /** Called when authentication succeeds */
  onSuccess?: (data: EthosAuthResult) => void;
  /** Called when the modal is closed */
  onClose?: () => void;
}

export interface UseEthosAuthReturn {
  /** Open the auth modal */
  signIn: () => void;
  /** Close the auth modal */
  close: () => void;
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** The modal component - render this in your app */
  Modal: React.FC;
}

export function useEthosAuth(options: UseEthosAuthOptions = {}): UseEthosAuthReturn {
  const [isOpen, setIsOpen] = useState(false);
  const { onSuccess, onClose: onCloseCallback } = options;

  const signIn = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    onCloseCallback?.();
  }, [onCloseCallback]);

  const handleSuccess = useCallback(
    (data: EthosAuthResult) => {
      onSuccess?.(data);
    },
    [onSuccess]
  );

  const Modal = useCallback(
    () => (
      <EthosAuthModal
        isOpen={isOpen}
        onClose={close}
        onSuccess={handleSuccess}
      />
    ),
    [isOpen, close, handleSuccess]
  );

  return {
    signIn,
    close,
    isOpen,
    Modal,
  };
}

/**
 * SignInWithEthosButton
 * 
 * A pre-built button component for quick integration.
 * 
 * Usage:
 * ```tsx
 * <SignInWithEthosButton onSuccess={(data) => console.log(data)} />
 * ```
 */
export interface SignInWithEthosButtonProps {
  onSuccess?: (data: EthosAuthResult) => void;
  className?: string;
  children?: React.ReactNode;
}

export function SignInWithEthosButton({
  onSuccess,
  className,
  children,
}: SignInWithEthosButtonProps) {
  const { signIn, Modal } = useEthosAuth({
    onSuccess,
  });

  return (
    <>
      <button
        onClick={signIn}
        className={
          className ||
          'inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors'
        }
      >
        {children || (
          <>
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Sign in with Ethos
          </>
        )}
      </button>
      <Modal />
    </>
  );
}
