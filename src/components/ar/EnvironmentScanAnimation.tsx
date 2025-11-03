'use client';

import React, { useEffect, useState, useRef } from 'react';

interface EnvironmentScanAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
}

interface ScanPoint {
  id: number;
  x: number;
  y: number;
  z: number;
  intensity: number;
  type: 'surface' | 'edge' | 'node';
}

export const EnvironmentScanAnimation: React.FC<EnvironmentScanAnimationProps> = ({
  isActive,
  onComplete,
  duration = 4000
}) => {
  const [scanPoints, setScanPoints] = useState<ScanPoint[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [phase, setPhase] = useState<'initializing' | 'scanning' | 'mapping' | 'complete'>('initializing');
  const [detectedSurfaces, setDetectedSurfaces] = useState(0);
  const [detectedNodes, setDetectedNodes] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate point cloud
  useEffect(() => {
    if (!isActive || phase !== 'scanning') return;

    const interval = setInterval(() => {
      setScanPoints(prev => {
        // Generate new scan points in a wave pattern
        const newPoints: ScanPoint[] = [];
        const time = Date.now() / 1000;
        const progressRatio = scanProgress / 100;

        for (let i = 0; i < 20; i++) {
          const angle = (Math.random() * Math.PI * 2);
          const radius = 0.3 + Math.random() * 0.4;
          const depth = 0.2 + Math.random() * 0.6;

          // Scan from top to bottom
          const yPosition = progressRatio - 0.1 + Math.random() * 0.2;

          if (yPosition >= 0 && yPosition <= 1) {
            newPoints.push({
              id: Date.now() + i + Math.random(),
              x: 0.5 + Math.cos(angle) * radius * (1 - depth),
              y: yPosition,
              z: depth,
              intensity: 0.5 + Math.random() * 0.5,
              type: Math.random() > 0.8 ? 'node' : Math.random() > 0.5 ? 'edge' : 'surface'
            });
          }
        }

        // Keep only recent points (simulate LiDAR fade)
        const updatedPoints = [...prev, ...newPoints].slice(-300);
        return updatedPoints;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, phase, scanProgress]);

  // Draw point cloud on canvas
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections between nearby points (mesh)
      if (phase === 'mapping') {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        for (let i = 0; i < scanPoints.length; i++) {
          const p1 = scanPoints[i];
          for (let j = i + 1; j < Math.min(i + 5, scanPoints.length); j++) {
            const p2 = scanPoints[j];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

            if (dist < 0.15) {
              ctx.beginPath();
              ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
              ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
              ctx.stroke();
            }
          }
        }
      }

      // Draw points
      scanPoints.forEach(point => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        const size = point.type === 'node' ? 6 : point.type === 'edge' ? 4 : 2;
        const alpha = point.intensity * (1 - point.z * 0.5);

        // Color based on type
        let color;
        if (point.type === 'node') {
          color = `rgba(255, 0, 255, ${alpha})`;
        } else if (point.type === 'edge') {
          color = `rgba(0, 255, 255, ${alpha})`;
        } else {
          color = `rgba(0, 200, 255, ${alpha * 0.6})`;
        }

        // Glow effect for nodes
        if (point.type === 'node') {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
        }

        // Draw point
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Depth indicator
        if (point.type === 'node' && phase === 'mapping') {
          ctx.strokeStyle = `rgba(255, 0, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, size + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      if (isActive) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [scanPoints, isActive, phase]);

  // Phase management
  useEffect(() => {
    if (!isActive) {
      setScanProgress(0);
      setScanPoints([]);
      setPhase('initializing');
      setDetectedSurfaces(0);
      setDetectedNodes(0);
      return;
    }

    // Phase 1: Initializing (0-300ms)
    const initTimer = setTimeout(() => {
      setPhase('scanning');
    }, 300);

    // Phase 2: Scanning (300ms - 60% duration)
    const scanDuration = duration * 0.6;
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        const increment = 100 / (scanDuration / 50);
        const next = prev + increment;

        if (next >= 100) {
          clearInterval(scanInterval);
          setPhase('mapping');
          return 100;
        }
        return next;
      });
    }, 50);

    // Surface and node detection simulation
    const detectionInterval = setInterval(() => {
      if (phase === 'scanning' || phase === 'mapping') {
        setDetectedSurfaces(prev => Math.min(prev + Math.floor(Math.random() * 3), 45));
        setDetectedNodes(prev => Math.min(prev + Math.floor(Math.random() * 2), 128));
      }
    }, 200);

    // Phase 3: Mapping (60% - 90% duration)
    const mappingTimer = setTimeout(() => {
      setPhase('complete');
    }, duration * 0.9);

    // Complete
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(initTimer);
      clearInterval(scanInterval);
      clearInterval(detectionInterval);
      clearTimeout(mappingTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, duration, onComplete, phase]);

  // Resize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        style={{
          opacity: phase === 'complete' ? 0 : 1,
          transitionDuration: '500ms'
        }}
      />

      {/* Point cloud canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          opacity: phase === 'complete' ? 0 : 1,
          transition: 'opacity 500ms'
        }}
      />

      {/* Scanning laser sweep */}
      {phase === 'scanning' && (
        <>
          <div
            className="absolute left-0 right-0 h-1"
            style={{
              top: `${scanProgress}%`,
              background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 1) 20%, rgba(0, 255, 255, 1) 80%, transparent)',
              boxShadow: '0 0 30px rgba(0, 255, 255, 1), 0 0 60px rgba(0, 255, 255, 0.5)',
              filter: 'blur(1px)'
            }}
          />
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${scanProgress}%`,
              background: 'rgba(255, 255, 255, 1)',
              boxShadow: '0 0 10px rgba(255, 255, 255, 1)'
            }}
          />
        </>
      )}

      {/* Corner frame */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.8 }}>
        <defs>
          <linearGradient id="cornerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 255, 255, 0)" />
            <stop offset="50%" stopColor="rgba(0, 255, 255, 1)" />
            <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
          </linearGradient>
        </defs>

        {/* Corners */}
        <path d="M 60 20 L 20 20 L 20 60" stroke="url(#cornerGrad)" strokeWidth="2" fill="none" />
        <path d="M calc(100% - 60) 20 L calc(100% - 20) 20 L calc(100% - 20) 60" stroke="url(#cornerGrad)" strokeWidth="2" fill="none" />
        <path d="M 60 calc(100% - 20) L 20 calc(100% - 20) L 20 calc(100% - 60)" stroke="url(#cornerGrad)" strokeWidth="2" fill="none" />
        <path d="M calc(100% - 60) calc(100% - 20) L calc(100% - 20) calc(100% - 20) L calc(100% - 20) calc(100% - 60)" stroke="url(#cornerGrad)" strokeWidth="2" fill="none" />
      </svg>

      {/* Technical HUD */}
      <div className="absolute top-4 left-4 space-y-2 font-mono text-xs text-cyan-400">
        <div className="bg-black/80 border border-cyan-500/30 px-3 py-2 rounded backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="font-bold">DEPTH SENSOR</span>
          </div>
          <div className="text-[10px] text-cyan-300/70 space-y-0.5">
            <div>STATUS: {phase.toUpperCase()}</div>
            <div>RESOLUTION: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</div>
            <div>FRAME RATE: 30 FPS</div>
            <div>POINTS: {scanPoints.length}/300</div>
          </div>
        </div>

        {phase !== 'initializing' && (
          <div className="bg-black/80 border border-magenta-500/30 px-3 py-2 rounded backdrop-blur-sm">
            <div className="text-[10px] text-magenta-300 space-y-0.5">
              <div className="flex justify-between">
                <span>SURFACES:</span>
                <span className="font-bold text-magenta-400">{detectedSurfaces}</span>
              </div>
              <div className="flex justify-between">
                <span>NODES:</span>
                <span className="font-bold text-magenta-400">{detectedNodes}</span>
              </div>
              <div className="flex justify-between">
                <span>CONFIDENCE:</span>
                <span className="font-bold text-green-400">{Math.round(scanProgress)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center status */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {phase === 'initializing' && (
          <div className="text-center">
            <div className="relative w-24 h-24 mb-4">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl">📡</div>
              </div>
            </div>
            <div className="text-cyan-400 text-lg font-bold tracking-[0.3em] font-mono">
              INITIALIZING
            </div>
            <div className="text-cyan-300/50 text-xs font-mono mt-2">
              CALIBRATING SENSORS...
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="text-center">
            <div className="text-cyan-400 text-2xl font-bold tracking-[0.2em] font-mono mb-2">
              SCANNING ENVIRONMENT
            </div>
            <div className="text-cyan-300 text-sm font-mono mb-4">
              LIDAR DEPTH MAPPING ACTIVE
            </div>

            {/* Progress bars */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-cyan-400 text-xs font-mono w-24 text-right">DEPTH MAP</span>
                <div className="w-64 h-1.5 bg-black/50 border border-cyan-500/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all"
                    style={{
                      width: `${scanProgress}%`,
                      boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
                    }}
                  />
                </div>
                <span className="text-cyan-300 text-xs font-mono w-12">{Math.round(scanProgress)}%</span>
              </div>
            </div>
          </div>
        )}

        {phase === 'mapping' && (
          <div className="text-center">
            <div className="text-magenta-400 text-2xl font-bold tracking-[0.2em] font-mono mb-2">
              GENERATING MESH
            </div>
            <div className="text-magenta-300 text-sm font-mono mb-4">
              CONNECTING SURFACE NODES
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-magenta-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-magenta-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-magenta-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="text-center animate-scale-in">
            <div className="text-6xl mb-4">✓</div>
            <div className="text-green-400 text-xl font-bold tracking-[0.2em] font-mono">
              SCAN COMPLETE
            </div>
            <div className="text-green-300/70 text-sm font-mono mt-2">
              ENVIRONMENT MAPPED
            </div>
          </div>
        )}
      </div>

      {/* Technical readouts */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-6 font-mono text-[10px] text-cyan-400/60">
        <div>MODE: DEPTH</div>
        <div>|</div>
        <div>ALGO: LIDAR</div>
        <div>|</div>
        <div>PRECISION: HIGH</div>
        <div>|</div>
        <div>LAT: &lt;16ms</div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnvironmentScanAnimation;
