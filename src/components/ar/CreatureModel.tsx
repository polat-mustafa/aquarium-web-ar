'use client';

import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { SeaCreature, AnimationState } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { checkCollision, calculateAvoidanceVector, type ObstacleZone } from '@/utils/depthSensing';

interface CreatureModelProps {
  creature: SeaCreature;
  position: [number, number, number];
  scale: number;
  onClick?: () => void;
  obstacleZones?: ObstacleZone[];
  enableCollisionDetection?: boolean;
  triggerFeedReturn?: number;
  surfacePosition?: [number, number, number];
  detectedObjects?: Array<{
    id: string;
    position: [number, number, number];
    dimensions: { width: number; height: number; depth: number };
    volume: number;
    type: 'table' | 'floor' | 'wall' | 'object';
  }>;
  triggerHideBehind?: number;
  triggerExplore?: number;
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

export const CreatureModel: React.FC<CreatureModelProps> = memo((  {
  creature,
  position,
  scale,
  onClick,
  obstacleZones = [],
  enableCollisionDetection = false,
  triggerFeedReturn = 0,
  surfacePosition,
  detectedObjects = [],
  triggerHideBehind = 0,
  triggerExplore = 0,
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

  // HIDE BEHIND OBJECTS: New behavior states
  const [isHiding, setIsHiding] = useState(false);
  const [hidingBehindObject, setHidingBehindObject] = useState<string | null>(null);
  const lastExploreTimeRef = useRef(0);
  const exploreIntervalRef = useRef(Math.random() * 10000 + 5000); // Random 5-15 seconds
  const pendingHideRef = useRef(0);
  const pendingExploreRef = useRef(0);

  // VISUAL EFFECTS: Opacity for fade in/out when hiding
  const [modelOpacity, setModelOpacity] = useState(1);
  const opacityAnimationRef = useRef({ progress: 1, from: 1, to: 1 });

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

  // WEBXR SURFACE: Position model on detected surface
  useEffect(() => {
    if (surfacePosition) {
      console.log('🎯 Positioning model on surface:', surfacePosition);
      // Animate to surface position (slightly above the surface)
      const surfacePos: [number, number, number] = [
        surfacePosition[0],
        surfacePosition[1] + 0.5, // Slightly above surface
        surfacePosition[2]
      ];
      positionAnimationRef.current = {
        progress: 0,
        from: dynamicPosition,
        to: surfacePos
      };
    }
  }, [surfacePosition, dynamicPosition]);

  // FEEDING: Watch for feeding trigger and return fish to center
  useEffect(() => {
    if (triggerFeedReturn > 0) {
      // Animate back to center position
      const centerPos: [number, number, number] = [0, 0, -3];
      positionAnimationRef.current = {
        progress: 0,
        from: dynamicPosition,
        to: centerPos
      };

      // Stop any avoidance animations
      setIsAvoidingObstacle(false);
      setIsHiding(false);
    }
  }, [triggerFeedReturn, dynamicPosition]);

  // TEST: Hide Behind Object trigger
  useEffect(() => {
    if (triggerHideBehind > 0) {
      console.log('🧪 TEST: Hide Behind triggered! Objects:', detectedObjects.length);
      pendingHideRef.current = triggerHideBehind;
      setIsAvoidingObstacle(false);
    }
  }, [triggerHideBehind, detectedObjects]);

  // TEST: Explore Behind trigger
  useEffect(() => {
    if (triggerExplore > 0) {
      console.log('🧪 TEST: Explore Behind triggered! Objects:', detectedObjects.length);
      pendingExploreRef.current = triggerExplore;
      setIsAvoidingObstacle(false);
    }
  }, [triggerExplore, detectedObjects]);

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

  // COLLISION AVOIDANCE: Move fish away from obstacle
  const avoidObstacle = useCallback((obstacle: ObstacleZone, currentPos: [number, number, number], camera: THREE.Camera) => {
    if (isAvoidingObstacle) return; // Already avoiding

    const currentPosVec = new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2]);

    // Calculate avoidance with depth consideration
    const obstacleDepth = obstacle.depth || 2.5;
    const fishDepth = Math.abs(currentPos[2]);

    // If fish is behind obstacle (higher z value = further), swim behind
    const shouldGoBehind = Math.random() > 0.5 || fishDepth > obstacleDepth;

    let targetPosVec: THREE.Vector3;

    if (shouldGoBehind) {
      // Swim BEHIND the obstacle (further away in Z)
      targetPosVec = calculateAvoidanceVector(currentPosVec, obstacle, camera);
      targetPosVec.z = Math.min(targetPosVec.z, -obstacleDepth - 1); // Go behind
    } else {
      // Swim away to the side
      targetPosVec = calculateAvoidanceVector(currentPosVec, obstacle, camera);
    }

    // Clamp to reasonable bounds
    const newX = Math.max(-3, Math.min(3, targetPosVec.x));
    const newY = Math.max(-2, Math.min(2, targetPosVec.y));
    const newZ = Math.max(-6, Math.min(-1, targetPosVec.z));

    // Start SLOWER escape animation
    positionAnimationRef.current = {
      progress: 0,
      from: currentPos,
      to: [newX, newY, newZ]
    };

    setIsAvoidingObstacle(true);

    // Show speech bubble on collision
    setShowSpeechBubble(true);
    setTimeout(() => setShowSpeechBubble(false), speechBubbleDuration);

    // Reset avoidance state after LONGER animation
    setTimeout(() => {
      setIsAvoidingObstacle(false);
    }, 2500); // Slower movement - 2.5 seconds
  }, [isAvoidingObstacle, setShowSpeechBubble, speechBubbleDuration]);

  // HIDE BEHIND OBJECT: Find nearest object and hide behind it
  const hideBehindObject = useCallback((currentPos: [number, number, number], camera: THREE.Camera, reason: 'threat' | 'explore') => {
    if (isHiding && reason === 'threat') return; // Already hiding from threat

    // If no objects, create a virtual object for animation
    if (detectedObjects.length === 0) {
      console.log('⚠️ No objects detected - creating virtual object for animation');
      const virtualObject = {
        id: 'virtual-object',
        position: [0, -1, -2] as [number, number, number],
        dimensions: { width: 2, height: 0.8, depth: 1 },
        volume: 1.6,
        type: 'table' as const
      };
      // Use virtual object for animation
      const objDepth = 2; // Fixed depth for virtual object
      const hideOffset = reason === 'threat' ? 2.5 : 1.5;
      const behindX = (Math.random() - 0.5) * 2;
      const behindY = -0.5;
      const behindZ = Math.min(-objDepth - hideOffset, -2.0);

      const newX = Math.max(-5, Math.min(5, behindX));
      const newY = Math.max(-3, Math.min(3, behindY));
      const newZ = Math.max(-10, Math.min(-2, behindZ));

      // Start hiding animation
      positionAnimationRef.current = {
        progress: 0,
        from: currentPos,
        to: [newX, newY, newZ]
      };

      setIsHiding(true);
      setHidingBehindObject('virtual-object');

      // Start fade out
      opacityAnimationRef.current = {
        progress: 0,
        from: modelOpacity,
        to: 0.15
      };

      setShowSpeechBubble(true);
      setTimeout(() => setShowSpeechBubble(false), speechBubbleDuration);

      const hideDuration = reason === 'threat' ? 4000 : 3000;
      setTimeout(() => {
        opacityAnimationRef.current = {
          progress: 0,
          from: modelOpacity,
          to: 1.0
        };
        setIsHiding(false);
        setHidingBehindObject(null);

        if (reason === 'threat') {
          const returnPos: [number, number, number] = [
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 2,
            -3
          ];
          positionAnimationRef.current = {
            progress: 0,
            from: [newX, newY, newZ],
            to: returnPos
          };
        }
      }, hideDuration);
      return;
    }

    const currentPosVec = new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2]);
    const currentDepth = Math.abs(currentPos[2]);

    // Find nearest object that fish can hide behind
    let bestObject = null;
    let bestDistance = Infinity;

    for (const obj of detectedObjects) {
      const objDepth = Math.sqrt(
        obj.position[0] * obj.position[0] +
        obj.position[1] * obj.position[1] +
        obj.position[2] * obj.position[2]
      );

      // Object must be closer to camera than fish (fish hides behind it)
      if (objDepth < currentDepth + 0.5) {
        const objPos = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
        const distance = currentPosVec.distanceTo(objPos);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestObject = obj;
        }
      }
    }

