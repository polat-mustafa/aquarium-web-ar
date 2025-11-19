'use client';

import React from 'react';
import type { ObstacleZone } from '@/utils/depthSensing';

interface EnvironmentDebugOverlayProps {
  obstacleZones: ObstacleZone[];
  detectedObjects?: Array<{
    id: string;
    position: [number, number, number];
    dimensions: { width: number; height: number; depth: number };
    volume: number;
    type: 'table' | 'floor' | 'wall' | 'object';
  }>;
  mode: string;
  enabled: boolean;
}

export function EnvironmentDebugOverlay({
  obstacleZones,
  detectedObjects = [],
  mode,
  enabled
}: EnvironmentDebugOverlayProps) {
  if (!enabled) return null;

  // Calculate camera-relative distances for obstacles
  const obstaclesWithDistance = obstacleZones.map(zone => {
    const centerX = zone.x + zone.width / 2;
    const centerY = zone.y + zone.height / 2;

    // Convert normalized coords to 3D position estimate
    const estimatedX = (centerX - 0.5) * 2; // -1 to 1
    const estimatedY = -(centerY - 0.5) * 2; // -1 to 1 (flipped)
    const estimatedZ = -(zone.depth || 2.5); // Forward is negative Z

    // Calculate Euclidean distance from camera (origin)
    const distanceFromCamera = Math.sqrt(
      estimatedX * estimatedX +
      estimatedY * estimatedY +
      estimatedZ * estimatedZ
    );

    return {
      ...zone,
      distanceFromCamera,
      estimatedPosition: { x: estimatedX, y: estimatedY, z: estimatedZ }
    };
  });

  // Calculate distances for detected objects
  const objectsWithDistance = detectedObjects.map(obj => {
    const distanceFromCamera = Math.sqrt(
      obj.position[0] ** 2 +
      obj.position[1] ** 2 +
      obj.position[2] ** 2
    );

    return {
      ...obj,
      distanceFromCamera
    };
  });

  // Sort by distance (closest first)
  const sortedObstacles = [...obstaclesWithDistance].sort((a, b) =>
    a.distanceFromCamera - b.distanceFromCamera
  );
  const sortedObjects = [...objectsWithDistance].sort((a, b) =>
    a.distanceFromCamera - b.distanceFromCamera
  );

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg max-w-md text-xs font-mono max-h-[80vh] overflow-y-auto">
      <div className="mb-3 pb-2 border-b border-white/30">
        <h3 className="font-bold text-sm mb-1">🎯 ENVIRONMENT DEBUG</h3>
        <div className="text-green-400">Mode: {mode.toUpperCase()}</div>
      </div>

      {/* Summary Stats */}
      <div className="mb-3 p-2 bg-blue-500/20 rounded">
        <div className="font-bold mb-1">📊 DETECTION SUMMARY</div>
        <div>Obstacle Zones: {obstacleZones.length}</div>
        <div>Detected Objects: {detectedObjects.length}</div>
        <div>Total Detections: {obstacleZones.length + detectedObjects.length}</div>
      </div>

      {/* Obstacle Zones (MediaPipe/TensorFlow hands) */}
      {sortedObstacles.length > 0 && (
        <div className="mb-3">
          <div className="font-bold mb-2 text-yellow-400">🖐️ OBSTACLE ZONES ({sortedObstacles.length})</div>
          {sortedObstacles.map((zone, idx) => (
            <div key={zone.id} className="mb-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
              <div className="font-bold text-yellow-300">
                #{idx + 1}: {zone.label?.toUpperCase() || zone.type.toUpperCase()}
              </div>
              {zone.label && zone.label !== zone.type && (
                <div className="text-xs text-yellow-200">
                  Type: {zone.type}
                </div>
              )}

              {/* Distance from Camera */}
              <div className="mt-1 text-green-300">
                📏 Distance: <span className="font-bold">{zone.distanceFromCamera.toFixed(2)}m</span>
              </div>

              {/* Depth */}
              <div className="text-blue-300">
                📊 Depth: <span className="font-bold">{(zone.depth || 0).toFixed(2)}m</span>
              </div>

              {/* 3D Position */}
              <div className="text-purple-300">
                📍 Position (est):
              </div>
              <div className="ml-4 text-gray-300">
                X: {zone.estimatedPosition.x.toFixed(2)}m<br/>
                Y: {zone.estimatedPosition.y.toFixed(2)}m<br/>
                Z: {zone.estimatedPosition.z.toFixed(2)}m
              </div>

              {/* Screen Position */}
              <div className="text-cyan-300 mt-1">
                🖥️ Screen Position:
              </div>
              <div className="ml-4 text-gray-300">
                X: {(zone.x * 100).toFixed(1)}% → {((zone.x + zone.width) * 100).toFixed(1)}%<br/>
                Y: {(zone.y * 100).toFixed(1)}% → {((zone.y + zone.height) * 100).toFixed(1)}%
              </div>

              {/* Size */}
              <div className="text-orange-300 mt-1">
                📐 Size: {(zone.width * 100).toFixed(1)}% × {(zone.height * 100).toFixed(1)}%
              </div>

              {/* Confidence */}
              <div className="text-pink-300">
                ✨ Confidence: {((zone.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detected Objects (WebXR/MiDaS) */}
      {sortedObjects.length > 0 && (
        <div className="mb-3">
          <div className="font-bold mb-2 text-cyan-400">🌐 DETECTED OBJECTS ({sortedObjects.length})</div>
          {sortedObjects.map((obj, idx) => (
            <div key={obj.id} className="mb-2 p-2 bg-cyan-500/10 rounded border border-cyan-500/30">
              <div className="font-bold text-cyan-300">
                #{idx + 1}: {obj.type.toUpperCase()}
              </div>

              {/* Distance from Camera */}
              <div className="mt-1 text-green-300">
                📏 Distance: <span className="font-bold">{obj.distanceFromCamera.toFixed(2)}m</span>
              </div>

              {/* 3D Position */}
              <div className="text-purple-300">
                📍 3D Position:
              </div>
              <div className="ml-4 text-gray-300">
                X: {obj.position[0].toFixed(2)}m<br/>
                Y: {obj.position[1].toFixed(2)}m<br/>
                Z: {obj.position[2].toFixed(2)}m
              </div>

              {/* Dimensions */}
              <div className="text-orange-300 mt-1">
                📐 Dimensions (WxHxD):
              </div>
              <div className="ml-4 text-gray-300">
                {(obj.dimensions.width * 100).toFixed(0)} × {(obj.dimensions.height * 100).toFixed(0)} × {(obj.dimensions.depth * 100).toFixed(0)} cm
              </div>

              {/* Volume */}
              <div className="text-pink-300">
                📦 Volume: {obj.volume.toFixed(2)}m³
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Detections */}
      {obstacleZones.length === 0 && detectedObjects.length === 0 && (
        <div className="text-gray-400 text-center py-4">
          No environment detections yet.<br/>
          {mode === 'mediapipe' && 'Show your hands to camera.'}
          {mode === 'tensorflow' && 'Show your hands to camera.'}
          {mode === 'webxr' && 'Move camera to detect surfaces.'}
          {mode === 'midas' && 'Processing depth map...'}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-3 pt-2 border-t border-white/30 text-gray-400 text-xs">
        💡 Distances are calculated from camera origin (0,0,0)
      </div>
    </div>
  );
}
