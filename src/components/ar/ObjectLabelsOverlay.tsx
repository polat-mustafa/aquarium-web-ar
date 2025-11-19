'use client';

import React from 'react';
import type { ObstacleZone } from '@/utils/depthSensing';

interface ObjectLabelsOverlayProps {
  obstacleZones: ObstacleZone[];
  enabled: boolean;
}

/**
 * Overlay that displays object labels directly on detected objects in AR view
 * Shows labels like "CHAIR", "TABLE", "BOTTLE" on top of detected objects
 */
export function ObjectLabelsOverlay({
  obstacleZones,
  enabled
}: ObjectLabelsOverlayProps) {
  if (!enabled || obstacleZones.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {obstacleZones.map((zone) => {
        // Calculate center position of the object
        const centerX = (zone.x + zone.width / 2) * 100;
        const centerY = (zone.y + zone.height / 2) * 100;

        // Get label (prefer specific label over generic type)
        const label = zone.label || zone.type;

        // Get emoji based on label
        const emoji = getEmojiForLabel(label);

        // Color based on type
        const colorClass =
          zone.type === 'hand' ? 'bg-yellow-500/90' :
          zone.type === 'person' ? 'bg-blue-500/90' :
          'bg-green-500/90';

        // Distance-based size (closer = larger)
        const depth = zone.depth || 2.0;
        const scale = Math.max(0.7, Math.min(1.5, 3 / depth)); // Closer objects = larger labels

        return (
          <div
            key={zone.id}
            className={`absolute ${colorClass} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg border-2 border-white/50 transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transition: 'all 0.2s ease-out'
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">{emoji}</span>
              <span className="uppercase tracking-wide">{label}</span>
            </div>

            {/* Distance indicator */}
            {zone.depth && (
              <div className="text-xs text-white/90 text-center mt-0.5">
                {zone.depth.toFixed(1)}m
              </div>
            )}

            {/* Confidence bar */}
            {zone.confidence && (
              <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                <div
                  className="bg-white rounded-full h-1 transition-all"
                  style={{ width: `${zone.confidence * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get emoji icon for object label
 */
function getEmojiForLabel(label: string): string {
  const lowerLabel = label.toLowerCase();

  // Hand and person
  if (lowerLabel === 'hand') return '🖐️';
  if (lowerLabel === 'person' || lowerLabel === 'face') return '👤';

  // Furniture
  if (lowerLabel.includes('chair')) return '🪑';
  if (lowerLabel.includes('couch') || lowerLabel.includes('sofa')) return '🛋️';
  if (lowerLabel.includes('bed')) return '🛏️';
  if (lowerLabel.includes('table') || lowerLabel.includes('desk')) return '🪑';

  // Electronics
  if (lowerLabel.includes('tv') || lowerLabel.includes('monitor')) return '📺';
  if (lowerLabel.includes('laptop') || lowerLabel.includes('computer')) return '💻';
  if (lowerLabel.includes('phone') || lowerLabel.includes('cell')) return '📱';
  if (lowerLabel.includes('keyboard')) return '⌨️';
  if (lowerLabel.includes('mouse')) return '🖱️';

  // Kitchen
  if (lowerLabel.includes('cup') || lowerLabel.includes('mug')) return '☕';
  if (lowerLabel.includes('bottle')) return '🍾';
  if (lowerLabel.includes('bowl')) return '🥣';
  if (lowerLabel.includes('knife')) return '🔪';
  if (lowerLabel.includes('fork')) return '🍴';
  if (lowerLabel.includes('spoon')) return '🥄';

  // Food
  if (lowerLabel.includes('apple')) return '🍎';
  if (lowerLabel.includes('banana')) return '🍌';
  if (lowerLabel.includes('sandwich')) return '🥪';
  if (lowerLabel.includes('pizza')) return '🍕';
  if (lowerLabel.includes('cake')) return '🎂';

  // Animals
  if (lowerLabel.includes('cat')) return '🐱';
  if (lowerLabel.includes('dog')) return '🐕';
  if (lowerLabel.includes('bird')) return '🐦';

  // Vehicles
  if (lowerLabel.includes('car')) return '🚗';
  if (lowerLabel.includes('bicycle') || lowerLabel.includes('bike')) return '🚲';
  if (lowerLabel.includes('motorcycle')) return '🏍️';
  if (lowerLabel.includes('bus')) return '🚌';

  // Objects
  if (lowerLabel.includes('book')) return '📚';
  if (lowerLabel.includes('clock')) return '🕐';
  if (lowerLabel.includes('vase')) return '🏺';
  if (lowerLabel.includes('scissors')) return '✂️';
  if (lowerLabel.includes('backpack')) return '🎒';
  if (lowerLabel.includes('umbrella')) return '☂️';
  if (lowerLabel.includes('handbag')) return '👜';

  // Sports
  if (lowerLabel.includes('ball')) return '⚽';
  if (lowerLabel.includes('tennis')) return '🎾';
  if (lowerLabel.includes('baseball')) return '⚾';

  // Default
  return '📦';
}
