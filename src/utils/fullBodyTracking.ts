/**
 * Full Body Tracking System
 * Comprehensive tracking using MediaPipe and TensorFlow.js
 * Supports: Face, Hands, and Body/Pose tracking with full joint control
 */

export interface JointPoint {
  id: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  z?: number; // Depth (if available)
  visibility?: number; // 0-1 confidence
  type: 'face' | 'hand' | 'pose';
  label: string;
}

export interface TrackingResult {
  face: JointPoint[];
  leftHand: JointPoint[];
  rightHand: JointPoint[];
  pose: JointPoint[];
  timestamp: number;
}

export type TrackingMode = 'face' | 'hands' | 'pose' | 'all';

/**
 * Full Body Tracking Manager
 * Integrates MediaPipe Face Mesh, Hands, and Pose for comprehensive body tracking
 */
export class FullBodyTrackingManager {
  private videoElement: HTMLVideoElement | null = null;
  private faceMesh: any = null;
  private hands: any = null;
  private pose: any = null;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private onResultsCallback: ((results: TrackingResult) => void) | null = null;
  private activeMode: TrackingMode = 'all';

  constructor() {
    console.log('🎯 FullBodyTrackingManager initialized');
  }

  /**
   * Initialize tracking systems
   */
  async initialize(
    videoElement: HTMLVideoElement,
    mode: TrackingMode = 'all',
    onResults: (results: TrackingResult) => void
  ): Promise<void> {
    console.log(`🚀 Initializing Full Body Tracking (mode: ${mode})`);

    this.videoElement = videoElement;
    this.onResultsCallback = onResults;
    this.activeMode = mode;

    // Check video element is ready
    if (videoElement.readyState < 2) {
      throw new Error('Video element not ready');
    }

    // Dynamically import MediaPipe modules
    const [
      { FaceMesh },
      { Hands },
      { Pose },
    ] = await Promise.all([
      import('@mediapipe/face_mesh'),
      import('@mediapipe/hands'),
      import('@mediapipe/pose'),
    ]);

    // Initialize Face Mesh
    if (mode === 'face' || mode === 'all') {
      console.log('👤 Initializing Face Mesh...');
      const FaceMeshConstructor = (FaceMesh as any).default || FaceMesh;
      this.faceMesh = new FaceMeshConstructor({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    // Initialize Hands
    if (mode === 'hands' || mode === 'all') {
      console.log('✋ Initializing Hands...');
      const HandsConstructor = (Hands as any).default || Hands;
      this.hands = new HandsConstructor({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    // Initialize Pose
    if (mode === 'pose' || mode === 'all') {
      console.log('🧍 Initializing Pose...');
      const PoseConstructor = (Pose as any).default || Pose;
      this.pose = new PoseConstructor({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    console.log('✅ Full Body Tracking initialized successfully');
  }

  /**
   * Start tracking
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Tracking already running');
      return;
    }

    if (!this.videoElement) {
      throw new Error('Video element not set');
    }

    this.isRunning = true;
    console.log('▶️ Starting Full Body Tracking...');

    this.processFrame();
  }

  /**
   * Stop tracking
   */
  stop(): void {
    console.log('⏹️ Stopping Full Body Tracking');
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Cleanup
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
  }

  /**
   * Process each frame
   */
  private async processFrame(): Promise<void> {
    if (!this.isRunning || !this.videoElement) return;

    try {
      const results: TrackingResult = {
        face: [],
        leftHand: [],
        rightHand: [],
        pose: [],
        timestamp: Date.now(),
      };

      // Process Face Mesh
      if (this.faceMesh && (this.activeMode === 'face' || this.activeMode === 'all')) {
        await this.faceMesh.send({ image: this.videoElement });
        // Results will be processed in onFaceMeshResults callback
      }

      // Process Hands
      if (this.hands && (this.activeMode === 'hands' || this.activeMode === 'all')) {
        await this.hands.send({ image: this.videoElement });
        // Results will be processed in onHandsResults callback
      }

      // Process Pose
      if (this.pose && (this.activeMode === 'pose' || this.activeMode === 'all')) {
        await this.pose.send({ image: this.videoElement });
        // Results will be processed in onPoseResults callback
      }

      // Continue processing
      this.animationFrameId = requestAnimationFrame(() => this.processFrame());
    } catch (error) {
      console.error('Error processing frame:', error);
      this.animationFrameId = requestAnimationFrame(() => this.processFrame());
    }
  }

  /**
   * Set the active tracking mode
   */
  setMode(mode: TrackingMode): void {
    console.log(`🔄 Switching tracking mode to: ${mode}`);
    this.activeMode = mode;
  }

  /**
   * Get face landmark names
   */
  static getFaceLandmarkName(index: number): string {
    const landmarks: { [key: number]: string } = {
      0: 'Nose Tip',
      1: 'Nose Bridge',
      4: 'Left Eye Inner',
      5: 'Left Eye',
      6: 'Left Eye Outer',
      33: 'Right Eye Inner',
      133: 'Right Eye',
      159: 'Right Eye Outer',
      61: 'Mouth Left',
      291: 'Mouth Right',
      0: 'Chin',
      10: 'Forehead Center',
    };
    return landmarks[index] || `Face Point ${index}`;
  }

  /**
   * Get hand landmark names
   */
  static getHandLandmarkName(index: number): string {
    const landmarks = [
      'Wrist',
      'Thumb CMC',
      'Thumb MCP',
      'Thumb IP',
      'Thumb Tip',
      'Index MCP',
      'Index PIP',
      'Index DIP',
      'Index Tip',
      'Middle MCP',
      'Middle PIP',
      'Middle DIP',
      'Middle Tip',
      'Ring MCP',
      'Ring PIP',
      'Ring DIP',
      'Ring Tip',
      'Pinky MCP',
      'Pinky PIP',
      'Pinky DIP',
      'Pinky Tip',
    ];
    return landmarks[index] || `Hand Point ${index}`;
  }

  /**
   * Get pose landmark names
   */
  static getPoseLandmarkName(index: number): string {
    const landmarks = [
      'Nose',
      'Left Eye Inner',
      'Left Eye',
      'Left Eye Outer',
      'Right Eye Inner',
      'Right Eye',
      'Right Eye Outer',
      'Left Ear',
      'Right Ear',
      'Mouth Left',
      'Mouth Right',
      'Left Shoulder',
      'Right Shoulder',
      'Left Elbow',
      'Right Elbow',
      'Left Wrist',
      'Right Wrist',
      'Left Pinky',
      'Right Pinky',
      'Left Index',
      'Right Index',
      'Left Thumb',
      'Right Thumb',
      'Left Hip',
      'Right Hip',
      'Left Knee',
      'Right Knee',
      'Left Ankle',
      'Right Ankle',
      'Left Heel',
      'Right Heel',
      'Left Foot Index',
      'Right Foot Index',
    ];
    return landmarks[index] || `Pose Point ${index}`;
  }
}

/**
 * MediaPipe results processor
 */
export function processFaceMeshResults(results: any): JointPoint[] {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    return [];
  }

  const face = results.multiFaceLandmarks[0];
  return face.map((landmark: any, index: number) => ({
    id: `face-${index}`,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: 1,
    type: 'face' as const,
    label: FullBodyTrackingManager.getFaceLandmarkName(index),
  }));
}

export function processHandsResults(results: any): { left: JointPoint[]; right: JointPoint[] } {
  const left: JointPoint[] = [];
  const right: JointPoint[] = [];

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return { left, right };
  }

  results.multiHandLandmarks.forEach((hand: any, handIndex: number) => {
    const handedness = results.multiHandedness[handIndex].label; // 'Left' or 'Right'
    const points = hand.map((landmark: any, index: number) => ({
      id: `hand-${handedness}-${index}`,
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: 1,
      type: 'hand' as const,
      label: FullBodyTrackingManager.getHandLandmarkName(index),
    }));

    if (handedness === 'Left') {
      left.push(...points);
    } else {
      right.push(...points);
    }
  });

  return { left, right };
}

export function processPoseResults(results: any): JointPoint[] {
  if (!results.poseLandmarks) {
    return [];
  }

  return results.poseLandmarks.map((landmark: any, index: number) => ({
    id: `pose-${index}`,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility || 1,
    type: 'pose' as const,
    label: FullBodyTrackingManager.getPoseLandmarkName(index),
  }));
}

/**
 * Utility: Convert normalized coordinates to screen coordinates
 */
export function normalizedToScreen(
  normalized: { x: number; y: number },
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: normalized.x * width,
    y: normalized.y * height,
  };
}

/**
 * Utility: Calculate distance between two points
 */
export function calculateDistance(p1: JointPoint, p2: JointPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Utility: Calculate angle between three points
 */
export function calculateAngle(p1: JointPoint, p2: JointPoint, p3: JointPoint): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  const angle = Math.acos(dot / (mag1 * mag2));
  return (angle * 180) / Math.PI; // Convert to degrees
}

/**
 * Gesture detection utilities
 */
export const GestureDetection = {
  /**
   * Detect if hand is making a fist
   */
  isFist(handPoints: JointPoint[]): boolean {
    if (handPoints.length < 21) return false;

    // Check if all fingertips are close to palm
    const wrist = handPoints[0];
    const fingertips = [handPoints[4], handPoints[8], handPoints[12], handPoints[16], handPoints[20]];

    return fingertips.every(tip => calculateDistance(wrist, tip) < 0.15);
  },

  /**
   * Detect if hand is making a peace sign
   */
  isPeaceSign(handPoints: JointPoint[]): boolean {
    if (handPoints.length < 21) return false;

    const indexTip = handPoints[8];
    const middleTip = handPoints[12];
    const ringTip = handPoints[16];
    const pinkyTip = handPoints[20];
    const wrist = handPoints[0];

    // Index and middle extended, ring and pinky folded
    const indexExtended = calculateDistance(wrist, indexTip) > 0.2;
    const middleExtended = calculateDistance(wrist, middleTip) > 0.2;
    const ringFolded = calculateDistance(wrist, ringTip) < 0.15;
    const pinkyFolded = calculateDistance(wrist, pinkyTip) < 0.15;

    return indexExtended && middleExtended && ringFolded && pinkyFolded;
  },

  /**
   * Detect if hand is making thumbs up
   */
  isThumbsUp(handPoints: JointPoint[]): boolean {
    if (handPoints.length < 21) return false;

    const thumbTip = handPoints[4];
    const thumbBase = handPoints[2];

    // Thumb pointing up (y-coordinate of tip is less than base)
    return thumbTip.y < thumbBase.y - 0.1;
  },

  /**
   * Detect if person is waving
   */
  isWaving(handPoints: JointPoint[], previousHandPoints: JointPoint[] | null): boolean {
    if (!previousHandPoints || handPoints.length < 21 || previousHandPoints.length < 21) {
      return false;
    }

    const currentWrist = handPoints[0];
    const previousWrist = previousHandPoints[0];

    // Check horizontal movement
    const movement = Math.abs(currentWrist.x - previousWrist.x);
    return movement > 0.05; // Significant horizontal movement
  },
};
