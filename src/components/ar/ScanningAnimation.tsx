'use client';

import React, { useEffect, useState } from 'react';

interface ScanningAnimationProps {
  isActive: boolean;
  mode: 'mediapipe' | 'webxr' | 'tensorflow' | 'none';
  obstacleCount: number;
}

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({
  isActive,
  mode,
  obstacleCount
}) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setScanProgress(0);
      return;
    }

    // Scanning line animation
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => (prev + 2) % 100);
    }, 30);

    // Pulse animation
    const pulseInterval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 360);
    }, 50);

    return () => {
      clearInterval(scanInterval);
      clearInterval(pulseInterval);
    };
  }, [isActive]);

  if (!isActive) return null;

  const getModeColor = () => {
    switch (mode) {
      case 'mediapipe':
        return { primary: '#00ff00', secondary: 'rgba(0, 255, 0, 0.3)' };
      case 'webxr':
        return { primary: '#00ffff', secondary: 'rgba(0, 255, 255, 0.3)' };
      case 'tensorflow':
        return { primary: '#ff00ff', secondary: 'rgba(255, 0, 255, 0.3)' };
      default:
        return { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.3)' };
    }
  };

  const colors = getModeColor();
  const pulseOpacity = 0.3 + Math.sin(pulsePhase * (Math.PI / 180)) * 0.2;

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Corner Brackets */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }}>
        {/* Top Left */}
        <path
          d="M 40 20 L 20 20 L 20 40"
          stroke={colors.primary}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Top Right */}
        <path
          d="M calc(100% - 40) 20 L calc(100% - 20) 20 L calc(100% - 20) 40"
          stroke={colors.primary}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Bottom Left */}
        <path
          d="M 40 calc(100% - 20) L 20 calc(100% - 20) L 20 calc(100% - 40)"
          stroke={colors.primary}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Bottom Right */}
        <path
          d="M calc(100% - 40) calc(100% - 20) L calc(100% - 20) calc(100% - 20) L calc(100% - 20) calc(100% - 40)"
          stroke={colors.primary}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Scanning Grid Lines */}
      <div className="absolute inset-0">
        {/* Horizontal scanning line */}
        <div
          className="absolute left-0 right-0 h-0.5 transition-all"
          style={{
            top: `${scanProgress}%`,
            background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
            boxShadow: `0 0 20px ${colors.primary}`
          }}
        />

        {/* Vertical grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${20 + i * 15}%`,
              background: `linear-gradient(180deg, transparent, ${colors.secondary}, transparent)`,
              opacity: pulseOpacity
            }}
          />
        ))}

        {/* Horizontal grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${20 + i * 15}%`,
              background: `linear-gradient(90deg, transparent, ${colors.secondary}, transparent)`,
              opacity: pulseOpacity
            }}
          />
        ))}
      </div>

      {/* Circular Pulse Effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-96 h-96 rounded-full border-2 animate-ping"
          style={{
            borderColor: colors.primary,
            opacity: pulseOpacity * 0.5
          }}
        />
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full border-2"
          style={{
            borderColor: colors.primary,
            opacity: pulseOpacity * 0.3
          }}
        />
      </div>

      {/* Radar Effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-64 h-64 rounded-full"
          style={{
            background: `conic-gradient(from ${scanProgress * 3.6}deg, transparent, ${colors.primary}40, transparent)`,
            animation: 'spin 3s linear infinite'
          }}
        />
      </div>

      {/* Detection Indicators */}
      {obstacleCount > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div
            className="px-4 py-2 rounded-lg backdrop-blur-md animate-pulse"
            style={{
              background: `${colors.secondary}`,
              border: `2px solid ${colors.primary}`,
              boxShadow: `0 0 20px ${colors.primary}40`
            }}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: colors.primary }}
              />
              <span className="text-white text-sm font-bold">
                {mode.toUpperCase()} ACTIVE
              </span>
              <span className="text-white text-xs opacity-70">
                | {obstacleCount} detected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Status Text */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  animation: 'pulse 1s infinite'
                }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  animation: 'pulse 1s infinite 0.2s'
                }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  animation: 'pulse 1s infinite 0.4s'
                }}
              />
            </div>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: colors.primary, textShadow: `0 0 10px ${colors.primary}` }}
            >
              SCANNING ENVIRONMENT
            </span>
          </div>
        </div>
      </div>

      {/* Corner Info */}
      <div className="absolute top-4 left-4">
        <div
          className="px-3 py-2 rounded backdrop-blur-md text-xs font-mono"
          style={{
            background: `${colors.secondary}`,
            border: `1px solid ${colors.primary}`,
            color: colors.primary
          }}
        >
          <div>MODE: {mode.toUpperCase()}</div>
          <div>FPS: 30</div>
          <div>STATUS: ACTIVE</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ScanningAnimation;
