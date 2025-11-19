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

        // Format distance
        const distanceText = zone.depth ? ` ${zone.depth.toFixed(1)}m` : '';

        // Color based on type
        const colorClass =
          zone.type === 'hand' ? 'text-yellow-300' :
          zone.type === 'person' ? 'text-blue-300' :
          'text-green-300';

        return (
          <div
            key={zone.id}
            className={`absolute ${colorClass} text-sm font-bold transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap`}
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              textShadow: '1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8), 1px -1px 3px rgba(0,0,0,0.8), -1px 1px 3px rgba(0,0,0,0.8)',
              transition: 'all 0.2s ease-out'
            }}
          >
            {label.charAt(0).toUpperCase() + label.slice(1)}{distanceText}
          </div>
        );
      })}
    </div>
  );
}
