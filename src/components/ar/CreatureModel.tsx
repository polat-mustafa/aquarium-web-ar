'use client';

import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { SeaCreature, AnimationState } from '@/types';
import { useAppStore } from '@/stores/useAppStore';

interface ObstacleZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  type: 'hand' | 'person' | 'object';
}

interface CreatureModelProps {
  creature: SeaCreature;
  position: [number, number, number];
  scale: number;
  onClick?: () => void;
  obstacleZones?: ObstacleZone[];
  enableCollisionDetection?: boolean;
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
  obstacleZones = [],
  enableCollisionDetection = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scaleNormalizationRef = useRef(1);
  const [isTurning, setIsTurning] = useState(false);
  const turnAnimationRef = useRef({ progress: 0, direction: 1 });

  // Dynamic position state
  const [dynamicPosition, setDynamicPosition] = useState<[number, number, number]>(position);
  const positionAnimationRef = useRef({ progress: 1, from: position, to: position });
  const [isAvoidingObstacle, setIsAvoidingObstacle] = useState(false);
  const lastObstacleCheckRef = useRef(0);

  // Get zoom level and speech bubble settings from store
  const zoomLevel = useAppStore((state) => state.zoomLevel);
  const setShowSpeechBubble = useAppStore((state) => state.setShowSpeechBubble);
  const speechBubbleDuration = useAppStore((state) => state.speechBubbleDuration);

  // Check if we have a model path
  const hasModelPath = !!creature.modelPath;