    if (bestObject) {
      console.log(`🐟 ${reason === 'threat' ? 'HIDING' : 'EXPLORING'} behind ${bestObject.type}!`);

      // Calculate position behind object (further away from camera)
      const objDepth = Math.sqrt(
        bestObject.position[0] * bestObject.position[0] +
        bestObject.position[1] * bestObject.position[1] +
        bestObject.position[2] * bestObject.position[2]
      );

      // ⭐ DRAMATIC: Go FAR behind object with large offset
      const hideOffset = reason === 'threat' ? 2.5 : 1.5; // MUCH deeper when threatened
      const behindX = bestObject.position[0] + (Math.random() - 0.5) * bestObject.dimensions.width * 2; // WIDER spread
      const behindY = bestObject.position[1] + bestObject.dimensions.height * 0.8; // HIGHER position
      const behindZ = Math.min(-objDepth - hideOffset, -2.0); // Go MUCH deeper behind (more negative Z)

      // Clamp to reasonable bounds (WIDER range)
      const newX = Math.max(-5, Math.min(5, behindX)); // Wider X range
      const newY = Math.max(-3, Math.min(3, behindY)); // Wider Y range
      const newZ = Math.max(-10, Math.min(-2, behindZ)); // MUCH deeper Z range

      // Start hiding animation
      positionAnimationRef.current = {
        progress: 0,
        from: currentPos,
        to: [newX, newY, newZ]
      };

      setIsHiding(true);
      setHidingBehindObject(bestObject.id);

      // ⭐ VISUAL: Start FADE OUT animation (disappear effect)
      console.log('👻 FADING OUT - Fish disappearing behind object!');
      opacityAnimationRef.current = {
        progress: 0,
        from: modelOpacity,
        to: 0.15 // Fade to almost invisible
      };

      // Show speech bubble
      setShowSpeechBubble(true);
      setTimeout(() => setShowSpeechBubble(false), speechBubbleDuration);

      // Reset hiding state after animation
      const hideDuration = reason === 'threat' ? 4000 : 3000;
      setTimeout(() => {
        console.log('👁️ FADING IN - Fish reappearing!');

        // ⭐ VISUAL: Start FADE IN animation (reappear effect)
        opacityAnimationRef.current = {
          progress: 0,
          from: modelOpacity,
          to: 1.0 // Fade back to fully visible
        };

        setIsHiding(false);
        setHidingBehindObject(null);

        // Return to normal position after hiding
        if (reason === 'threat') {
          const returnPos: [number, number, number] = [
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 2,
            -3
          ];
          positionAnimationRef.current = {
            progress: 0,
            from: [newX, newY, newZ],
            to: returnPos
          };
        }
      }, hideDuration);
    }
  }, [detectedObjects, isHiding, setShowSpeechBubble, speechBubbleDuration]);

  // Update every frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // TEST TRIGGERS: Handle test button triggers
    if (pendingHideRef.current > 0) {
      console.log('🧪 Executing hide behind test...');
      hideBehindObject(dynamicPosition, state.camera, 'threat');
      pendingHideRef.current = 0;
    }
    if (pendingExploreRef.current > 0) {
      console.log('🧪 Executing explore behind test...');
      hideBehindObject(dynamicPosition, state.camera, 'explore');
      pendingExploreRef.current = 0;
    }

    // COLLISION DETECTION & HIDING: Check for obstacles every 50ms (more responsive)
    if (enableCollisionDetection && obstacleZones && obstacleZones.length > 0 && time - lastObstacleCheckRef.current > 0.05) {
      lastObstacleCheckRef.current = time;

      const currentPosVec = new THREE.Vector3(dynamicPosition[0], dynamicPosition[1], dynamicPosition[2]);
      const collision = checkCollision(currentPosVec, state.camera, obstacleZones, 0.15); // LARGER threshold for earlier detection

      if (collision && !isAvoidingObstacle && !isHiding) {
        // HIDE BEHIND OBJECT when hand/face detected (threat response)
        if (detectedObjects.length > 0 && (collision.type === 'hand' || collision.type === 'person')) {
          console.log(`⚠️ THREAT DETECTED: ${collision.type.toUpperCase()}! Hiding behind object...`);
          hideBehindObject(dynamicPosition, state.camera, 'threat');
        } else {
          // Normal avoidance if no objects to hide behind
          avoidObstacle(collision, dynamicPosition, state.camera);
        }
      }
    }

    // RANDOM EXPLORATION: Occasionally swim behind objects during normal play
    if (!isHiding && !isAvoidingObstacle && detectedObjects.length > 0 && time - lastExploreTimeRef.current > exploreIntervalRef.current / 1000) {
      lastExploreTimeRef.current = time;
      exploreIntervalRef.current = Math.random() * 15000 + 8000; // Random 8-23 seconds

      // 30% chance to explore behind object
      if (Math.random() < 0.3) {
        console.log('🐟 Exploring behind object...');
        hideBehindObject(dynamicPosition, state.camera, 'explore');
      }
    }

    // Update mixer for embedded GLB animations
    if (mixerRef.current && model) {
      const validDelta = delta && !isNaN(delta) && delta > 0 ? delta : 0.016;
      mixerRef.current.update(validDelta);
    }

    // Animate position change - SLOWER for more natural movement
    if (positionAnimationRef.current.progress < 1) {
      positionAnimationRef.current.progress += delta * 0.4; // SLOWER smooth animation
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

    // ⭐ VISUAL: Animate opacity (fade in/out effect)
    if (opacityAnimationRef.current.progress < 1) {
      opacityAnimationRef.current.progress += delta * 2; // Fast fade
      const progress = Math.min(opacityAnimationRef.current.progress, 1);

      // Smooth easing
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate opacity
      const from = opacityAnimationRef.current.from;
      const to = opacityAnimationRef.current.to;
      const newOpacity = from + (to - from) * eased;

      setModelOpacity(newOpacity);

      // Apply opacity to model materials
      if (model) {
        model.traverse((child: any) => {
          if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat: any) => {
              mat.transparent = true;
              mat.opacity = newOpacity;
              mat.needsUpdate = true;
            });
          }
        });
      }
    }

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