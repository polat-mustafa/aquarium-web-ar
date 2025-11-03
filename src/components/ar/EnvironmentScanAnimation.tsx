'use client';

import React, { useEffect, useState } from 'react';

interface EnvironmentScanAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

export const EnvironmentScanAnimation: React.FC<EnvironmentScanAnimationProps> = ({
  isActive,
  onComplete,
  duration = 3000
}) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [phase, setPhase] = useState<'initializing' | 'scanning' | 'complete'>('initializing');

  useEffect(() => {
    if (!isActive) {
      setScanProgress(0);
      setPhase('initializing');
      return;
    }

    // Phase 1: Initializing (0-500ms)
    const initTimer = setTimeout(() => {
      setPhase('scanning');
    }, 500);

    // Phase 2: Scanning (500ms - duration-500ms)
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => {
        const newProgress = prev + (100 / ((duration - 1000) / 30));
        if (newProgress >= 100) {
          clearInterval(scanInterval);
          setPhase('complete');
          return 100;
        }
        return newProgress;
      });
    }, 30);

    // Phase 3: Complete (duration-500ms to duration)
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(initTimer);
      clearInterval(scanInterval);
      clearTimeout(completeTimer);
    };
  }, [isActive, duration, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Background overlay with fade */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        style={{
          opacity: phase === 'complete' ? 0 : 1,
          transitionDuration: '500ms'
        }}
      />

      {/* 3D Scanning Grid */}
      <div className="absolute inset-0">
        {/* Horizontal scan bars */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`h-bar-${i}`}
            className="absolute left-0 right-0 h-1"
            style={{
              top: `${i * 10}%`,
              background: `linear-gradient(90deg,
                transparent 0%,
                rgba(0, 255, 255, 0.3) 20%,
                rgba(0, 255, 255, 0.8) 50%,
                rgba(0, 255, 255, 0.3) 80%,
                transparent 100%)`,
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)',
              transform: `scaleX(${scanProgress / 100})`,
              transformOrigin: 'left',
              transition: 'transform 0.3s ease-out',
              opacity: phase === 'scanning' ? 1 : 0
            }}
          />
        ))}

        {/* Vertical scan bars */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`v-bar-${i}`}
            className="absolute top-0 bottom-0 w-1"
            style={{
              left: `${i * 10}%`,
              background: `linear-gradient(180deg,
                transparent 0%,
                rgba(0, 255, 255, 0.3) 20%,
                rgba(0, 255, 255, 0.8) 50%,
                rgba(0, 255, 255, 0.3) 80%,
                transparent 100%)`,
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)',
              transform: `scaleY(${scanProgress / 100})`,
              transformOrigin: 'top',
              transition: 'transform 0.3s ease-out',
              opacity: phase === 'scanning' ? 1 : 0,
              transitionDelay: `${i * 50}ms`
            }}
          />
        ))}

        {/* 3D Depth Bars - Perspective effect */}
        {[...Array(8)].map((_, i) => {
          const depth = i / 8;
          const scale = 0.5 + depth * 0.5;
          return (
            <div
              key={`depth-${i}`}
              className="absolute border-2 border-cyan-400/50 rounded-lg"
              style={{
                left: `${25 - depth * 10}%`,
                right: `${25 - depth * 10}%`,
                top: `${25 - depth * 10}%`,
                bottom: `${25 - depth * 10}%`,
                transform: `scale(${scale}) translateZ(${depth * 100}px)`,
                boxShadow: `0 0 ${30 * scale}px rgba(0, 255, 255, ${0.4 * depth})`,
                opacity: phase === 'scanning' ? depth * 0.8 : 0,
                transition: 'opacity 0.5s ease-out',
                transitionDelay: `${i * 100}ms`
              }}
            />
          );
        })}

        {/* Scanning wave effect */}
        <div
          className="absolute left-0 right-0 h-2"
          style={{
            top: `${scanProgress}%`,
            background: 'linear-gradient(180deg, transparent, rgba(0, 255, 255, 1), transparent)',
            boxShadow: '0 0 40px rgba(0, 255, 255, 1)',
            opacity: phase === 'scanning' ? 1 : 0,
            filter: 'blur(2px)'
          }}
        />
      </div>

      {/* Central scanning indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {phase === 'initializing' && (
          <div className="text-center animate-pulse">
            <div className="text-6xl mb-4">🌊</div>
            <div className="text-cyan-400 text-lg font-bold tracking-wider">
              INITIALIZING...
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="text-center">
            <div className="relative w-32 h-32 mb-6">
              {/* Rotating scanner */}
              <div
                className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"
                style={{ animationDuration: '2s' }}
              />
              <div
                className="absolute inset-2 border-4 border-transparent border-r-cyan-500 rounded-full animate-spin"
                style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
              />
              <div
                className="absolute inset-4 border-4 border-transparent border-b-cyan-600 rounded-full animate-spin"
                style={{ animationDuration: '1s' }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl">📡</div>
              </div>
            </div>

            <div className="text-cyan-400 text-xl font-bold tracking-wider mb-2">
              SCANNING ENVIRONMENT
            </div>
            <div className="text-cyan-300 text-sm font-mono">
              {Math.round(scanProgress)}%
            </div>

            {/* Progress bar */}
            <div className="w-64 h-2 bg-gray-800/50 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all shadow-lg"
                style={{
                  width: `${scanProgress}%`,
                  boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)'
                }}
              />
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="text-center animate-scale-in">
            <div className="text-6xl mb-4">✅</div>
            <div className="text-green-400 text-lg font-bold tracking-wider">
              SCAN COMPLETE
            </div>
          </div>
        )}
      </div>

      {/* Corner indicators */}
      {phase === 'scanning' && (
        <>
          <div className="absolute top-4 left-4 flex items-center space-x-2 text-cyan-400 font-mono text-sm animate-pulse">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            <span>DEPTH: ACTIVE</span>
          </div>
          <div className="absolute top-4 right-4 flex items-center space-x-2 text-cyan-400 font-mono text-sm animate-pulse">
            <span>3D MAPPING</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <div className="absolute bottom-4 left-4 text-cyan-400 font-mono text-xs opacity-70">
            RESOLUTION: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}
          </div>
          <div className="absolute bottom-4 right-4 text-cyan-400 font-mono text-xs opacity-70">
            MODE: AR
          </div>
        </>
      )}

      {/* Particle effects */}
      {phase === 'scanning' && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6,
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.5);
            opacity: 1;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnvironmentScanAnimation;
