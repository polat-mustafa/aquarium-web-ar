/**
 * VideoRecordingService - Professional OOP implementation
 * Singleton service for managing video recording lifecycle
 */

import html2canvas from 'html2canvas';

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private canvasStream: MediaStream | null = null;
  private onDataCallback: ((blob: Blob) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private webglCanvasWarned: boolean = false;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private frameCount: number = 0;
  private overlayUpdateInterval: number = 1; // Update overlay every frame for accurate capture
  private isCapturingOverlay: boolean = false;

  constructor() {
    console.log('📹 RecordingManager initialized');
  }

  /**
   * Initialize recording with video stream and AR overlay
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    try {
      if (!videoElement?.srcObject) {
        throw new Error('No video stream available');
      }

      this.videoElement = videoElement;
      this.stream = videoElement.srcObject as MediaStream;

      if (!this.stream.active) {
        throw new Error('Video stream is not active');
      }

      // Create offscreen canvas for compositing
      this.canvas = document.createElement('canvas');
      this.canvas.width = videoElement.videoWidth || 1280;
      this.canvas.height = videoElement.videoHeight || 720;
      this.ctx = this.canvas.getContext('2d', { alpha: true });

      if (!this.ctx) {
        throw new Error('Failed to get canvas context');
      }

      console.log('✅ Canvas created:', this.canvas.width, 'x', this.canvas.height);

      // Find best supported MIME type
      const mimeType = this.getSupportedMimeType();

      // Note: We'll create the MediaRecorder when recording starts
      // so we can use the canvas stream
      console.log('✅ RecordingManager ready with', mimeType);
    } catch (error) {
      console.error('❌ RecordingManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the best supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    throw new Error('No supported video MIME type found');
  }

  /**
   * Setup MediaRecorder event handlers
   */
  private setupEventHandlers(mimeType: string): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
        console.log('📦 Chunk received:', event.data.size, 'bytes');
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('⏹️ Recording stopped, processing', this.chunks.length, 'chunks');

      if (this.chunks.length === 0) {
        const error = new Error('No video data recorded');
        this.onErrorCallback?.(error);
        return;
      }

      const blob = new Blob(this.chunks, { type: mimeType });
      console.log('✅ Video blob created:', blob.size, 'bytes');

      this.onDataCallback?.(blob);
      this.chunks = [];
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Recording error:', event);
      this.onErrorCallback?.(new Error('Recording failed'));
    };
  }

  /**
   * Capture overlay elements (speech bubbles, effects) using html2canvas
   */
  private async captureOverlay(): Promise<void> {
    // Prevent multiple simultaneous captures
    if (this.isCapturingOverlay) return;

    // Find all overlay elements we want to capture
    const overlayContainer = document.getElementById('ar-overlay-content');
    if (!overlayContainer) {
      return;
    }

    this.isCapturingOverlay = true;

    try {
      // Create a temporary canvas if needed
      if (!this.overlayCanvas) {
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.width = this.canvas?.width || window.innerWidth;
        this.overlayCanvas.height = this.canvas?.height || window.innerHeight;
        console.log('🎨 Overlay canvas created:', this.overlayCanvas.width, 'x', this.overlayCanvas.height);
      }

      const canvas = await html2canvas(overlayContainer, {
        backgroundColor: null, // Transparent background
        logging: false,
        width: this.overlayCanvas.width,
        height: this.overlayCanvas.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scale: 0.5, // Reduce quality for performance
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false, // Disable for better compatibility
        removeContainer: false,
        ignoreElements: (element) => {
          // Skip WebGL canvas to avoid duplicate rendering
          return element.tagName === 'CANVAS';
        }
      });

      // Copy to our overlay canvas
      const ctx = this.overlayCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        ctx.drawImage(canvas, 0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      }
    } catch (error) {
      console.error('❌ Failed to capture overlay:', error);
    } finally {
      this.isCapturingOverlay = false;
    }
  }

  /**
   * Composite video and AR overlay onto canvas
   */
  private compositeFrame(): void {
    if (!this.canvas || !this.ctx || !this.videoElement) return;

    this.frameCount++;

    // Clear canvas to transparent
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw camera video (mirrored like in UI)
    this.ctx.save();
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(this.videoElement, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    // Find the WebGL canvas from ARViewer (React Three Fiber)
    // CRITICAL: Do NOT call getContext() - it will break the existing Three.js context!
    let webglCanvas: HTMLCanvasElement | null = null;
    const allCanvases = document.querySelectorAll('canvas');

    for (const canvas of allCanvases) {
      // Skip our compositing canvas and overlay canvas
      if (canvas === this.canvas || canvas === this.overlayCanvas) continue;

      // Look for Three.js canvas - it should be the largest canvas that's not ours
      // and should have reasonable dimensions
      if (canvas.width > 0 && canvas.height > 0) {
        // Check if it's likely a WebGL canvas by checking its parent or class
        const parent = canvas.parentElement;
        const hasWebGLIndicators =
          canvas.getAttribute('data-engine')?.includes('three') ||
          parent?.className.includes('r3f') ||
          canvas.width === window.innerWidth && canvas.height === window.innerHeight;

        if (hasWebGLIndicators || allCanvases.length >= 2) {
          webglCanvas = canvas;
          if (!this.webglCanvasWarned) {
            console.log('🎨 Found WebGL canvas:', {
              width: canvas.width,
              height: canvas.height,
              dataEngine: canvas.getAttribute('data-engine')
            });
            this.webglCanvasWarned = true;
          }
          break;
        }
      }
    }

    if (webglCanvas) {
      try {
        // Draw the WebGL 3D canvas on top of video
        this.ctx.drawImage(webglCanvas, 0, 0, this.canvas.width, this.canvas.height);
      } catch (error) {
        console.error('❌ Failed to draw WebGL canvas:', error);
      }
    }

    // Update overlay capture every N frames for performance
    if (this.frameCount % this.overlayUpdateInterval === 0) {
      this.captureOverlay(); // Async, but we use the previous frame's overlay
    }

    // Draw cached overlay on top if available
    if (this.overlayCanvas) {
      try {
        this.ctx.drawImage(this.overlayCanvas, 0, 0, this.canvas.width, this.canvas.height);
      } catch (error) {
        console.error('❌ Failed to draw overlay:', error);
      }
    }

    // Continue animation loop
    if (this.animationFrameId !== null) {
      this.animationFrameId = requestAnimationFrame(() => this.compositeFrame());
    }
  }

  /**
   * Start recording with AR overlay
   */
  start(): void {
    console.log('🎬 Starting recording...');

    if (!this.canvas || !this.ctx) {
      throw new Error('RecordingManager not initialized');
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recording already in progress');
    }

    console.log('📺 Recording canvas size:', this.canvas.width, 'x', this.canvas.height);
    console.log('🎥 Video element size:', this.videoElement?.videoWidth, 'x', this.videoElement?.videoHeight);

    // Reset warning flag and frame counter
    this.webglCanvasWarned = false;
    this.frameCount = 0;
    this.overlayCanvas = null;
    this.isCapturingOverlay = false;

    // Start compositing frames
    this.animationFrameId = requestAnimationFrame(() => this.compositeFrame());

    // Get stream from canvas
    const fps = 30;
    this.canvasStream = this.canvas.captureStream(fps);

    if (!this.canvasStream) {
      throw new Error('Failed to capture canvas stream');
    }

    // Create MediaRecorder with canvas stream
    const mimeType = this.getSupportedMimeType();
    this.mediaRecorder = new MediaRecorder(this.canvasStream, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    this.setupEventHandlers(mimeType);

    this.chunks = [];
    this.mediaRecorder.start(1000); // Collect data every second
    console.log('✅ Recording started with AR overlay at', fps, 'fps, mimeType:', mimeType);
  }

  /**
   * Stop recording
   */
  stop(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      console.warn('⚠️ No active recording to stop');
      return;
    }

    this.mediaRecorder.stop();
  }

  /**
   * Set callback for video data
   */
  onData(callback: (blob: Blob) => void): void {
    this.onDataCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    // Stop canvas stream tracks
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach(track => track.stop());
      this.canvasStream = null;
    }

    this.mediaRecorder = null;
    this.chunks = [];
    this.canvas = null;
    this.ctx = null;
    this.overlayCanvas = null;
    this.frameCount = 0;
    this.isCapturingOverlay = false;
    console.log('🧹 RecordingManager cleaned up');
  }
}

