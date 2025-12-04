'use client';

/**
 * Demo Button Component
 * 
 * Opens the Ethos Auth modal for authentication demo.
 * No page redirects - everything happens in a modal overlay.
 */

import { useState } from 'react';
import { EthosAuthModal, type EthosAuthResult } from './EthosAuthModal';

export function DemoButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (data: EthosAuthResult) => {
    console.log('Auth success:', data);
    // The profile is shown in the modal - no redirect needed!
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary"
      >
        Try Demo
      </button>

      <EthosAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
