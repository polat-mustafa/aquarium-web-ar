/**
 * VideoRecordingService - Professional OOP implementation
 * Singleton service for managing video recording lifecycle
 */

export interface OverlayData {
  bubbles: Array<{ id: number; x: number; y: number; opacity: number }>;
  speechBubble?: {
    text: string;
    x: number;
    y: number;
  };
  touchIndicator?: {
    text: string;
    x: number;
    y: number;
  };
}

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
  private overlayData: OverlayData = { bubbles: [] };
  private frameCount: number = 0;

  constructor() {
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


      // Find best supported MIME type
      const mimeType = this.getSupportedMimeType();

      // Note: We'll create the MediaRecorder when recording starts
      // so we can use the canvas stream
    } catch (error) {
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
      }
    };

    this.mediaRecorder.onstop = () => {

      if (this.chunks.length === 0) {
        const error = new Error('No video data recorded');
        this.onErrorCallback?.(error);
        return;
      }

      const blob = new Blob(this.chunks, { type: mimeType });

      this.onDataCallback?.(blob);
      this.chunks = [];
    };

    this.mediaRecorder.onerror = (event) => {
      this.onErrorCallback?.(new Error('Recording failed'));
    };
  }

  /**
   * Update overlay data from AR page
   */
  updateOverlayData(data: OverlayData): void {
    this.overlayData = data;
  }

  /**
   * Draw overlay elements directly onto canvas
   */
  private drawOverlays(ctx: CanvasRenderingContext2D): void {
    if (!this.overlayData) return;

    // Draw bubbles
    this.overlayData.bubbles.forEach(bubble => {
      const radius = 8;

      // Create gradient for bubble
      const gradient = ctx.createRadialGradient(
        bubble.x, bubble.y, 0,
        bubble.x, bubble.y, radius
      );
      gradient.addColorStop(0, `rgba(34, 211, 238, ${bubble.opacity * 0.6})`);
      gradient.addColorStop(0.5, `rgba(34, 211, 238, ${bubble.opacity * 0.4})`);
      gradient.addColorStop(1, `rgba(34, 211, 238, 0)`);

      // Draw bubble circle
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw bubble border
      ctx.strokeStyle = `rgba(103, 232, 249, ${bubble.opacity * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Draw speech bubble
    if (this.overlayData.speechBubble) {
      const { text, x, y } = this.overlayData.speechBubble;
      this.drawSpeechBubble(ctx, text, x, y);
    }

    // Draw touch indicator
    if (this.overlayData.touchIndicator) {
      const { text, x, y } = this.overlayData.touchIndicator;
      this.drawTouchIndicator(ctx, text, x, y);
    }
  }

  /**
   * Draw a fun cloud-style speech bubble
   */
  private drawSpeechBubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    const maxWidth = 280;
    const padding = 24;

    ctx.save();

    // Measure text
    ctx.font = 'bold 18px "Comic Sans MS", cursive';
    const lines = this.wrapText(ctx, text, maxWidth - padding * 2);
    const lineHeight = 28;
    const textHeight = lines.length * lineHeight;
    const bubbleWidth = maxWidth;
    const bubbleHeight = textHeight + padding * 2;

    // Position at top-center
    const bubbleX = x - bubbleWidth / 2;
    const bubbleY = y;

    // Draw main cloud body (white rounded rectangle)
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    this.roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 60);
    ctx.fill();

    // Draw cloud bumps (circles on top and sides)
    ctx.shadowBlur = 15;

    // Top bumps
    ctx.beginPath();
    ctx.arc(bubbleX + bubbleWidth * 0.25, bubbleY - 20, 32, 0, Math.PI * 2);
    ctx.arc(bubbleX + bubbleWidth * 0.45, bubbleY - 32, 40, 0, Math.PI * 2);
    ctx.arc(bubbleX + bubbleWidth * 0.75, bubbleY - 20, 28, 0, Math.PI * 2);
    // Side bumps
    ctx.arc(bubbleX - 16, bubbleY + bubbleHeight * 0.2, 24, 0, Math.PI * 2);
    ctx.arc(bubbleX + bubbleWidth + 16, bubbleY + bubbleHeight * 0.2, 24, 0, Math.PI * 2);
    ctx.fill();

    // Draw speech tail (3 circles)
    const tailX = bubbleX + bubbleWidth * 0.2;
    const tailY = bubbleY + bubbleHeight;
    ctx.beginPath();
    ctx.arc(tailX + 8, tailY - 8, 16, 0, Math.PI * 2);
    ctx.arc(tailX + 16, tailY + 2, 10, 0, Math.PI * 2);
    ctx.arc(tailX + 24, tailY + 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow for text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw gradient text
    const gradient = ctx.createLinearGradient(bubbleX, bubbleY, bubbleX + bubbleWidth, bubbleY);
    gradient.addColorStop(0, '#2563eb');    // blue-600
    gradient.addColorStop(0.5, '#9333ea');  // purple-600
    gradient.addColorStop(1, '#db2777');    // pink-600

    ctx.fillStyle = gradient;
    ctx.font = 'bold 18px "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text lines
    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        bubbleX + bubbleWidth / 2,
        bubbleY + padding + lineHeight / 2 + i * lineHeight
      );
    });

    // Draw sparkles
    ctx.font = '20px serif';
    ctx.fillText('✨', bubbleX - 8, bubbleY - 8);
    ctx.fillText('⭐', bubbleX + bubbleWidth + 8, bubbleY - 12);
    ctx.fillText('💫', bubbleX + 12, bubbleY + bubbleHeight - 8);

    ctx.restore();
  }

  /**
   * Draw touch indicator
   */
  private drawTouchIndicator(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 8;
    this.roundRect(ctx, x - 60, y - 20, 120, 40, 20);
    ctx.fill();

    // Emoji
    ctx.shadowBlur = 0;
    ctx.font = '20px serif';
    ctx.fillText('👆', x - 30, y);

    // Text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x - 5, y);

    ctx.restore();
  }

  /**
   * Helper to draw rounded rectangle
   */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Wrap text to fit within maxWidth
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
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
      // Skip our compositing canvas
      if (canvas === this.canvas) continue;

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
            console.log('Found WebGL canvas:', {
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
      }
    }

    // Draw overlays (bubbles, speech bubble, etc.) directly onto canvas
    this.drawOverlays(this.ctx);

    // Continue animation loop
    if (this.animationFrameId !== null) {
      this.animationFrameId = requestAnimationFrame(() => this.compositeFrame());
    }
  }

  /**
   * Start recording with AR overlay
   */
  start(): void {

    if (!this.canvas || !this.ctx) {
      throw new Error('RecordingManager not initialized');
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recording already in progress');
    }


    // Reset warning flag and frame counter
    this.webglCanvasWarned = false;
    this.frameCount = 0;
    this.overlayData = { bubbles: [] };

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
    this.overlayData = { bubbles: [] };
    this.frameCount = 0;
  }
}

export class BlobManager {
  private videoBlob: Blob | null = null;
  private videoUrl: string | null = null;

  constructor() {
  }

  /**
   * Store video blob and create URL
   */
  store(blob: Blob): string {
    // Clean up previous
    this.cleanup();

    this.videoBlob = blob;
    this.videoUrl = URL.createObjectURL(blob);

    console.log('Video stored:', {
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
  }
}

// Export singleton instance
export const videoService = VideoRecordingService.getInstance();
