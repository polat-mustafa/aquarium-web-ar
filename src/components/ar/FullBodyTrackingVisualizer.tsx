'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FullBodyTrackingManager,
  type TrackingResult,
  type JointPoint,
  type TrackingMode,
  normalizedToScreen,
} from '@/utils/fullBodyTracking';

interface FullBodyTrackingVisualizerProps {
  videoElement: HTMLVideoElement | null;
  mode?: TrackingMode;
  showLabels?: boolean;
  showConnections?: boolean;
  onResults?: (results: TrackingResult) => void;
}

export function FullBodyTrackingVisualizer({
  videoElement,
  mode = 'all',
  showLabels = true,
  showConnections = true,
  onResults,
}: FullBodyTrackingVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trackingManager] = useState(() => new FullBodyTrackingManager());
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<TrackingResult | null>(null);
  const [stats, setStats] = useState({
    facePoints: 0,
    handPoints: 0,
    posePoints: 0,
    fps: 0,
  });

  const lastFrameTime = useRef(Date.now());
  const frameCount = useRef(0);

  // Handle tracking results
  const handleResults = useCallback((results: TrackingResult) => {
    setCurrentResults(results);

    // Update stats
    frameCount.current++;
    const now = Date.now();
    const elapsed = now - lastFrameTime.current;

    if (elapsed >= 1000) {
      setStats({
        facePoints: results.face.length,
        handPoints: results.leftHand.length + results.rightHand.length,
        posePoints: results.pose.length,
        fps: Math.round((frameCount.current * 1000) / elapsed),
      });
      frameCount.current = 0;
      lastFrameTime.current = now;
    }

    if (onResults) {
      onResults(results);
    }
  }, [onResults]);

  // Initialize tracking
  useEffect(() => {
    if (!videoElement || isInitialized) return;

    const init = async () => {
      try {
        await trackingManager.initialize(videoElement, mode, handleResults);
        await trackingManager.start();
        setIsInitialized(true);
        setError(null);
      } catch (err: any) {
        console.error('Tracking initialization error:', err);
        setError(err.message || 'Failed to initialize tracking');
      }
    };

    init();

    return () => {
      trackingManager.stop();
      setIsInitialized(false);
    };
  }, [videoElement, mode, handleResults, isInitialized, trackingManager]);

  // Draw tracking points
  useEffect(() => {
    if (!currentResults || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw function for points
    const drawPoint = (point: JointPoint, color: string, size: number = 4) => {
      const screen = normalizedToScreen(point, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(screen.x, screen.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw label if enabled
      if (showLabels && point.label) {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(point.label, screen.x + 6, screen.y - 6);
      }
    };

    // Draw connection between two points
    const drawConnection = (p1: JointPoint, p2: JointPoint, color: string, width: number = 2) => {
      const screen1 = normalizedToScreen(p1, canvas.width, canvas.height);
      const screen2 = normalizedToScreen(p2, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(screen1.x, screen1.y);
      ctx.lineTo(screen2.x, screen2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    // Draw Face Points
    if (currentResults.face.length > 0) {
      // Draw face mesh connections (simplified)
      if (showConnections) {
        // Facial contour
        const faceConnections = [
          [0, 1], [1, 33], [33, 133], // Eye connections
          [61, 291], // Mouth connection
        ];

        faceConnections.forEach(([i1, i2]) => {
          if (currentResults.face[i1] && currentResults.face[i2]) {
            drawConnection(currentResults.face[i1], currentResults.face[i2], '#00ffff', 1);
          }
        });
      }

      // Draw face points
      currentResults.face.forEach((point, index) => {
        // Highlight key landmarks
        const isKeyLandmark = [0, 1, 4, 5, 6, 33, 133, 159, 61, 291].includes(index);
        drawPoint(point, '#00ffff', isKeyLandmark ? 5 : 2);
      });
    }

    // Draw Hand Points
    const drawHand = (points: JointPoint[], color: string) => {
      if (points.length === 0) return;

      // Draw hand connections
      if (showConnections) {
        const handConnections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [0, 9], [9, 10], [10, 11], [11, 12], // Middle
          [0, 13], [13, 14], [14, 15], [15, 16], // Ring
          [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        ];

        handConnections.forEach(([i1, i2]) => {
          if (points[i1] && points[i2]) {
            drawConnection(points[i1], points[i2], color, 2);
          }
        });
      }

      // Draw hand points
      points.forEach((point, index) => {
        // Fingertips are larger
        const isFingertip = [4, 8, 12, 16, 20].includes(index);
        drawPoint(point, color, isFingertip ? 6 : 4);
      });
    };

    drawHand(currentResults.leftHand, '#00ff00');
    drawHand(currentResults.rightHand, '#ff00ff');

    // Draw Pose Points
    if (currentResults.pose.length > 0 && showConnections) {
      // Draw pose skeleton connections
      const poseConnections = [
        [11, 12], // Shoulders
        [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], // Left arm
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], // Right arm
        [11, 23], [12, 24], [23, 24], // Torso
        [23, 25], [25, 27], [27, 29], [27, 31], // Left leg
        [24, 26], [26, 28], [28, 30], [28, 32], // Right leg
      ];

      poseConnections.forEach(([i1, i2]) => {
        if (currentResults.pose[i1] && currentResults.pose[i2]) {
          drawConnection(currentResults.pose[i1], currentResults.pose[i2], '#ffff00', 3);
        }
      });

      // Draw pose points
      currentResults.pose.forEach((point, index) => {
        // Only draw if visibility is high enough
        if ((point.visibility || 0) > 0.5) {
          drawPoint(point, '#ffff00', 5);
        }
      });
    }
  }, [currentResults, showLabels, showConnections]);

  return (
    <div className="relative w-full h-full">
      {/* Canvas for drawing tracking points */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-40"
      />

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-md rounded-xl p-3 text-white text-xs font-mono border border-cyan-500/30">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400">▶️</span>
            <span>{isInitialized ? 'Tracking Active' : 'Initializing...'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400">📊</span>
            <span>{stats.fps} FPS</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400">👤</span>
            <span>Face: {stats.facePoints} points</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✋</span>
            <span>Hands: {stats.handPoints} points</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400">🧍</span>
            <span>Pose: {stats.posePoints} points</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-50 bg-black/80 backdrop-blur-md rounded-xl p-3 text-white text-xs border border-cyan-500/30">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <span>Face</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span>Left Hand</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-pink-400"></div>
            <span>Right Hand</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Body/Pose</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500/90 backdrop-blur-md rounded-xl p-6 text-white text-center max-w-md border border-red-300/50">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold mb-2">Tracking Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
