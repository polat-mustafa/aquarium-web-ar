/**
 * PhotoCaptureService - Professional OOP implementation
 * Singleton service for capturing photos with AR overlay and creature compositing
 */

export interface PhotoOverlayData {
  creatureName?: string;
  timestamp: number;
}

export class PhotoCaptureManager {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private overlayData: PhotoOverlayData = { timestamp: Date.now() };

  constructor() {}

  /**
   * Initialize photo capture with video stream
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    try {
      if (!videoElement?.srcObject) {
        throw new Error('No video stream available');
      }

      this.videoElement = videoElement;
      const stream = videoElement.srcObject as MediaStream;

      if (!stream.active) {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update overlay data
   */
  updateOverlayData(data: PhotoOverlayData): void {
    this.overlayData = data;
  }

  /**
   * Draw creature watermark/label on photo
   */
  private drawCreatureLabel(ctx: CanvasRenderingContext2D): void {
    if (!this.overlayData.creatureName) return;

    const padding = 20;
    const emojiSize = 28;
    const textPadding = 20;
    const emojiPadding = 12;

    ctx.save();

    // Measure text to calculate proper background width
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    const textMetrics = ctx.measureText(this.overlayData.creatureName);

    // Calculate background dimensions with proper spacing for text + emoji
    const bgWidth = textMetrics.width + textPadding * 2 + emojiSize + emojiPadding;
    const bgHeight = 50;
    const bgX = padding;
    const bgY = this.canvas!.height - padding - bgHeight;

    // Gradient background
    const gradient = ctx.createLinearGradient(bgX, bgY, bgX + bgWidth, bgY + bgHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
    gradient.addColorStop(1, 'rgba(147, 51, 234, 0.9)');

    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    this.roundRect(ctx, bgX, bgY, bgWidth, bgHeight, 25);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw creature name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.overlayData.creatureName, bgX + textPadding, bgY + bgHeight / 2);

    // Draw fish emoji with proper positioning
    ctx.font = `${emojiSize}px serif`;
    ctx.textAlign = 'right';
    ctx.fillText('🐠', bgX + bgWidth - emojiPadding, bgY + bgHeight / 2);

    ctx.restore();
  }

  /**
   * Helper to draw rounded rectangle
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
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
   * Capture a photo with AR overlay
   * Returns blob of the captured photo
   */
  async capture(): Promise<Blob> {
    if (!this.canvas || !this.ctx || !this.videoElement) {
      throw new Error('PhotoCaptureManager not initialized');
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw camera video (mirrored like in UI)
    this.ctx.save();
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(
      this.videoElement,
      -this.canvas.width,
      0,
      this.canvas.width,
      this.canvas.height
    );
    this.ctx.restore();

    // Find and composite the WebGL canvas (Three.js AR overlay)
    const webglCanvas = this.findWebGLCanvas();
    if (webglCanvas) {
      try {
        // Draw the WebGL 3D canvas on top of video
        this.ctx.drawImage(webglCanvas, 0, 0, this.canvas.width, this.canvas.height);
      } catch (error) {
        console.warn('Could not composite WebGL canvas:', error);
      }
    }

    // Draw creature label overlay
    this.drawCreatureLabel(this.ctx);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      this.canvas!.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create photo blob'));
          }
        },
        'image/jpeg',
        0.95 // High quality
      );
    });
  }

  /**
   * Find the WebGL canvas from Three.js
   */
  private findWebGLCanvas(): HTMLCanvasElement | null {
    const allCanvases = document.querySelectorAll('canvas');

    for (const canvas of allCanvases) {
      // Skip our compositing canvas
      if (canvas === this.canvas) continue;

      // Look for Three.js canvas
      if (canvas.width > 0 && canvas.height > 0) {
        const parent = canvas.parentElement;
        const hasWebGLIndicators =
          canvas.getAttribute('data-engine')?.includes('three') ||
          parent?.className.includes('r3f') ||
          (canvas.width === window.innerWidth && canvas.height === window.innerHeight);

        if (hasWebGLIndicators || allCanvases.length >= 2) {
          return canvas;
        }
      }
    }

    return null;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.canvas = null;
    this.ctx = null;
    this.videoElement = null;
    this.overlayData = { timestamp: Date.now() };
  }
}

export class PhotoBlobManager {
  private photoBlob: Blob | null = null;
  private photoUrl: string | null = null;
  private metadata: {
    creatureName?: string;
    captureTime?: Date;
    selectedTemplate?: string;
  } = {};
  private readonly STORAGE_KEY = 'aquarium-captured-photo';
  private readonly METADATA_KEY = 'aquarium-photo-metadata';
  private restorationPromise: Promise<void> | null = null;

