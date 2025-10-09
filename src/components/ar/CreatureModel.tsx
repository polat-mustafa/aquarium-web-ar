'use client';

import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { SeaCreature, AnimationState } from '@/types';

interface CreatureModelProps {
  creature: SeaCreature;
  position: [number, number, number];
  scale: number;
  onClick?: () => void;
}

// Simple icon fallback for creatures without 3D models
const IconFallback: React.FC<{ creature: SeaCreature }> = memo(({ creature }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.1;
      meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.2;
    }
  });

  const getIconColor = () => {
    switch (creature.type) {
      case 'shark': return '#606060';
      case 'dolphin': return '#4A90E2';
      case 'turtle': return '#228B22';
      case 'octopus': return '#8B4513';
      case 'jellyfish': return '#FF69B4';
      case 'whale': return '#2F4F4F';
      default: return '#87CEEB';
    }
  };

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color={getIconColor()}
        emissive={getIconColor()}
        emissiveIntensity={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
});

IconFallback.displayName = 'IconFallback';

export const CreatureModel: React.FC<CreatureModelProps> = memo(({
  creature,
  position,
  scale,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scaleNormalizationRef = useRef(1);
  const [isTurning, setIsTurning] = useState(false);
  const turnAnimationRef = useRef({ progress: 0, direction: 1 });

  // Check if we have a model path
  const hasModelPath = !!creature.modelPath;

  console.log('🔍 CreatureModel for:', {
    creatureName: creature.name,
    hasModelPath,
    modelPath: creature.modelPath
  });

  // Load model using GLTFLoader
  useEffect(() => {
    if (!hasModelPath) {
      setLoading(false);
      return;
    }

    console.log('📦 Starting to load model for:', creature.name);
    const loader = new GLTFLoader();
    const encodedPath = encodeURI(creature.modelPath!);

    loader.load(
      encodedPath,
      (gltf) => {
        console.log('✅ Model loaded successfully for:', creature.name, gltf);

        const loadedScene = gltf.scene.clone(true);

        // Make everything visible
        loadedScene.visible = true;
        loadedScene.frustumCulled = false;
        loadedScene.traverse((child: any) => {
          if (child.isMesh) {
            child.visible = true;
            child.frustumCulled = false;
            child.renderOrder = 999;
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat: any) => {
                mat.transparent = false;
                mat.opacity = 1;
                mat.depthWrite = true;
                mat.depthTest = true;
                mat.side = THREE.DoubleSide;
                mat.needsUpdate = true;
              });
            }
            if (child.geometry) {
              if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
              if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
            }
          }
        });

        // Calculate scale normalization
        const box = new THREE.Box3().setFromObject(loadedScene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const MIN_DISPLAY_SIZE = 1.0;

        if (maxDim < MIN_DISPLAY_SIZE && maxDim > 0) {
          scaleNormalizationRef.current = MIN_DISPLAY_SIZE / maxDim;
          console.log('📏 Normalized scale:', scaleNormalizationRef.current);
        } else {
          scaleNormalizationRef.current = 1;
        }

        // Set up animations
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(loadedScene);
          mixerRef.current = mixer;

          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.reset();
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.timeScale = 1;
            action.play();
            console.log('▶️ Playing animation:', clip.name);
          });
        }

        setModel(loadedScene);
        setLoading(false);
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading ${creature.name}: ${percent.toFixed(2)}%`);
      },
      (err) => {
        console.error('❌ Error loading model for:', creature.name, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [hasModelPath, creature.modelPath, creature.name]);

  // Handle tap/click on creature
  const handleTap = useCallback(() => {
    if (!isTurning) {
      console.log('🐟 Fish tapped! Starting turn animation');
      setIsTurning(true);
      turnAnimationRef.current = {
        progress: 0,
        direction: Math.random() > 0.5 ? 1 : -1 // Random direction
      };

      // Reset after animation completes
      setTimeout(() => {
        setIsTurning(false);
      }, 1500);
    }

    if (onClick) {
      onClick();
    }
  }, [isTurning, onClick]);

  // Update every frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // Force visibility on model
    if (model) {
      model.visible = true;
      model.frustumCulled = false;

      model.traverse((child: any) => {
        if (child.isMesh) {
          child.visible = true;
          child.frustumCulled = false;
        }
      });
    }

    // Ensure group is visible
    groupRef.current.visible = true;
    groupRef.current.frustumCulled = false;

    // CRITICAL: Update mixer FIRST for embedded GLB animations
    if (mixerRef.current && model) {
      const validDelta = delta && !isNaN(delta) && delta > 0 ? delta : 0.016;
      mixerRef.current.update(validDelta);
    }

    // Handle tap animation
    let tapRotation = 0;
    let tapJump = 0;
    if (isTurning && turnAnimationRef.current.progress < 1) {
      turnAnimationRef.current.progress += delta * 1.5; // Animation speed
      const progress = Math.min(turnAnimationRef.current.progress, 1);

      // Smooth easing function
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Quick turn animation (full 180 degree turn)
      tapRotation = Math.sin(eased * Math.PI) * Math.PI * turnAnimationRef.current.direction;
      // Jump up during turn
      tapJump = Math.sin(eased * Math.PI) * 0.5;
    }

    // Add swimming motion for fish
    // Vertical floating motion (up and down)
    const floatY = Math.sin(time * 0.8) * 0.3;

    // Horizontal swaying motion (side to side)
    const swayX = Math.sin(time * 0.6) * 0.25;

    // Natural turning/rotation (left to right)
    const naturalTurnRotation = Math.sin(time * 0.4) * 0.6;

    // Additional tilt for realism
    const tiltZ = Math.cos(time * 0.5) * 0.2;

    // Apply animated position (add tap jump)
    groupRef.current.position.set(
      position[0] + swayX,
      position[1] + floatY + tapJump,
      position[2]
    );

    // Apply rotation (combine natural swimming with tap rotation)
    groupRef.current.rotation.y = naturalTurnRotation + tapRotation;
    groupRef.current.rotation.z = tiltZ;

    // Keep scale updated
    groupRef.current.scale.setScalar(scale * scaleNormalizationRef.current);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale * scaleNormalizationRef.current}
      onClick={handleTap}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
    >
      {loading && hasModelPath ? (
        // Model is loading - show yellow loading indicator
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
      ) : error ? (
        // Error loading model - show red error indicator
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#FF0000"
            emissive="#FF0000"
            emissiveIntensity={0.5}
          />
        </mesh>
      ) : model ? (
        // Render actual GLTF 3D model with animations
        <primitive object={model} />
      ) : (
        // No 3D model - show icon fallback
        <IconFallback creature={creature} />
      )}
    </group>
  );
});

CreatureModel.displayName = 'CreatureModel';