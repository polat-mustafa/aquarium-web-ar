'use client';

import React, { useState, useEffect } from 'react';

// Global loading state
let globalLoadingState: {
  setLoading: (loading: boolean, message?: string) => void;
} | null = null;

export const showGlobalLoading = (message: string = 'Loading...') => {
  if (globalLoadingState) {
    globalLoadingState.setLoading(true, message);
  }
};

export const hideGlobalLoading = () => {
  if (globalLoadingState) {
    globalLoadingState.setLoading(false);
  }
};

export const registerGlobalLoadingState = (setState: (loading: boolean, message?: string) => void) => {
  globalLoadingState = { setLoading: setState };
  return () => {
    globalLoadingState = null;
  };
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Loading..."
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-xl flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-3xl animate-bounce">🌊</span>
          </div>
          <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl blur opacity-20 animate-pulse"></div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            {message}{dots}
          </h2>
          <p className="text-cyan-200 text-sm">
            Aquarium Experience
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Ripple effect */}
        <div className="relative flex justify-center">
          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
          <div className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute w-4 h-4 bg-cyan-400/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>
    </div>
  );
};

