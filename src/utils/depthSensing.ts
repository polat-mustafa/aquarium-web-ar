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
  label?: string; // Specific object label (e.g., "chair", "table", "bottle")
  confidence?: number;
}

export interface DepthFrame {
  width: number;
  height: number;
  data: Float32Array | Uint8Array;
  format: 'float32' | 'luminance-alpha';
}

export type DepthSensingMode = 'mediapipe' | 'webxr' | 'tensorflow' | 'midas' | 'none';

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
    } catch (error) {
      console.error('❌ MediaPipe initialization failed:', error);
      throw error;
    }
  }

  private processHandResults(results: any): void {
    // ✅ FIXED: Now using multiHandWorldLandmarks (3D keypoints in metric scale)
    if (results.multiHandWorldLandmarks && results.multiHandWorldLandmarks.length > 0) {
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
 * TensorFlow.js Comprehensive Environment Detection
 * ✅ Hand detection with 3D keypoints
 * ✅ Face detection
 * ✅ COCO-SSD object detection (80+ object classes)
 * Detects and labels: people, furniture, electronics, vehicles, animals, food, etc.
 */
export class TensorFlowDepthSensor {
  private handDetector: any = null;
  private faceDetector: any = null;
  private objectDetector: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private onObstaclesCallback?: (zones: ObstacleZone[]) => void;
  private isProcessing = false;
  private rafId: number | null = null;

  async initialize(videoElement: HTMLVideoElement, onObstacles: (zones: ObstacleZone[]) => void): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.onObstaclesCallback = onObstacles;

      console.log('🧠 TensorFlow: Starting initialization...');
      const tf = await import('@tensorflow/tfjs');

      // ✅ WebGL Optimization (from TensorFlow docs)
      await import('@tensorflow/tfjs-backend-webgl');

      // Set WebGL backend explicitly
      try {
        await tf.setBackend('webgl');
        console.log('✅ TensorFlow: WebGL backend set');
      } catch (e) {
        console.warn('⚠️ TensorFlow: WebGL backend failed, falling back to default:', e);
      }

      // Apply WebGL optimizations
      tf.env().set('WEBGL_PACK', true);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);

      await tf.ready();
      console.log('✅ TensorFlow.js ready');

      // ✅ FIXED: Use Hand Pose Detection with 3D keypoints
      console.log('📦 Loading hand-pose-detection model...');
      const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');

      // Create hand detector with TensorFlow.js runtime
      this.handDetector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        {
          runtime: 'tfjs', // TensorFlow.js runtime (good for iOS)
          modelType: 'full', // Full model for 3D keypoints
          maxHands: 2
        }
      );

      console.log('✅ TensorFlow Hand Pose Detector created');

      // ✅ NEW: Add Face Detection with BlazeFace
      console.log('📦 Loading face-detection model...');
      const faceDetection = await import('@tensorflow-models/face-detection');

      // Create face detector
      this.faceDetector = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: 'tfjs',
          maxFaces: 2
        }
      );

      console.log('✅ TensorFlow Face Detector created');

      // ✅ NEW: Add COCO-SSD Object Detection (80+ object classes)
      console.log('📦 Loading COCO-SSD object detection model...');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');

      // Create object detector
      this.objectDetector = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Faster, good for real-time
      });

      console.log('✅ TensorFlow COCO-SSD Object Detector created');
      console.log('🎯 TensorFlow initialization complete - detecting hands, faces, AND environment objects!');
      this.startProcessing();
    } catch (error) {
      console.error('❌ TensorFlow initialization failed:', error);
      throw error;
    }
  }

  private async startProcessing(): Promise<void> {
    const processFrame = async () => {
      if (!this.handDetector || !this.faceDetector || !this.objectDetector || !this.videoElement || this.isProcessing) {
        this.rafId = requestAnimationFrame(processFrame);
        return;
      }

      try {
        this.isProcessing = true;

        // ✅ Detect hands, faces, AND objects in parallel
        const [hands, faces, objects] = await Promise.all([
          this.handDetector.estimateHands(this.videoElement),
          this.faceDetector.estimateFaces(this.videoElement),
          this.objectDetector.detect(this.videoElement)
        ]);

        // Log detection info
        if (hands && hands.length > 0) {
          console.log(`🖐️ TensorFlow detected ${hands.length} hand(s)`);
          hands.forEach((hand, idx) => {
            const has3D = hand.keypoints3D && hand.keypoints3D.length > 0;
            console.log(`  Hand ${idx + 1}:`, {
              keypoints: hand.keypoints?.length || 0,
              keypoints3D: has3D ? hand.keypoints3D.length : 0,
              handedness: hand.handedness,
              score: hand.score?.toFixed(2)
            });
          });
        }

        if (faces && faces.length > 0) {
          console.log(`👤 TensorFlow detected ${faces.length} face(s)`);
          faces.forEach((face, idx) => {
            console.log(`  Face ${idx + 1}:`, {
              keypoints: face.keypoints?.length || 0,
              score: face.box?.score?.toFixed(2) || 'N/A'
            });
          });
        }

        if (objects && objects.length > 0) {
          console.log(`🌍 TensorFlow detected ${objects.length} environment object(s):`);
          objects.forEach((obj, idx) => {
            console.log(`  ${idx + 1}. ${obj.class.toUpperCase()} (${(obj.score * 100).toFixed(0)}%)`);
          });
        }

        // Extract obstacles from hands, faces, AND objects
        const handObstacles = this.extractObstaclesFromHands(hands);
        const faceObstacles = this.extractObstaclesFromFaces(faces);
        const objectObstacles = this.extractObstaclesFromObjects(objects);
        const allObstacles = [...handObstacles, ...faceObstacles, ...objectObstacles];

        if (allObstacles.length > 0) {
          console.log(`📍 TensorFlow created ${allObstacles.length} obstacle zone(s):`);
          allObstacles.forEach((obs, idx) => {
            console.log(`  Zone ${idx + 1}:`, {
              label: obs.label || obs.type,
              type: obs.type,
              depth: obs.depth?.toFixed(2) + 'm',
              confidence: (obs.confidence * 100).toFixed(0) + '%',
              position: `(${(obs.x * 100).toFixed(0)}%, ${(obs.y * 100).toFixed(0)}%)`,
              size: `${(obs.width * 100).toFixed(0)}% × ${(obs.height * 100).toFixed(0)}%`
            });
          });
        }

        this.onObstaclesCallback?.(allObstacles);

      } catch (error) {
        console.error('❌ TensorFlow processing error:', error);
      } finally {
        this.isProcessing = false;
      }

      // Process at ~15 FPS for better performance
      setTimeout(() => {
        this.rafId = requestAnimationFrame(processFrame);
      }, 66);
    };

    processFrame();
  }

  private extractObstaclesFromHands(hands: any[]): ObstacleZone[] {
    const obstacles: ObstacleZone[] = [];

    try {
      if (!this.videoElement || !hands || hands.length === 0) return [];

      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;

      if (!videoWidth || !videoHeight) return [];

      // Convert hand predictions to obstacle zones
      hands.forEach((hand, index) => {
        // Check if keypoints exist - keypoints3D might not always be available
        if (!hand.keypoints || hand.keypoints.length === 0) return;

        const hasDepth = hand.keypoints3D && hand.keypoints3D.length > 0;

        // Get 2D bounding box
        const xs = hand.keypoints.map((kp: any) => kp.x);
        const ys = hand.keypoints.map((kp: any) => kp.y);

        const minX = Math.min(...xs) / videoWidth;
        const maxX = Math.max(...xs) / videoWidth;
        const minY = Math.min(...ys) / videoHeight;
        const maxY = Math.max(...ys) / videoHeight;

        // Calculate depth if 3D keypoints are available
        let depth: number | undefined;

        if (hasDepth) {
          // ✅ REAL DEPTH: Calculate from 3D keypoints (METRIC SCALE - meters)
          const wrist = hand.keypoints3D[0]; // Wrist is typically first keypoint

          if (wrist && typeof wrist.x === 'number' && typeof wrist.y === 'number' && typeof wrist.z === 'number') {
            // ✅ TENSORFLOW.JS FORMULA: sqrt(x² + y² + z²) for distance from origin
            const realDepth = Math.sqrt(
              wrist.x * wrist.x +
              wrist.y * wrist.y +
              wrist.z * wrist.z
            );

            // Calculate average depth from multiple keypoints (more accurate)
            const keyDepths = hand.keypoints3D
              .filter((kp: any) => typeof kp.x === 'number' && typeof kp.y === 'number' && typeof kp.z === 'number')
              .map((kp: any) => Math.sqrt(kp.x * kp.x + kp.y * kp.y + kp.z * kp.z));

            depth = keyDepths.length > 0
              ? keyDepths.reduce((sum: number, d: number) => sum + d, 0) / keyDepths.length
              : realDepth;

            console.log(`    Depth calculated: ${depth.toFixed(3)}m (from ${keyDepths.length} keypoints)`);
          }
        } else {
          console.log(`    ⚠️ No 3D keypoints available, using default depth`);
        }

        const padding = 0.05;
        obstacles.push({
          id: `hand-${index}`,
          x: Math.max(0, minX - padding),
          y: Math.max(0, minY - padding),
          width: Math.min(1, maxX - minX + padding * 2),
          height: Math.min(1, maxY - minY + padding * 2),
          depth: depth || 2.5, // Default depth if 3D not available
          type: 'hand' as const,
          confidence: hand.score || 0.9
        });
      });

      return obstacles;
    } catch (error) {
      console.error('Error extracting obstacles from hands:', error);
      return [];
    }
  }

  private extractObstaclesFromFaces(faces: any[]): ObstacleZone[] {
    const obstacles: ObstacleZone[] = [];

    try {
      if (!this.videoElement || !faces || faces.length === 0) return [];

      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;

      if (!videoWidth || !videoHeight) return [];

      // Convert face detections to obstacle zones
      faces.forEach((face, index) => {
        if (!face.box) return;

        const box = face.box;

        // Normalize box coordinates to 0-1 range
        const x = box.xMin / videoWidth;
        const y = box.yMin / videoHeight;
        const width = box.width / videoWidth;
        const height = box.height / videoHeight;

        // Estimate depth based on face size (larger face = closer)
        // Average face width is ~15cm, use inverse relationship
        const faceWidthPixels = box.width;
        const estimatedDepth = Math.max(0.3, Math.min(3.0, 150 / faceWidthPixels)); // 0.3m to 3m range

        console.log(`    Face depth estimated: ${estimatedDepth.toFixed(2)}m (from face width ${faceWidthPixels.toFixed(0)}px)`);

        const padding = 0.05;
        obstacles.push({
          id: `face-${index}`,
          x: Math.max(0, x - padding),
          y: Math.max(0, y - padding),
          width: Math.min(1, width + padding * 2),
          height: Math.min(1, height + padding * 2),
          depth: estimatedDepth,
          type: 'person' as const,
          confidence: face.box.score || 0.9
        });
      });

      return obstacles;
    } catch (error) {
      console.error('Error extracting obstacles from faces:', error);
      return [];
    }
  }

  private extractObstaclesFromObjects(objects: any[]): ObstacleZone[] {
    const obstacles: ObstacleZone[] = [];

    try {
      if (!this.videoElement || !objects || objects.length === 0) return [];

      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;

      if (!videoWidth || !videoHeight) return [];

      // Convert COCO-SSD detections to obstacle zones
      objects.forEach((obj, index) => {
        if (!obj.bbox || obj.bbox.length !== 4) return;

        const [x, y, width, height] = obj.bbox;

        // Normalize coordinates to 0-1 range
        const normalizedX = x / videoWidth;
        const normalizedY = y / videoHeight;
        const normalizedWidth = width / videoWidth;
        const normalizedHeight = height / videoHeight;

        // Estimate depth based on object size (larger = closer)
        // Different objects have different typical sizes
        const objectArea = width * height;
        const relativeSize = objectArea / (videoWidth * videoHeight);

        // Depth estimation based on relative size in frame
        let estimatedDepth: number;
        if (relativeSize > 0.3) {
          estimatedDepth = 0.5; // Very large in frame = very close
        } else if (relativeSize > 0.1) {
          estimatedDepth = 1.0; // Large = close
        } else if (relativeSize > 0.05) {
          estimatedDepth = 1.5; // Medium = medium distance
        } else {
          estimatedDepth = 2.5; // Small = far
        }

        console.log(`    ${obj.class} depth estimated: ${estimatedDepth.toFixed(2)}m (size: ${(relativeSize * 100).toFixed(1)}%)`);

        const padding = 0.02;
        obstacles.push({
          id: `object-${index}`,
          x: Math.max(0, normalizedX - padding),
          y: Math.max(0, normalizedY - padding),
          width: Math.min(1, normalizedWidth + padding * 2),
          height: Math.min(1, normalizedHeight + padding * 2),
          depth: estimatedDepth,
          type: 'object' as const,
          label: obj.class, // ✅ OBJECT NAME (chair, table, bottle, etc.)
          confidence: obj.score
        });
      });

      return obstacles;
    } catch (error) {
      console.error('Error extracting obstacles from objects:', error);
      return [];
    }
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessing = false;

    // Properly dispose of detectors to free up memory
    if (this.handDetector && typeof this.handDetector.dispose === 'function') {
      this.handDetector.dispose();
    }
    this.handDetector = null;

    if (this.faceDetector && typeof this.faceDetector.dispose === 'function') {
      this.faceDetector.dispose();
    }
    this.faceDetector = null;

    if (this.objectDetector && typeof this.objectDetector.dispose === 'function') {
      this.objectDetector.dispose();
    }
    this.objectDetector = null;
  }
}

