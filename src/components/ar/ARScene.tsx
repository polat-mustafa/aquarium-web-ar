'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ARSceneProps {
  children: React.ReactNode;
}

export const ARScene: React.FC<ARSceneProps> = memo(({ children }) => {
  const { scene, camera, gl } = useThree();
  const arInitialized = useRef(false);

  useEffect(() => {
    if (arInitialized.current) return;

    const initializeARJS = async () => {
      // Set scene background to null for transparency
      if (scene) {
        scene.background = null;
        scene.userData.arConfigured = true;
      }

      if (camera) {
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
      }

      // Configure renderer for transparency and recording
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

  return <group>{children}</group>;
});

ARScene.displayName = 'ARScene';