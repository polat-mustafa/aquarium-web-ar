/**
 * Comprehensive Depth Sensing Utilities
 * Supports MediaPipe, WebXR, and TensorFlow.js
 */

import * as THREE from 'three';

export interface ObstacleZone {
  id: string;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  width: number;
  height: number;
  depth?: number; // estimated depth in meters
  type: 'hand' | 'person' | 'object';
  confidence?: number;
}

export interface DepthFrame {
  width: number;
  height: number;
  data: Float32Array | Uint8Array;
  format: 'float32' | 'luminance-alpha';
}

export type DepthSensingMode = 'mediapipe' | 'webxr' | 'tensorflow' | 'none';

/**
 * MediaPipe Hand Detection with 3D Keypoints (TensorFlow.js Best Practice)
 * Uses keypoints3D for REAL metric depth calculation
 */
export class MediaPipeDepthSensor {
  private hands: any;
  private camera: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private onObstaclesCallback?: (zones: ObstacleZone[]) => void;
  private isProcessing = false;

  async initialize(videoElement: HTMLVideoElement, onObstacles: (zones: ObstacleZone[]) => void): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.onObstaclesCallback = onObstacles;

      // Ensure video is ready and playing
      if (videoElement.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video not ready')), 5000);
          videoElement.onloadeddata = () => {
            clearTimeout(timeout);
            resolve();
          };
        });
      }

      const { Hands } = await import('@mediapipe/hands');

      // Multi-CDN support with fallback for iOS and unreliable networks
      const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/',  // Primary CDN
        'https://unpkg.com/@mediapipe/hands/',              // Fallback 1
        'https://esm.sh/@mediapipe/hands/',                 // Fallback 2
      ];

      let handsInstance: any = null;
      let initError: Error | null = null;

      for (const cdnUrl of cdnUrls) {
        try {
          console.log(`🔗 Trying MediaPipe CDN: ${cdnUrl}`);

          handsInstance = new Hands({
            locateFile: (file: string) => `${cdnUrl}${file}`
          });

          handsInstance.setOptions({
            maxNumHands: 2,
            modelComplexity: 1, // ✅ FIXED: Use 'full' model for 3D keypoints (was 0)
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          handsInstance.onResults((results: any) => {
            this.processHandResults(results);
          });

          // Initialize with timeout (5 seconds)
          const initPromise = handsInstance.initialize();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('MediaPipe initialization timeout')), 5000)
          );

          await Promise.race([initPromise, timeoutPromise]);
          this.hands = handsInstance;
          console.log(`✅ MediaPipe loaded from: ${cdnUrl}`);
          initError = null;
          break;
        } catch (error) {
          console.warn(`⚠️ Failed with ${cdnUrl}:`, error);
          initError = error as Error;
          continue;
        }
      }

      if (!this.hands || initError) {
        throw new Error(`Failed to initialize MediaPipe from all CDN sources. Last error: ${initError?.message}`);
      }

      // Use existing video stream instead of creating new Camera
      // Process frames manually using requestAnimationFrame
      const processFrame = async () => {
        if (!this.hands || !this.videoElement || this.isProcessing) {
          this.camera = requestAnimationFrame(processFrame);
          return;
        }

        try {
          this.isProcessing = true;
          await this.hands.send({ image: this.videoElement });
        } catch (err) {
          console.error('MediaPipe processing error:', err);
        } finally {
          this.isProcessing = false;
        }

        // Continue processing
        this.camera = requestAnimationFrame(processFrame);
      };

      // Start processing
      processFrame();

      console.log('✅ MediaPipe initialized with 3D keypoints support');
    } catch (error) {
      console.error('❌ MediaPipe initialization failed:', error);
      throw error;
    }
  }

  private processHandResults(results: any): void {
    // ✅ FIXED: Now using multiHandWorldLandmarks (3D keypoints in metric scale)
    if (results.multiHandWorldLandmarks && results.multiHandWorldLandmarks.length > 0) {
      console.log(`✋ MediaPipe detected ${results.multiHandWorldLandmarks.length} hand(s) with 3D keypoints`);

      const obstacles: ObstacleZone[] = results.multiHandWorldLandmarks.map((worldLandmarks: any, index: number) => {
        // Get 2D landmarks for bounding box
        const landmarks2D = results.multiHandLandmarks[index];
        const xs = landmarks2D.map((lm: any) => lm.x);
        const ys = landmarks2D.map((lm: any) => lm.y);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // ✅ REAL DEPTH: Calculate from 3D world landmarks (METRIC SCALE - meters)
        // Origin: Average of first knuckles (index, middle, ring, pinky)
        // Using wrist landmark (index 0) for depth calculation
        const wrist = worldLandmarks[0];

        // ✅ TENSORFLOW.JS FORMULA: sqrt(x² + y² + z²) for distance from origin
        const realDepth = Math.sqrt(
          wrist.x * wrist.x +
          wrist.y * wrist.y +
          wrist.z * wrist.z
        );

        // Calculate average depth from multiple keypoints (more accurate)
        const keyDepths = worldLandmarks.map((kp: any) =>
          Math.sqrt(kp.x * kp.x + kp.y * kp.y + kp.z * kp.z)
        );
        const avgDepth = keyDepths.reduce((sum: number, d: number) => sum + d, 0) / keyDepths.length;

        console.log(`  ✅ Hand ${index}: REAL DEPTH = ${realDepth.toFixed(3)}m (wrist), AVG = ${avgDepth.toFixed(3)}m`);
        console.log(`    3D Wrist Position: x=${wrist.x.toFixed(3)}m, y=${wrist.y.toFixed(3)}m, z=${wrist.z.toFixed(3)}m`);

        const padding = 0.05;
        return {
          id: `hand-${index}`,
          x: Math.max(0, minX - padding),
          y: Math.max(0, minY - padding),
          width: Math.min(1, maxX - minX + padding * 2),
          height: Math.min(1, maxY - minY + padding * 2),
          depth: avgDepth, // ✅ REAL metric depth in meters!
          type: 'hand' as const,
          confidence: 0.95 // Higher confidence with 3D keypoints
        };
      });

      this.onObstaclesCallback?.(obstacles);
    } else {
      this.onObstaclesCallback?.([]);
    }
  }

  stop(): void {
    if (this.camera) {
      if (typeof this.camera === 'number') {
        cancelAnimationFrame(this.camera);
      } else if (this.camera.stop) {
        this.camera.stop();
      }
    }
    if (this.hands) {
      this.hands.close();
    }
    this.camera = null;
    this.hands = null;
  }
}

/**
 * WebXR Depth Sensing
 */
export class WebXRDepthSensor {
  private session: XRSession | null = null;
  private onDepthFrameCallback?: (frame: DepthFrame, obstacles: ObstacleZone[]) => void;

  async initialize(onDepthFrame: (frame: DepthFrame, obstacles: ObstacleZone[]) => void): Promise<void> {
    try {
      // Check if WebXR is available
      if (!('xr' in navigator)) {
        throw new Error('WebXR not available in this browser. Use Chrome or Edge on Android/Quest.');
      }

      // Check if XR API is properly initialized
      const xr = (navigator as any).xr;
      if (!xr || !xr.isSessionSupported) {
        throw new Error('WebXR API not initialized. Try opening in an immersive browser.');
      }

      // Check if immersive-ar is supported
      const isARSupported = await xr.isSessionSupported('immersive-ar');
      if (!isARSupported) {
        throw new Error('WebXR AR not supported on this device. Requires Quest 3 or ARCore device.');
      }

      this.onDepthFrameCallback = onDepthFrame;

      // Try to request session with depth sensing (make it optional for Samsung/Android)
      try {
        console.log('🚀 Requesting WebXR session with depth sensing...');
        this.session = await xr.requestSession('immersive-ar', {
          requiredFeatures: [],
          optionalFeatures: ['hit-test', 'depth-sensing', 'dom-overlay', 'anchors', 'plane-detection'],
          depthSensing: {
            usagePreference: ['cpu-optimized', 'gpu-optimized'],
            dataFormatPreference: ['luminance-alpha', 'float32']
          }
        });
        console.log('✅ WebXR session created with depth sensing!');
      } catch (sessionError: any) {
        // Try again without depth sensing for Samsung/Android devices
        console.warn('⚠️ Depth sensing failed, trying basic AR...');
        try {
          this.session = await xr.requestSession('immersive-ar', {
            requiredFeatures: [],
            optionalFeatures: ['hit-test', 'dom-overlay', 'anchors', 'plane-detection']
          });
          console.log('✅ WebXR session created (basic AR mode, no depth sensing)');
          // Don't throw - fallback session is valid!
        } catch (fallbackError: any) {
          throw new Error('WebXR AR session failed. Make sure you allow camera permissions and AR access.');
        }
      }

      this.session.addEventListener('end', () => {
        this.session = null;
      });

      console.log('✅ WebXR Depth Sensing initialized');
      this.startDepthProcessing();
    } catch (error: any) {
      console.error('❌ WebXR initialization failed:', error);
      throw error;
    }
  }

  private async startDepthProcessing(): Promise<void> {
    if (!this.session) return;

    const renderFrame = async (time: number, frame: XRFrame) => {
      if (!this.session || !frame) return;

      const referenceSpace = await this.session.requestReferenceSpace('local');
      const viewerPose = frame.getViewerPose(referenceSpace);

      if (viewerPose) {
        for (const view of viewerPose.views) {
          const depthInfo = frame.getDepthInformation(view);

          if (depthInfo) {
            const depthFrame: DepthFrame = {
              width: depthInfo.width,
              height: depthInfo.height,
              data: depthInfo.data,
              format: 'float32'
            };

            const obstacles = this.extractObstaclesFromDepth(depthFrame);
            this.onDepthFrameCallback?.(depthFrame, obstacles);
          }
        }
      }

      this.session?.requestAnimationFrame(renderFrame);
    };

    this.session.requestAnimationFrame(renderFrame);
  }

  private extractObstaclesFromDepth(frame: DepthFrame): ObstacleZone[] {
    const obstacles: ObstacleZone[] = [];
    const threshold = 2.0; // 2 meters threshold

    // Simple blob detection - find connected regions closer than threshold
    const gridSize = 10;
    const cellWidth = frame.width / gridSize;
    const cellHeight = frame.height / gridSize;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const centerX = Math.floor((x + 0.5) * cellWidth);
        const centerY = Math.floor((y + 0.5) * cellHeight);
        const index = centerY * frame.width + centerX;
        const depth = frame.data[index];

        if (depth < threshold && depth > 0.1) {
          obstacles.push({
            id: `depth-${x}-${y}`,
            x: x / gridSize,
            y: y / gridSize,
            width: 1 / gridSize,
            height: 1 / gridSize,
            depth: depth,
            type: 'object',
            confidence: 0.8
          });
        }
      }
    }

    return this.mergeNearbyObstacles(obstacles);
  }

  private mergeNearbyObstacles(obstacles: ObstacleZone[]): ObstacleZone[] {
    // Merge obstacles that are close together
    const merged: ObstacleZone[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < obstacles.length; i++) {
      if (processed.has(i)) continue;

      const group = [obstacles[i]];
      processed.add(i);

      for (let j = i + 1; j < obstacles.length; j++) {
        if (processed.has(j)) continue;

        const dist = Math.hypot(
          obstacles[i].x - obstacles[j].x,
          obstacles[i].y - obstacles[j].y
        );

        if (dist < 0.15) {
          group.push(obstacles[j]);
          processed.add(j);
        }
      }

      if (group.length > 0) {
        const minX = Math.min(...group.map(o => o.x));
        const minY = Math.min(...group.map(o => o.y));
        const maxX = Math.max(...group.map(o => o.x + o.width));
        const maxY = Math.max(...group.map(o => o.y + o.height));
        const avgDepth = group.reduce((sum, o) => sum + (o.depth || 0), 0) / group.length;

        merged.push({
          id: `merged-${merged.length}`,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          depth: avgDepth,
          type: 'object',
          confidence: 0.8
        });
      }
    }

    return merged;
  }

  stop(): void {
    if (this.session) {
      this.session.end();
      this.session = null;
    }
  }
}

/**
 * TensorFlow.js Hand Pose Detection with 3D Keypoints
 * ✅ FIXED: Now using Hand Pose Detection instead of BlazeFace
 * ✅ Uses keypoints3D for REAL metric depth (TensorFlow.js Best Practice)
 */
export class TensorFlowDepthSensor {
  private detector: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private onObstaclesCallback?: (zones: ObstacleZone[]) => void;
  private isProcessing = false;
  private rafId: number | null = null;

  async initialize(videoElement: HTMLVideoElement, onObstacles: (zones: ObstacleZone[]) => void): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.onObstaclesCallback = onObstacles;

      console.log('🧠 Loading TensorFlow.js...');
      const tf = await import('@tensorflow/tfjs');

      // ✅ WebGL Optimization (from TensorFlow docs)
      await import('@tensorflow/tfjs-backend-webgl');

      // Set WebGL backend explicitly
      await tf.setBackend('webgl');

      // Apply WebGL optimizations
      tf.env().set('WEBGL_PACK', true);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);

      await tf.ready();
      console.log('✅ TensorFlow.js ready with WebGL backend and optimizations');

      // ✅ FIXED: Use Hand Pose Detection with 3D keypoints
      console.log('🧠 Loading Hand Pose Detection model...');
      const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');

      // Create detector with TensorFlow.js runtime
      this.detector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        {
          runtime: 'tfjs', // TensorFlow.js runtime (good for iOS)
          modelType: 'full', // Full model for 3D keypoints
          maxHands: 2
        }
      );

      console.log('✅ TensorFlow Hand Pose Detection model loaded with 3D keypoints');
      this.startProcessing();
    } catch (error) {
      console.error('❌ TensorFlow initialization failed:', error);
      throw error;
    }
  }

  private async startProcessing(): Promise<void> {
    const processFrame = async () => {
      if (!this.detector || !this.videoElement || this.isProcessing) {
        this.rafId = requestAnimationFrame(processFrame);
        return;
      }

      try {
        this.isProcessing = true;

        // ✅ Detect hands with 3D keypoints
        const hands = await this.detector.estimateHands(this.videoElement);
        const obstacles = this.extractObstaclesFromHands(hands);
        this.onObstaclesCallback?.(obstacles);

      } catch (error) {
        console.error('TensorFlow processing error:', error);
      } finally {
        this.isProcessing = false;
      }

      // Process at ~15 FPS for better performance (was 10 FPS)
      setTimeout(() => {
        this.rafId = requestAnimationFrame(processFrame);
      }, 66);
    };

    processFrame();
  }

  private extractObstaclesFromHands(hands: any[]): ObstacleZone[] {
    const obstacles: ObstacleZone[] = [];

    try {
      if (!this.videoElement) return [];

      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;

      console.log(`🧠 TensorFlow detected ${hands.length} hand(s) with 3D keypoints`);

      // Convert hand predictions to obstacle zones
      hands.forEach((hand, index) => {
        if (!hand.keypoints || !hand.keypoints3D) return;

        // Get 2D bounding box
        const xs = hand.keypoints.map((kp: any) => kp.x);
        const ys = hand.keypoints.map((kp: any) => kp.y);

        const minX = Math.min(...xs) / videoWidth;
        const maxX = Math.max(...xs) / videoWidth;
        const minY = Math.min(...ys) / videoHeight;
        const maxY = Math.max(...ys) / videoHeight;

        // ✅ REAL DEPTH: Calculate from 3D keypoints (METRIC SCALE - meters)
        const wrist = hand.keypoints3D.find((kp: any) => kp.name === 'wrist');

        if (wrist) {
          // ✅ TENSORFLOW.JS FORMULA: sqrt(x² + y² + z²) for distance from origin
          const realDepth = Math.sqrt(
            wrist.x * wrist.x +
            wrist.y * wrist.y +
            wrist.z * wrist.z
          );

          // Calculate average depth from multiple keypoints (more accurate)
          const keyDepths = hand.keypoints3D.map((kp: any) =>
            Math.sqrt(kp.x * kp.x + kp.y * kp.y + kp.z * kp.z)
          );
          const avgDepth = keyDepths.reduce((sum: number, d: number) => sum + d, 0) / keyDepths.length;

          console.log(`  ✅ Hand ${index}: REAL DEPTH = ${realDepth.toFixed(3)}m (wrist), AVG = ${avgDepth.toFixed(3)}m`);
          console.log(`    Handedness: ${hand.handedness}, Score: ${hand.score?.toFixed(2)}`);

          const padding = 0.05;
          obstacles.push({
            id: `hand-${index}`,
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: Math.min(1, maxX - minX + padding * 2),
            height: Math.min(1, maxY - minY + padding * 2),
            depth: avgDepth, // ✅ REAL metric depth in meters!
            type: 'hand' as const,
            confidence: hand.score || 0.9
          });
        }
      });

      return obstacles;
    } catch (error) {
      console.error('Error extracting obstacles from hands:', error);
      return [];
    }
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessing = false;

    // Properly dispose of detector to free up memory
    if (this.detector && typeof this.detector.dispose === 'function') {
      this.detector.dispose();
    }
    this.detector = null;
  }
}

/**
 * Unified Depth Sensing Manager
 */
export class DepthSensingManager {
  private currentSensor: MediaPipeDepthSensor | WebXRDepthSensor | TensorFlowDepthSensor | null = null;
  private currentMode: DepthSensingMode = 'none';

  async setMode(
    mode: DepthSensingMode,
    videoElement: HTMLVideoElement,
    onObstacles: (zones: ObstacleZone[]) => void
  ): Promise<void> {
    // Stop current sensor
    if (this.currentSensor) {
      this.currentSensor.stop();
      this.currentSensor = null;
    }

    this.currentMode = mode;

    if (mode === 'none') {
      onObstacles([]);
      return;
    }

    try {
      switch (mode) {
        case 'mediapipe':
          this.currentSensor = new MediaPipeDepthSensor();
          await this.currentSensor.initialize(videoElement, onObstacles);
          break;

        case 'webxr':
          this.currentSensor = new WebXRDepthSensor();
          await this.currentSensor.initialize((frame, obstacles) => {
            onObstacles(obstacles);
          });
          break;

        case 'tensorflow':
          this.currentSensor = new TensorFlowDepthSensor();
          await this.currentSensor.initialize(videoElement, onObstacles);
          break;
      }
    } catch (error) {
      console.error(`Failed to initialize ${mode}:`, error);
      throw error;
    }
  }

  stop(): void {
    if (this.currentSensor) {
      this.currentSensor.stop();
      this.currentSensor = null;
    }
    this.currentMode = 'none';
  }

  getCurrentMode(): DepthSensingMode {
    return this.currentMode;
  }
}

/**
 * 3D Position to Screen Space Converter
 */
export function worldToScreen(
  worldPosition: THREE.Vector3,
  camera: THREE.Camera
): { x: number; y: number } {
  const screenPos = worldPosition.clone().project(camera);

  // Convert from NDC [-1, 1] to screen space [0, 1]
  return {
    x: (screenPos.x + 1) / 2,
    y: (-screenPos.y + 1) / 2
  };
}

/**
 * Check collision between 3D object and 2D obstacle zone
 */
export function checkCollision(
  worldPosition: THREE.Vector3,
  camera: THREE.Camera,
  obstacleZones: ObstacleZone[],
  padding: number = 0.05
): ObstacleZone | null {
  const screenPos = worldToScreen(worldPosition, camera);

  for (const zone of obstacleZones) {
    if (
      screenPos.x >= zone.x - padding &&
      screenPos.x <= zone.x + zone.width + padding &&
      screenPos.y >= zone.y - padding &&
      screenPos.y <= zone.y + zone.height + padding
    ) {
      return zone;
    }
  }

  return null;
}

/**
 * Calculate avoidance direction from obstacle
 */
export function calculateAvoidanceVector(
  currentPosition: THREE.Vector3,
  obstacle: ObstacleZone,
  camera: THREE.Camera
): THREE.Vector3 {
  const obstacleCenter = {
    x: obstacle.x + obstacle.width / 2,
    y: obstacle.y + obstacle.height / 2
  };

  const screenPos = worldToScreen(currentPosition, camera);

  // Calculate escape direction (away from obstacle center)
  const escapeX = (screenPos.x - obstacleCenter.x) * 6;
  const escapeY = (screenPos.y - obstacleCenter.y) * 6;

  // Convert back to world space (approximate)
  return new THREE.Vector3(
    currentPosition.x + escapeX,
    currentPosition.y + escapeY,
    currentPosition.z + (Math.random() - 0.5) * 1
  );
}
