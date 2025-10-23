'use client';

import { useEffect, useState } from 'react';

interface LensAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

/**
 * Camera lens closing animation effect
 * Creates a circular iris effect that closes like a camera shutter
 */
export default function LensAnimation({ isVisible, onComplete }: LensAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);

      // Animation duration matches CSS transition
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isAnimating && !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Camera shutter flash effect */}
      <div
        className={`absolute inset-0 bg-white transition-opacity duration-150 ${
          isAnimating ? 'opacity-80' : 'opacity-0'
        }`}
        style={{
          animation: isAnimating ? 'flash 0.2s ease-out' : 'none',
        }}
      />

      {/* Circular iris closing effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative transition-all duration-700 ease-in-out ${
            isAnimating ? 'scale-0' : 'scale-[200]'
          }`}
          style={{
            width: '100vmax',
            height: '100vmax',
            borderRadius: '50%',
            border: '100vmax solid rgba(0, 0, 0, 0.95)',
            boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.8)',
          }}
        />
      </div>

      {/* Camera shutter sound effect indicator */}
      {isAnimating && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 animate-ping">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes flash {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
