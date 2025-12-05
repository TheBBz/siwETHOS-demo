'use client';

/**
 * Demo Button Component
 * 
 * Opens the Ethos Auth modal for authentication demo.
 * Handles OAuth callbacks from social providers.
 */

import { useState, useEffect } from 'react';
import { EthosAuthModal, EthosAuthResult } from './EthosAuthModal';

export function DemoButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<EthosAuthResult | null>(null);
  const [pendingOAuth, setPendingOAuth] = useState<{
    code: string;
    provider: string;
  } | null>(null);

  // Check for OAuth callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      // Handle error - open modal and show error
      console.error('OAuth error:', error, params.get('error_description'));
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code && state) {
      // We have an OAuth callback - determine provider from sessionStorage
      const storedProvider = sessionStorage.getItem('oauth_provider');
      
      setPendingOAuth({
        code,
        provider: storedProvider || 'unknown',
      });
      
      // Open modal to show verifying state
      setIsModalOpen(true);
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem('oauth_provider');
    }
  }, []);

  const handleSuccess = (result: EthosAuthResult) => {
    console.log('Auth success:', result);
    setUser(result);
    // Don't clear pendingOAuth here - let the modal stay in success state
    // It will be cleared when the modal closes
  };

  const handleClose = () => {
    setIsModalOpen(false);
    // Clear pendingOAuth only when modal closes
    setPendingOAuth(null);
  };

  const handleSignOut = () => {
    console.log('User signed out');
    setUser(null);
    setPendingOAuth(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary"
      >
        {user?.profile ? `Signed in as ${user.profile.displayName || user.profile.username || 'User'}` : 'Try Demo'}
      </button>

      <EthosAuthModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        onSignOut={handleSignOut}
        pendingOAuth={pendingOAuth}
      />
    </>
  );
}