  // Load model using GLTFLoader
  useEffect(() => {
    if (!hasModelPath) {
      setLoading(false);
      return;
    }

    const loader = new GLTFLoader();
    const encodedPath = encodeURI(creature.modelPath!);

    loader.load(
      encodedPath,
      (gltf) => {
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
        const TARGET_SIZE = 2.0; // Target size for all models

        if (maxDim > 0) {
          scaleNormalizationRef.current = TARGET_SIZE / maxDim;
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
            action.clampWhenFinished = false;
            action.enabled = true;
            action.play();
          });
        }

        setModel(loadedScene);
        setLoading(false);
      },
      undefined,
      (err) => {
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
      setIsTurning(true);
      turnAnimationRef.current = {
        progress: 0,
        direction: Math.random() > 0.5 ? 1 : -1 // Random direction
      };

      // Show speech bubble
      setShowSpeechBubble(true);

      // Generate new random position within reasonable bounds
      const newX = (Math.random() - 0.5) * 4; // -2 to 2
      const newY = (Math.random() - 0.5) * 3; // -1.5 to 1.5
      const newZ = position[2] + (Math.random() - 0.5) * 2; // Keep roughly same depth

      // Start position animation
      positionAnimationRef.current = {
        progress: 0,
        from: dynamicPosition,
        to: [newX, newY, newZ]
      };

      // Reset after dance animation completes
      setTimeout(() => {
        setIsTurning(false);
      }, 1200); // Longer dance time

      // Auto-hide speech bubble after configured duration
      setTimeout(() => {
        setShowSpeechBubble(false);
      }, speechBubbleDuration);
    }

    if (onClick) {
      onClick();
    }
  }, [isTurning, onClick, setShowSpeechBubble, position, dynamicPosition, speechBubbleDuration, creature.name]);

  // COLLISION DETECTION: Check if creature is colliding with obstacles
  const checkCollision = useCallback((currentPos: [number, number, number], camera: THREE.Camera) => {
    if (!enableCollisionDetection || obstacleZones.length === 0) return null;

    // Project creature's 3D position to 2D screen space
    const creatureWorldPos = new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2]);
    const creatureScreenPos = creatureWorldPos.project(camera);

    // Convert from normalized device coordinates [-1, 1] to screen space [0, 1]
    const creatureX = (creatureScreenPos.x + 1) / 2;
    const creatureY = (-creatureScreenPos.y + 1) / 2; // Invert Y

    // Check collision with each obstacle zone
    for (const zone of obstacleZones) {
      const zoneRight = zone.x + zone.width;
      const zoneBottom = zone.y + zone.height;

      // Add padding for detection sensitivity
      const padding = 0.05;

      if (
        creatureX >= zone.x - padding &&
        creatureX <= zoneRight + padding &&
        creatureY >= zone.y - padding &&
        creatureY <= zoneBottom + padding
      ) {
        return zone;
      }
    }

    return null;
  }, [enableCollisionDetection, obstacleZones]);

  // COLLISION AVOIDANCE: Move fish away from obstacle
  const avoidObstacle = useCallback((obstacle: ObstacleZone, currentPos: [number, number, number]) => {
    if (isAvoidingObstacle) return; // Already avoiding

    // Calculate escape direction (move away from obstacle center)
    const obstacleX = obstacle.x + obstacle.width / 2;
    const obstacleY = obstacle.y + obstacle.height / 2;

    // Determine escape direction
    const escapeX = currentPos[0] - (obstacleX - 0.5) * 4; // Amplify escape
    const escapeY = currentPos[1] - (obstacleY - 0.5) * 4;

    // Clamp to reasonable bounds
    const newX = Math.max(-3, Math.min(3, escapeX + (Math.random() - 0.5) * 2));
    const newY = Math.max(-2, Math.min(2, escapeY + (Math.random() - 0.5) * 1));
    const newZ = currentPos[2] + (Math.random() - 0.5) * 1;

    // Start escape animation
    positionAnimationRef.current = {
      progress: 0,
      from: currentPos,
      to: [newX, newY, newZ]
    };

    setIsAvoidingObstacle(true);

    // Reset avoidance state after animation
    setTimeout(() => {
      setIsAvoidingObstacle(false);
    }, 1000);
  }, [isAvoidingObstacle]);

  // Update every frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // COLLISION DETECTION: Check for obstacles every 100ms
    if (enableCollisionDetection && time - lastObstacleCheckRef.current > 0.1) {
      lastObstacleCheckRef.current = time;
      const collision = checkCollision(dynamicPosition, state.camera);

      if (collision && !isAvoidingObstacle) {
        avoidObstacle(collision, dynamicPosition);
      }
    }

    // Update mixer for embedded GLB animations
    if (mixerRef.current && model) {
      const validDelta = delta && !isNaN(delta) && delta > 0 ? delta : 0.016;
      mixerRef.current.update(validDelta);
    }

    // Animate position change
    if (positionAnimationRef.current.progress < 1) {
      positionAnimationRef.current.progress += delta * 0.8; // Smooth animation
      const progress = Math.min(positionAnimationRef.current.progress, 1);

      // Smooth easing
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate position
      const from = positionAnimationRef.current.from;
      const to = positionAnimationRef.current.to;
      const newPos: [number, number, number] = [
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
        from[2] + (to[2] - from[2]) * eased
      ];

      setDynamicPosition(newPos);
    }

    // Handle tap animation - BIG DANCE ANIMATION
    let tapRotation = 0;
    let tapJump = 0;
    let tapWiggle = 0;
    if (isTurning && turnAnimationRef.current.progress < 1) {
      turnAnimationRef.current.progress += delta * 3; // Even faster animation
      const progress = Math.min(turnAnimationRef.current.progress, 1);

      // Smooth easing function
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // BIG spin animation (full 360 degree spin!)
      tapRotation = eased * Math.PI * 2 * turnAnimationRef.current.direction;
      // BIG jump up during turn
      tapJump = Math.sin(eased * Math.PI) * 0.8;
      // Side-to-side wiggle for dance effect
      tapWiggle = Math.sin(eased * Math.PI * 4) * 0.3;
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

    // Apply animated position (use dynamic position + swimming motion + tap jump + wiggle)
    groupRef.current.position.set(
      dynamicPosition[0] + swayX + tapWiggle,
      dynamicPosition[1] + floatY + tapJump,
      dynamicPosition[2]
    );

    // Apply rotation (combine natural swimming with tap rotation)
    groupRef.current.rotation.y = naturalTurnRotation + tapRotation;
    groupRef.current.rotation.z = tiltZ + (isTurning ? Math.sin(turnAnimationRef.current.progress * Math.PI * 2) * 0.5 : 0);

    // Keep scale updated with zoom level
    groupRef.current.scale.setScalar(scale * scaleNormalizationRef.current * zoomLevel);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale * scaleNormalizationRef.current * zoomLevel}
      onClick={(e) => {
        e.stopPropagation();
        handleTap();
      }}
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