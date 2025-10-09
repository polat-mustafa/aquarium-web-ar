'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface ModelPreviewProps {
  modelPath: string;
  autoRotate?: boolean;
  scale?: number;
}

function Model({ modelPath, scale = 1 }: { modelPath: string; scale: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Load the GLB model
  const { scene } = useGLTF(modelPath);

  // Auto-rotate the model
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      // Add gentle bobbing motion
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene.clone()} scale={scale} />
    </group>
  );
}

export const ModelPreview: React.FC<ModelPreviewProps> = ({
  modelPath,
  autoRotate = true,
  scale = 1
}) => {
  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-sm">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4FACFE" />

          {/* Environment for reflections */}
          <Environment preset="sunset" />

          {/* The 3D Model */}
          <Model modelPath={modelPath} scale={scale} />

          {/* Optional orbit controls for interaction */}
          {autoRotate && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />}
        </Suspense>
      </Canvas>

      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
