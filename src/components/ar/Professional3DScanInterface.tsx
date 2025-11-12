'use client';

import React, { useEffect, useState } from 'react';

interface Professional3DScanInterfaceProps {
  isScanning?: boolean;
  progress?: number;
  creatureName?: string;
  onComplete?: () => void;
  showGrid?: boolean;
}

/**
 * Minimalist Professional Loading Screen
 * Clean, simple, and professional interface
 */
export const Professional3DScanInterface: React.FC<Professional3DScanInterfaceProps> = ({
  isScanning = true,
  progress = 0,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress
  useEffect(() => {
    if (progress > displayProgress) {
      const interval = setInterval(() => {
        setDisplayProgress((prev) => Math.min(prev + 1, progress));
      }, 20);
      return () => clearInterval(interval);
    }
  }, [progress, displayProgress]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900">
      {/* Minimalist Container */}
      <div className="flex flex-col items-center gap-12 pointer-events-none">
        {/* Status Text */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center">
            Initializing Environment
          </h2>
          <p className="text-sm text-slate-400">Setting up AR experience</p>
        </div>

        {/* Simple Progress Bar */}
        <div className="w-72 sm:w-96">
          {/* Progress container */}
          <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
              style={{
                width: `${displayProgress}%`,
              }}
            />
          </div>

          {/* Progress percentage */}
          <div className="mt-4 text-center text-sm text-slate-400 font-mono">
            {displayProgress}%
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 bg-slate-500 rounded-full"
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            className="w-2 h-2 bg-slate-500 rounded-full"
            style={{
              animation: 'pulse 1.5s ease-in-out infinite 0.3s',
            }}
          />
          <div
            className="w-2 h-2 bg-slate-500 rounded-full"
            style={{
              animation: 'pulse 1.5s ease-in-out infinite 0.6s',
            }}
          />
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Professional3DScanInterface;