  constructor() {
    // Clear old localStorage cache on initialization
    // This ensures we always show fresh photos
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.METADATA_KEY);
      // Also clear old IndexedDB cache from previous version
      this.clearOldIndexedDB();
    }
    this.restorationPromise = Promise.resolve();
  }

  /**
   * Clear old IndexedDB cache from previous photo transformation system
   */
  private clearOldIndexedDB(): void {
    if (typeof window === 'undefined') return;

    try {
      // Delete old aquarium-image-cache database
      indexedDB.deleteDatabase('aquarium-image-cache');
      console.log('🗑️ Cleared old photo cache');
    } catch (error) {
      console.warn('Could not clear old IndexedDB:', error);
    }
  }

  /**
   * Initialize restoration from localStorage (call this on preview page)
   */
  async initRestore(): Promise<void> {
    this.restorationPromise = this.restoreFromStorage();
    await this.restorationPromise;
  }

  /**
   * Store photo blob and create URL
   */
  async store(blob: Blob, creatureName?: string): Promise<string> {
    // Clean up previous
    this.cleanup();

    this.photoBlob = blob;
    this.photoUrl = URL.createObjectURL(blob);
    this.metadata = {
      creatureName,
      captureTime: new Date(),
    };

    // No localStorage caching - always use fresh photos
    console.log('📸 Fresh photo stored:', { size: Math.round(blob.size / 1024) + 'KB', creatureName });

    return this.photoUrl;
  }

  /**
   * Persist photo to localStorage as data URL
   */
  private persistToStorage(blob: Blob): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          localStorage.setItem(this.STORAGE_KEY, reader.result as string);
          localStorage.setItem(this.METADATA_KEY, JSON.stringify(this.metadata));
          resolve();
        } catch (error) {
          console.warn('Failed to persist photo to localStorage:', error);
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Restore photo from localStorage
   */
  private async restoreFromStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const dataUrl = localStorage.getItem(this.STORAGE_KEY);
      const metadataJson = localStorage.getItem(this.METADATA_KEY);

      if (dataUrl) {
        // Convert data URL back to blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        this.photoBlob = blob;
        this.photoUrl = URL.createObjectURL(blob);
      }

      if (metadataJson) {
        this.metadata = JSON.parse(metadataJson);
      }
    } catch (error) {
      console.warn('Failed to restore from localStorage:', error);
    }
  }

  /**
   * Wait for restoration to complete
   */
  async waitForRestoration(): Promise<void> {
    if (this.restorationPromise) {
      await this.restorationPromise;
    }
  }

  /**
   * Set selected AI template
   */
  setSelectedTemplate(templateId: string): void {
    this.metadata.selectedTemplate = templateId;
  }

  /**
   * Get selected template
   */
  getSelectedTemplate(): string | undefined {
    return this.metadata.selectedTemplate;
  }

  /**
   * Get stored blob
   */
  getBlob(): Blob | null {
    return this.photoBlob;
  }

  /**
   * Get blob URL
   */
  getUrl(): string | null {
    return this.photoUrl;
  }

  /**
   * Get metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Check if blob exists
   */
  hasBlob(): boolean {
    return this.photoBlob !== null && this.photoBlob.size > 0;
  }

  /**
   * Get blob size in KB
   */
  getSizeKB(): number {
    return this.photoBlob ? Math.round(this.photoBlob.size / 1024) : 0;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.photoUrl) {
      URL.revokeObjectURL(this.photoUrl);
    }
    this.photoBlob = null;
    this.photoUrl = null;
    this.metadata = {};

    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.METADATA_KEY);
    }
  }
}

export class PhotoShareManager {
  /**
   * Download photo blob
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
  shareOnSocial(
    platform: 'twitter' | 'facebook' | 'whatsapp' | 'instagram',
    message: string,
    url: string
  ): void {
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
      case 'instagram':
        // Instagram doesn't support direct sharing, open the app or web
        shareUrl = 'https://www.instagram.com/';
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  }

  /**
   * Native Web Share API (if available)
   */
  async nativeShare(file: File, title: string, text: string): Promise<void> {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        throw error;
      }
    }
  }

  /**
   * Generate filename with timestamp
   */
  generateFileName(prefix: string, extension: string = 'jpg'): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return `${prefix}-${timestamp}.${extension}`;
  }
}

/**
 * Main PhotoCaptureService - Singleton
 */
export class PhotoCaptureService {
  private static instance: PhotoCaptureService | null = null;

  public capture: PhotoCaptureManager;
  public blob: PhotoBlobManager;
  public share: PhotoShareManager;

  private constructor() {
    this.capture = new PhotoCaptureManager();
    this.blob = new PhotoBlobManager();
    this.share = new PhotoShareManager();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PhotoCaptureService {
    if (!PhotoCaptureService.instance) {
      PhotoCaptureService.instance = new PhotoCaptureService();
    }
    return PhotoCaptureService.instance;
  }

  /**
   * Reset all managers
   */
  reset(): void {
    this.capture.cleanup();
    this.blob.cleanup();
  }
}

// Export singleton instance
export const photoService = PhotoCaptureService.getInstance();
