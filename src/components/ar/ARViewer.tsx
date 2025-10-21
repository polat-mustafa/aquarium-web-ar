'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { CreatureModel } from './CreatureModel';
import { ARScene } from './ARScene';

interface ARViewerProps {
  debug?: boolean;
  className?: string;
}

// Static camera settings (never change)
const CAMERA_SETTINGS = {
  position: [0, 0, 5] as const,
  fov: 60,
  near: 0.001,  // Very close near plane
  far: 10000,   // Very far far plane to prevent clipping
};

// Static GL settings (never change)
const GL_SETTINGS = {
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
  premultipliedAlpha: false,
  powerPreference: 'high-performance' as const,
};

// Static light positions (never change)
const DIRECTIONAL_LIGHT_POS = [10, 10, 5] as const;
const POINT_LIGHT_POS = [-10, -10, -10] as const;
const FOG_ARGS = ['#87CEEB', 10, 50] as const;
const ORBIT_TARGET = [0, 0, 0] as const;

const ARViewer: React.FC<ARViewerProps> = memo(({ debug = false, className = '' }) => {
  // CRITICAL: Only select activeCreature, not currentAnimation to prevent unnecessary re-renders
  // Animation state changes should NOT cause Canvas to re-render
  const activeCreature = useAppStore((state) => state.activeCreature);
  const setManualRotation = useAppStore((state) => state.setManualRotation);

  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef({ x: 0, y: 0 });

  // DIAGNOSTIC: Track Canvas mount/unmount
  useEffect(() => {
    console.log('🟢 ARViewer Canvas MOUNTED');
    return () => {
      console.log('🔴 ARViewer Canvas UNMOUNTED - THIS SHOULD NEVER HAPPEN!');
    };
  }, []);

  console.log('🎨 ARViewer render:', activeCreature?.name || 'no creature');

  return (
    <div className={`relative w-full h-full ${className}`} style={{ background: 'transparent', pointerEvents: 'auto' }}>
      <Canvas
        camera={CAMERA_SETTINGS}
        gl={{
          ...GL_SETTINGS,
          alpha: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: 'high-performance' as const,
        }}
        className="absolute inset-0"
        style={{
          background: 'transparent',
          pointerEvents: 'auto'
        }}
        dpr={[1, 2]}
        frameloop="always"
        onCreated={({ gl, scene }) => {
          // CRITICAL: Configure renderer for proper transparency
          gl.setClearColor(0x000000, 0);
          gl.setClearAlpha(0);
          scene.background = null;
          console.log('✅ Canvas created with transparency settings');
        }}
      >
        {/* Brighter lighting for better model visibility */}
        <ambientLight intensity={3} />
        <directionalLight
          position={DIRECTIONAL_LIGHT_POS}
          intensity={5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-10, 10, 5]}
          intensity={3}
        />
        <pointLight position={POINT_LIGHT_POS} intensity={2} />
        <pointLight position={[0, 5, 0]} intensity={2} />
        <pointLight position={[0, 0, 5]} intensity={2} />
        <hemisphereLight intensity={2} />

        <ARScene>
          {activeCreature ? (
            <CreatureModel
              key={activeCreature.id}
              creature={activeCreature}
              position={activeCreature.position}
              scale={activeCreature.scale}
            />
          ) : (
            // Keep a placeholder to maintain scene structure
            <group />
          )}
        </ARScene>

        {debug && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={ORBIT_TARGET}
          />
        )}
      </Canvas>

      <div
        id="arjs-video"
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{ zIndex: -1 }}
      />

      {debug && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-sm">
          <div>Active Creature: {activeCreature?.name || 'None'}</div>
          <div>Model Path: {activeCreature?.modelPath ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
});

ARViewer.displayName = 'ARViewer';

export { ARViewer };