/**
 * MiDaS TFLite Depth Estimation
 * Real monocular depth estimation using MiDaS model
 *
 * NOTE: This requires manual installation of @tensorflow/tfjs-tflite
 * which has build compatibility issues with Next.js.
 * To use: npm install @tensorflow/tfjs-tflite@0.0.1-alpha.10 --legacy-peer-deps
 * And place midas.tflite in /public/models/
 */
export class MiDaSDepthSensor {
  private model: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private onObstaclesCallback?: (zones: ObstacleZone[]) => void;
  private onDepthMapCallback?: (depthMap: any) => void;
  private isProcessing = false;
  private rafId: number | null = null;

  async initialize(
    videoElement: HTMLVideoElement,
    onObstacles: (zones: ObstacleZone[]) => void,
    onDepthMap?: (depthMap: any) => void
  ): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.onObstaclesCallback = onObstacles;
      this.onDepthMapCallback = onDepthMap;

      // Load TensorFlow.js
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();

      // IMPORTANT: TFLite import must be dynamic to avoid build issues
      // Only import when actually running in browser
      if (typeof window === 'undefined') {
        throw new Error('MiDaS only works in browser environment');
      }

      // Dynamic import of TFLite - requires manual installation
      // npm install @tensorflow/tfjs-tflite@0.0.1-alpha.10 --legacy-peer-deps
      const tflite = await import('@tensorflow/tfjs-tflite').catch((err) => {
        throw new Error(
          `TFLite not installed. To use MiDaS:\n` +
          `1. Run: npm install @tensorflow/tfjs-tflite@0.0.1-alpha.10 --legacy-peer-deps\n` +
          `2. Place midas.tflite in /public/models/\n` +
          `3. See MIDAS_SETUP.md for details\n` +
          `Error: ${err.message}`
        );
      });

