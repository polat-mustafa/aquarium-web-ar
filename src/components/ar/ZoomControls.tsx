'use client';

import React from 'react';

interface ZoomControlsProps {
  currentScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  minScale?: number;
  maxScale?: number;
}

/**
 * Desktop zoom controls for fish size
 * Shows +/- buttons to manually control fish scale
 */
export function ZoomControls({
  currentScale,
  onZoomIn,
  onZoomOut,
  minScale = 0.5,
  maxScale = 3.0
}: ZoomControlsProps) {
  const canZoomIn = currentScale < maxScale;
  const canZoomOut = currentScale > minScale;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={`
          w-12 h-12 rounded-full shadow-lg flex items-center justify-center
          text-2xl font-bold transition-all
          ${canZoomIn
            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
            : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
          }
        `}
        title="Zoom In (Make fish bigger)"
      >
        +
      </button>

      {/* Scale Indicator */}
      <div className="w-12 h-8 bg-black/60 rounded-lg flex items-center justify-center text-white text-xs font-mono">
        {(currentScale * 100).toFixed(0)}%
      </div>

      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={`
          w-12 h-12 rounded-full shadow-lg flex items-center justify-center
          text-2xl font-bold transition-all
          ${canZoomOut
            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
            : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
          }
        `}
        title="Zoom Out (Make fish smaller)"
      >
        −
      </button>
    </div>
  );
}
