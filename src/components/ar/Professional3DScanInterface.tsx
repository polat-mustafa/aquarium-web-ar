'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Professional3DScanInterfaceProps {
  isScanning?: boolean;
  progress?: number;
  creatureName?: string;
  onComplete?: () => void;
  showGrid?: boolean;
}

/**
 * Professional 3D Scanning Interface
 * Modern, high-tech visual with blue theme and 3D effects
 * Optimized for performance with GPU-accelerated animations
 */
export const Professional3DScanInterface: React.FC<Professional3DScanInterfaceProps> = ({
  isScanning = true,
  progress = 0,
  creatureName = 'Aquatic Species',
  onComplete,
  showGrid = true,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [scanLines, setScanLines] = useState<Array<{ id: number; offset: number }>>([]);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Animate progress
  useEffect(() => {
    if (progress > displayProgress) {
      const interval = setInterval(() => {
        setDisplayProgress((prev) => Math.min(prev + 1, progress));
      }, 20);
      return () => clearInterval(interval);
    }
  }, [progress, displayProgress]);

  // Generate random scan lines for animation
  useEffect(() => {
    if (!isScanning) return;

    const lines = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      offset: Math.random() * 100,
    }));
    setScanLines(lines);

    const interval = setInterval(() => {
      setScanLines((prev) =>
        prev.map((line) => ({
          ...line,
          offset: (line.offset + 2) % 100,
        }))
      );
    }, 30);

    return () => clearInterval(interval);
  }, [isScanning]);

  // Generate particles effect
  useEffect(() => {
    if (!isScanning) return;

    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: (p.x + Math.random() * 3 - 1.5) % 100,
          y: (p.y - 2) % 100,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isScanning]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-cyan-900/30 to-blue-900/40">
        {/* Animated background grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(34, 211, 238, 0.3) 19px, rgba(34, 211, 238, 0.3) 20px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-center from-transparent via-transparent to-blue-900/20" />
      </div>

      {/* Scanning Container */}
      <div className="relative z-10 flex flex-col items-center gap-8 pointer-events-none">
        {/* 3D Model Placeholder with Blue Styling */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80">
          {/* Outer rotating ring */}
          <div
            className="absolute inset-0 border-2 border-transparent rounded-full"
            style={{
              borderImage: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #0284c7) 1',
              animation: isScanning ? 'spin 8s linear infinite' : 'none',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
            }}
          />

          {/* Middle rotating ring */}
          <div
            className="absolute inset-4 border-2 border-transparent rounded-full"
            style={{
              borderImage: 'linear-gradient(225deg, #0284c7, #06b6d4, #0ea5e9) 1',
              animation: isScanning ? 'spin-reverse 6s linear infinite' : 'none',
              boxShadow: '0 0 30px rgba(2, 132, 199, 0.3)',
            }}
          />

          {/* Inner rotating ring */}
          <div
            className="absolute inset-8 border-2 border-transparent rounded-full"
            style={{
              borderImage: 'linear-gradient(45deg, #0ea5e9, #7c3aed, #06b6d4) 1',
              animation: isScanning ? 'spin 4s linear infinite' : 'none',
              boxShadow: '0 0 20px rgba(15, 165, 233, 0.5)',
            }}
          />

          {/* Center glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center border border-cyan-400/40"
              style={{
                boxShadow: 'inset 0 0 40px rgba(6, 182, 212, 0.3), 0 0 50px rgba(34, 211, 238, 0.2)',
              }}
            >
              {/* Inner content - creature emoji or icon */}
              <div className="text-7xl sm:text-8xl opacity-80 animate-pulse">{getCreatureEmoji(creatureName)}</div>
            </div>
          </div>

          {/* Scan lines */}
          {scanLines.map((line) => (
            <div
              key={line.id}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              style={{
                top: `${line.offset}%`,
                opacity: 0.6,
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
              }}
            />
          ))}

          {/* Particle effect */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-1 h-1 rounded-full bg-cyan-400"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: 0.6,
                boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          ))}
        </div>

        {/* Text Information */}
        <div className="flex flex-col items-center gap-4">
          {/* Creature Name */}
          <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300">
            {creatureName}
          </h2>

          {/* Status Text */}
          <div className="flex items-center gap-2 text-cyan-300 font-medium">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            {isScanning ? '🔍 Scanning Environment...' : '✅ Scan Complete'}
          </div>
        </div>

        {/* Progress Bar */}
        {isScanning && (
          <div className="w-64 sm:w-80">
            {/* Progress container */}
            <div className="relative h-1.5 bg-gradient-to-r from-slate-700/50 to-blue-900/50 rounded-full overflow-hidden border border-cyan-400/30">
              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${displayProgress}%`,
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
                }}
              />
            </div>

            {/* Progress text */}
            <div className="mt-2 text-center text-sm text-cyan-300 font-mono">
              {displayProgress}%
            </div>
          </div>
        )}

        {/* Info Panel - 3D Card Style */}
        <div className="mt-4 w-64 sm:w-80 backdrop-blur-xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-400/30 rounded-2xl p-4 shadow-2xl">
          <div className="space-y-2 text-sm text-cyan-200">
            <div className="flex justify-between items-center">
              <span className="opacity-70">Depth Sensing:</span>
              <span className="font-mono text-cyan-300">
                {isScanning ? '🟢 Active' : '⚪ Ready'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Hand Detection:</span>
              <span className="font-mono text-cyan-300">MediaPipe</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Frame Rate:</span>
              <span className="font-mono text-cyan-300">30+ FPS</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent my-2" />
            <div className="text-xs text-cyan-300/70 text-center">
              Move around to scan the environment
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isScanning && (
          <button
            onClick={onComplete}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Start Interaction
          </button>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Get appropriate emoji for creature
 */
function getCreatureEmoji(creatureName: string): string {
  const name = creatureName.toLowerCase();

  const emojiMap: Record<string, string> = {
    shark: '🦈',
    tuna: '🐟',
    dolphin: '🐬',
    whale: '🐋',
    octopus: '🐙',
    squid: '🦑',
    jellyfish: '🪼',
    turtle: '🐢',
    'sea snake': '🐍',
    crab: '🦀',
    lobster: '🦞',
    shrimp: '🦐',
    fish: '🐠',
    'sea creature': '🌊',
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.includes(key)) {
      return emoji;
    }
  }

  return '🌊';
}

export default Professional3DScanInterface;