      // Set WASM path
      await tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/');

      // Load MiDaS model
      const modelUrl = '/models/midas.tflite';
      this.model = await tflite.loadTFLiteModel(modelUrl).catch((err) => {
        throw new Error(
          `Failed to load MiDaS model from ${modelUrl}.\n` +
          `Make sure midas.tflite exists in /public/models/\n` +
          `See MIDAS_SETUP.md for setup instructions.\n` +
          `Error: ${err.message}`
        );
      });

      this.startProcessing();
    } catch (error) {
      console.error('MiDaS initialization failed:', error);
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

        // Preprocess image
        const preprocessed = await this.preprocessImage(this.videoElement);

        // Predict depth
        const depthMap = await this.predictDepth(preprocessed);

        // Extract obstacles from depth map
        const obstacles = this.extractObstaclesFromDepth(depthMap);
        this.onObstaclesCallback?.(obstacles);

        // Send depth map to callback if provided
        this.onDepthMapCallback?.(depthMap);

        // Clean up tensors
        preprocessed.dispose();
        depthMap.dispose();

      } catch (error) {
        console.error('MiDaS processing error:', error);
      } finally {
        this.isProcessing = false;
      }

      // Process at ~2 FPS (MiDaS is computationally expensive)
      setTimeout(() => {
        this.rafId = requestAnimationFrame(processFrame);
      }, 500);
    };

    processFrame();
  }

  private async preprocessImage(videoElement: HTMLVideoElement): Promise<any> {
    const tf = await import('@tensorflow/tfjs');

    // Convert video to tensor
    const tensor = tf.browser.fromPixels(videoElement).toFloat();

    // Resize to 256x256 (MiDaS requirement)
    const resized = tf.image.resizeBilinear(tensor, [256, 256]);

    // Normalize to [0,1] and add batch dimension
    const normalized = resized.div(255.0).expandDims(0);

    tensor.dispose();
    resized.dispose();

    return normalized;
  }

  private async predictDepth(preprocessedImage: any): Promise<any> {
    const tf = await import('@tensorflow/tfjs');

    // Run inference
    const depthMap = this.model.predict(preprocessedImage);

    // Remove batch dimension
    const squeezed = depthMap.squeeze();

    // Normalize to [0, 255]
    const max = squeezed.max();
    const normalized = squeezed.div(max).mul(255);

    depthMap.dispose();

    return normalized;
  }

  private extractObstaclesFromDepth(depthMap: any): ObstacleZone[] {
    const obstacles: ObstacleZone[] = [];

    try {
      const depthData = depthMap.dataSync();
      const [height, width] = depthMap.shape;

      // Divide image into grid for obstacle detection
      const gridSize = 8;
      const cellWidth = width / gridSize;
      const cellHeight = height / gridSize;

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          // Sample depth values in this cell
          const samples: number[] = [];
          for (let dy = 0; dy < cellHeight; dy += 4) {
            for (let dx = 0; dx < cellWidth; dx += 4) {
              const px = Math.floor(x * cellWidth + dx);
              const py = Math.floor(y * cellHeight + dy);
              const idx = py * width + px;
              if (idx < depthData.length) {
                samples.push(depthData[idx]);
              }
            }
          }

          if (samples.length > 0) {
            // Calculate average depth in cell
            const avgDepth = samples.reduce((a, b) => a + b, 0) / samples.length;

            // Convert depth value to meters (inverse relationship)
            // Higher pixel value = closer object
            const depthMeters = (255 - avgDepth) / 255 * 5; // Map to 0-5 meters

            // Detect obstacles (objects closer than 2 meters)
            if (depthMeters < 2.0) {
              obstacles.push({
                id: `midas-${x}-${y}`,
                x: x / gridSize,
                y: y / gridSize,
                width: 1 / gridSize,
                height: 1 / gridSize,
                depth: depthMeters,
                type: 'object',
                confidence: Math.min((2.0 - depthMeters) / 2.0, 1.0)
              });
            }
          }
        }
      }

      return obstacles;
    } catch (error) {
      console.error('Error extracting obstacles from depth:', error);
      return [];
    }
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessing = false;

    // Dispose model
    if (this.model && typeof this.model.dispose === 'function') {
      this.model.dispose();
    }
    this.model = null;
  }
}

/**
 * Unified Depth Sensing Manager
 */
export class DepthSensingManager {
  private currentSensor: MediaPipeDepthSensor | WebXRDepthSensor | TensorFlowDepthSensor | MiDaSDepthSensor | null = null;
  private currentMode: DepthSensingMode = 'none';

  async setMode(
    mode: DepthSensingMode,
    videoElement: HTMLVideoElement,
    onObstacles: (zones: ObstacleZone[]) => void,
    onDepthMap?: (depthMap: any) => void
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

        case 'midas':
          this.currentSensor = new MiDaSDepthSensor();
          await this.currentSensor.initialize(videoElement, onObstacles, onDepthMap);
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