export class BlobManager {
  private videoBlob: Blob | null = null;
  private videoUrl: string | null = null;

  constructor() {
    console.log('💾 BlobManager initialized');
  }

  /**
   * Store video blob and create URL
   */
  store(blob: Blob): string {
    // Clean up previous
    this.cleanup();

    this.videoBlob = blob;
    this.videoUrl = URL.createObjectURL(blob);

    console.log('✅ Blob stored:', {
      size: blob.size,
      type: blob.type,
      url: this.videoUrl,
    });

    return this.videoUrl;
  }

  /**
   * Get stored blob
   */
  getBlob(): Blob | null {
    return this.videoBlob;
  }

  /**
   * Get blob URL
   */
  getUrl(): string | null {
    return this.videoUrl;
  }

  /**
   * Check if blob exists
   */
  hasBlob(): boolean {
    return this.videoBlob !== null && this.videoBlob.size > 0;
  }

  /**
   * Get blob size in KB
   */
  getSizeKB(): number {
    return this.videoBlob ? Math.round(this.videoBlob.size / 1024) : 0;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
      console.log('🗑️ Blob URL revoked');
    }
    this.videoBlob = null;
    this.videoUrl = null;
  }
}

export class ShareManager {
  /**
   * Download video blob
   */
  download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log('✅ Download initiated:', fileName);
  }

  /**
   * Share on social media
   */
  shareOnSocial(platform: 'twitter' | 'facebook' | 'whatsapp', message: string, url: string): void {
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
      console.log('✅ Share opened:', platform);
    }
  }

  /**
   * Generate filename with timestamp
   */
  generateFileName(prefix: string, extension: string = 'webm'): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return `${prefix}-${timestamp}.${extension}`;
  }
}

/**
 * Main VideoRecordingService - Singleton
 */
export class VideoRecordingService {
  private static instance: VideoRecordingService | null = null;

  public recording: RecordingManager;
  public blob: BlobManager;
  public share: ShareManager;

  private constructor() {
    this.recording = new RecordingManager();
    this.blob = new BlobManager();
    this.share = new ShareManager();
    console.log('🎬 VideoRecordingService initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): VideoRecordingService {
    if (!VideoRecordingService.instance) {
      VideoRecordingService.instance = new VideoRecordingService();
    }
    return VideoRecordingService.instance;
  }

  /**
   * Reset all managers
   */
  reset(): void {
    this.recording.cleanup();
    this.blob.cleanup();
    console.log('🔄 VideoRecordingService reset');
  }
}

// Export singleton instance
export const videoService = VideoRecordingService.getInstance();
