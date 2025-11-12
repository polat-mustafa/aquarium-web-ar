'use client';

import React, { useEffect, useState } from 'react';

interface ScreenshotCaptureEffectProps {
  isActive?: boolean;
  duration?: number; // milliseconds
  onComplete?: () => void;
}

/**
 * Professional Screenshot Capture Effect
 * Creates a cinematic capture experience with visual feedback
 * Blue theme with 3D styling
 */
export const ScreenshotCaptureEffect: React.FC<ScreenshotCaptureEffectProps> = ({
  isActive = false,
  duration = 800,
  onComplete,
}) => {
  const [isCapturing, setIsCapturing] = useState(isActive);
  const [capturePhase, setCapturePhase] = useState<'idle' | 'flash' | 'scan' | 'complete'>('idle');

  useEffect(() => {
    if (!isActive) {
      setIsCapturing(false);
      setCapturePhase('idle');
      return;
    }

    setIsCapturing(true);
    setCapturePhase('flash');

    // Flash phase: 100ms
    const flashTimer = setTimeout(() => {
      setCapturePhase('scan');
    }, 100);

    // Scan phase: 400ms
    const scanTimer = setTimeout(() => {
      setCapturePhase('complete');
    }, 500);

    // Complete: 300ms
    const completeTimer = setTimeout(() => {
      setIsCapturing(false);
      setCapturePhase('idle');
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(scanTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, duration, onComplete]);

  if (!isCapturing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* White Flash Effect */}
      {capturePhase === 'flash' && (
        <div
          className="absolute inset-0 bg-white/80 backdrop-blur-sm"
          style={{
            animation: 'fadeOut 0.4s ease-out forwards',
          }}
        />
      )}

      {/* Scan Lines Effect */}
      {capturePhase === 'scan' && (
        <>
          {/* Horizontal scan lines */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`scan-h-${i}`}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                style={{
                  top: `${(i / 20) * 100}%`,
                  animation: `scanLineMove 0.3s ease-in forwards`,
                  animationDelay: `${i * 10}ms`,
                }}
              />
            ))}
          </div>

          {/* Vertical scan lines */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={`scan-v-${i}`}
                className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-400/60 to-transparent"
                style={{
                  left: `${(i / 15) * 100}%`,
                  animation: `scanLineMove 0.3s ease-in forwards`,
                  animationDelay: `${i * 15}ms`,
                }}
              />
            ))}
          </div>

          {/* Center capture indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-32 h-32 border-2 border-cyan-400"
              style={{
                boxShadow: '0 0 30px rgba(34, 211, 238, 0.6), inset 0 0 30px rgba(34, 211, 238, 0.3)',
                animation: 'pulse 0.4s ease-out',
              }}
            />
          </div>
        </>
      )}

      {/* Corner Indicators */}
      {(capturePhase === 'flash' || capturePhase === 'scan') && (
        <>
          {/* Top Left Corner */}
          <div className="absolute top-4 left-4">
            <div
              className="w-12 h-12 border-2 border-l border-t border-cyan-400 rounded-tl-2xl"
              style={{
                animation: 'cornerPulse 0.3s ease-out',
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)',
              }}
            />
          </div>

          {/* Top Right Corner */}
          <div className="absolute top-4 right-4">
            <div
              className="w-12 h-12 border-2 border-r border-t border-blue-400 rounded-tr-2xl"
              style={{
                animation: 'cornerPulse 0.3s ease-out 50ms forwards',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.5)',
              }}
            />
          </div>

          {/* Bottom Left Corner */}
          <div className="absolute bottom-4 left-4">
            <div
              className="w-12 h-12 border-2 border-l border-b border-blue-400 rounded-bl-2xl"
              style={{
                animation: 'cornerPulse 0.3s ease-out 100ms forwards',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.5)',
              }}
            />
          </div>

          {/* Bottom Right Corner */}
          <div className="absolute bottom-4 right-4">
            <div
              className="w-12 h-12 border-2 border-r border-b border-cyan-400 rounded-br-2xl"
              style={{
                animation: 'cornerPulse 0.3s ease-out 150ms forwards',
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)',
              }}
            />
          </div>
        </>
      )}

      {/* Success Checkmark */}
      {capturePhase === 'complete' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-24 h-24"
            style={{
              animation: 'successPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {/* Checkmark circle */}
            <div className="absolute inset-0 border-4 border-cyan-400 rounded-full" />

            {/* Checkmark */}
            <svg
              className="absolute inset-0 w-full h-full text-cyan-400"
              style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: 24,
                  animation: 'drawCheckmark 0.4s ease-out forwards',
                }}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Shutter Sound Effect Indicator */}
      {capturePhase === 'scan' && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-full"
                style={{
                  animation: `soundWave 0.3s ease-out ${i * 100}ms forwards`,
                  boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes fadeOut {
          0% {
            opacity: 0.8;
            backdrop-filter: blur(10px);
          }
          100% {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
        }

        @keyframes scanLineMove {
          0% {
            transform: scaleX(0);
            opacity: 1;
          }
          100% {
            transform: scaleX(1);
            opacity: 0;
          }
        }

        @keyframes cornerPulse {
          0% {
            transform: scale(0.5);
            opacity: 0;
            box-shadow: 0 0 0 rgba(34, 211, 238, 0.6);
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
          }
        }

        @keyframes successPop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes drawCheckmark {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes soundWave {
          0% {
            height: 4px;
            opacity: 0;
          }
          50% {
            height: 16px;
            opacity: 1;
          }
          100% {
            height: 4px;
            opacity: 0;
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ScreenshotCaptureEffect;
