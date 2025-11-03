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
 * MediaPipe Hand Detection
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

      this.hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      this.hands.onResults((results: any) => {
        this.processHandResults(results);
      });

      // Initialize hands model
      await this.hands.initialize();

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

      console.log('✅ MediaPipe initialized successfully');
    } catch (error) {
      console.error('❌ MediaPipe initialization failed:', error);
      throw error;
    }
  }

  private processHandResults(results: any): void {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const obstacles: ObstacleZone[] = results.multiHandLandmarks.map((landmarks: any, index: number) => {
        const xs = landmarks.map((lm: any) => lm.x);
        const ys = landmarks.map((lm: any) => lm.y);
        const zs = landmarks.map((lm: any) => lm.z);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const avgZ = zs.reduce((sum: number, z: number) => sum + z, 0) / zs.length;

        const padding = 0.05;
        return {
          id: `hand-${index}`,
          x: Math.max(0, minX - padding),
          y: Math.max(0, minY - padding),
          width: Math.min(1, maxX - minX + padding * 2),
          height: Math.min(1, maxY - minY + padding * 2),
          depth: Math.abs(avgZ) * 2, // Convert to approximate meters
          type: 'hand' as const,
          confidence: 0.9
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

      // Try to request session with depth sensing
      try {
        this.session = await xr.requestSession('immersive-ar', {
          requiredFeatures: ['depth-sensing'],
          optionalFeatures: ['hit-test', 'dom-overlay'],
          depthSensing: {
            usagePreference: ['cpu-optimized', 'gpu-optimized'],
            dataFormatPreference: ['luminance-alpha', 'float32']
          }
        });
      } catch (sessionError: any) {
        // More specific error for depth sensing
        if (sessionError.message.includes('configuration')) {
          throw new Error('Depth sensing not available. Requires Quest 3, Quest 3S, or ARCore-enabled Android device.');
        }
        throw new Error(`WebXR session failed: ${sessionError.message}`);
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
 * TensorFlow.js Depth Estimation
 */
export class TensorFlowDepthSensor {
  private model: any = null;
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
      await tf.ready();
      console.log('✅ TensorFlow.js ready');

      // Use blazeface for face detection (simpler and more reliable)
      console.log('🧠 Loading BlazeFace model...');
      const blazeface = await import('@tensorflow-models/blazeface');
      this.model = await blazeface.load();

      console.log('✅ TensorFlow BlazeFace model loaded');
      this.startProcessing();
    } catch (error) {
      console.error('❌ TensorFlow initialization failed:', error);
      throw error;
    }
  }

  private async startProcessing(): Promise<void> {
    const processFrame = async () => {
      if (!this.model || !this.videoElement || this.isProcessing) {
        this.rafId = requestAnimationFrame(processFrame);
        return;
      }

      try {
        this.isProcessing = true;

        // Detect faces using BlazeFace
        const predictions = await this.model.estimateFaces(this.videoElement, false);
        const obstacles = this.extractObstaclesFromFaces(predictions);
        this.onObstaclesCallback?.(obstacles);

      } catch (error) {
        console.error('TensorFlow processing error:', error);
      } finally {
        this.isProcessing = false;
      }

      // Process at ~10 FPS for performance
      setTimeout(() => {
        this.rafId = requestAnimationFrame(processFrame);
      }, 100);
    };

    processFrame();
  }

  private extractObstaclesFromFaces(predictions: any[]): ObstacleZone[] {
    const obstacles: ObstacleZone[] = [];

    try {
      if (!this.videoElement) return [];

      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;

      // Convert face predictions to obstacle zones
      predictions.forEach((prediction, index) => {
        // BlazeFace returns: topLeft, bottomRight, probability
        const start = prediction.topLeft;
        const end = prediction.bottomRight;
        const probability = prediction.probability;

        if (probability && probability[0] > 0.5) {
          // Convert to normalized coordinates (0-1)
          const x = start[0] / videoWidth;
          const y = start[1] / videoHeight;
          const width = (end[0] - start[0]) / videoWidth;
          const height = (end[1] - start[1]) / videoHeight;

          // Estimate depth based on face size (larger = closer)
          const faceArea = width * height;
          const estimatedDepth = Math.max(0.5, Math.min(5, 1 / (faceArea * 10)));

          obstacles.push({
            id: `face-${index}`,
            x: x,
            y: y,
            width: width,
            height: height,
            depth: estimatedDepth,
            type: 'person',
            confidence: probability[0]
          });
        }
      });

      return obstacles;
    } catch (error) {
      console.error('Error extracting obstacles from faces:', error);
      return [];
    }
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessing = false;
    this.model = null;
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
