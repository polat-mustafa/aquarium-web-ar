'use client';

import React, { useState, useEffect } from 'react';
import { LoadingOverlay, registerGlobalLoadingState } from './LoadingOverlay';

export { showGlobalLoading, hideGlobalLoading } from './LoadingOverlay';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted and ensure loading is hidden on mount
    setIsMounted(true);
    setIsLoading(false);

    const cleanup = registerGlobalLoadingState((loading: boolean, msg: string = 'Loading...') => {
      setIsLoading(loading);
      setMessage(msg);
    });
    return cleanup;
  }, []);

  // Auto-hide loading after 5 seconds as failsafe
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.log('Auto-hiding loading screen after timeout');
        setIsLoading(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <>
      {children}
      {isMounted && <LoadingOverlay isVisible={isLoading} message={message} />}
    </>
  );
}