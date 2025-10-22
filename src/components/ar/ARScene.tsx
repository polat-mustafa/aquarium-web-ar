'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ARSceneProps {
  children: React.ReactNode;
}

// Static arrays to prevent re-creation on every render
const PLANE_ARGS = [20, 20] as const;
const PLANE_ROTATION = [-Math.PI / 2, 0, 0] as const;
const PLANE_POSITION = [0, -2, 0] as const;

// Create particle positions for bubbles and plankton
const BUBBLE_COUNT = 50;
const PLANKTON_COUNT = 100;

const createParticlePositions = (count: number, spread: number = 10) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * spread;     // x
    positions[i3 + 1] = (Math.random() - 0.5) * spread; // y
    positions[i3 + 2] = (Math.random() - 0.5) * spread; // z
  }
  return positions;
};

const BUBBLE_POSITIONS = createParticlePositions(BUBBLE_COUNT, 8);
const PLANKTON_POSITIONS = createParticlePositions(PLANKTON_COUNT, 12);

// Animated particle system
const AnimatedParticles: React.FC<{
  positions: Float32Array,
  color: string,
  size: number,
  speed: number,
  name: string
}> = memo(({ positions, color, size, speed, name }) => {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < positionArray.length; i += 3) {
        if (name === 'bubbles') {
          // Bubbles rise slowly
          positionArray[i + 1] += speed * 0.01;
          if (positionArray[i + 1] > 4) {
            positionArray[i + 1] = -4;
          }
          // Add gentle swaying
          positionArray[i] += Math.sin(time * 2 + i) * 0.001;
        } else if (name === 'plankton') {
          // Plankton drift randomly
          positionArray[i] += Math.sin(time * 0.5 + i) * 0.002;
          positionArray[i + 1] += Math.cos(time * 0.3 + i) * 0.001;
          positionArray[i + 2] += Math.sin(time * 0.4 + i) * 0.002;
        }
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={name === 'bubbles' ? 0.4 : 0.6}
        sizeAttenuation
      />
    </points>
  );
});

AnimatedParticles.displayName = 'AnimatedParticles';

export const ARScene: React.FC<ARSceneProps> = memo(({ children }) => {
  const { scene, camera, gl } = useThree();
  const arInitialized = useRef(false);

  // CRITICAL: Force scene background to null on EVERY render to prevent white screen
  useFrame(() => {
    if (scene) {
      scene.background = null;
      scene.userData.arConfigured = true;
    }
    if (gl) {
      gl.setClearColor(0x000000, 0);
      gl.setClearAlpha(0);
      // Ensure proper rendering settings
      if (gl.autoClear !== true) {
        gl.autoClear = true;
        gl.autoClearColor = true;
        gl.autoClearDepth = true;
        gl.autoClearStencil = true;
      }
    }
  });

  useEffect(() => {
    if (arInitialized.current) return;

    const initializeARJS = async () => {
      try {
        // CRITICAL: Set scene background to null for transparency
        if (scene) {
          scene.background = null;
        }

        if (camera) {
          camera.position.set(0, 0, 5);
          camera.lookAt(0, 0, 0);
        }

        // CRITICAL: Configure renderer for transparency and recording
        if (gl) {
          gl.setSize(window.innerWidth, window.innerHeight);
          gl.setClearColor(0x000000, 0);
          gl.setClearAlpha(0);
          gl.autoClear = true;
          gl.autoClearColor = true;
          gl.autoClearDepth = true;
          gl.autoClearStencil = true;
        }

        arInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize AR:', error);
      }
    };

    initializeARJS();
  }, [scene, camera, gl]);

  useEffect(() => {
    const handleResize = () => {
      if (gl && camera) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        gl.setSize(width, height);

        if ('aspect' in camera) {
          (camera as any).aspect = width / height;
          (camera as any).updateProjectionMatrix();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gl, camera]);

  return (
    <group>
      {/* Removed the blue plane - it was causing white screen issues */}

      {/* Removed particles temporarily - they might be causing performance issues */}

      {children}
    </group>
  );
});

ARScene.displayName = 'ARScene';