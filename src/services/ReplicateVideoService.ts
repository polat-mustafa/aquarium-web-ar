/**
 * Replicate Video Service - AI Video Animation Generation
 * Uses minimax/video-01 model to create 6-second animations
 * Transforms AR photos into cinematic video clips
 */

export interface VideoGenerationOptions {
  creatureName?: string;
  style?: 'cinematic' | 'documentary' | 'anime' | 'cartoon' | 'realistic';
  duration?: number; // seconds (default: 6)
  photoDataUrl?: string; // Base64 data URL of captured photo
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  estimatedTime?: number; // seconds
}

/**
 * Check if device is iOS
 */
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Compress image for iOS (reduce size to avoid timeouts)
 */
function compressImageForMobile(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      // Create canvas and compress JPEG to 60% quality for iOS
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Reduce size for iOS: max 800x600 for faster upload
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Use 60% quality for iOS, 75% for others
        const quality = isIOS() ? 0.6 : 0.75;
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.onerror = () => {
        // If compression fails, return original
        resolve(dataUrl);
      };
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      resolve(dataUrl);
    }
  });
}

/**
 * Generate AI video animation from AR photo context (iOS-optimized)
 * This calls the Next.js API route which handles Replicate API
 */
export async function generateVideoAnimation(
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  try {
    const { creatureName = 'sea creature', style = 'cinematic', photoDataUrl } = options;
    const deviceOS = isIOS() ? 'iOS' : 'Android/Desktop';

    console.log(`🎬 Generating ${style} video animation for ${creatureName}... (${deviceOS})`);
    if (photoDataUrl) {
      console.log('📸 Using captured photo as input');
    }

    // Compress image for iOS before sending (reduces upload time and timeouts)
    let processedPhotoDataUrl = photoDataUrl;
    if (photoDataUrl && isIOS()) {
      console.log('⚙️ Compressing image for iOS...');
      processedPhotoDataUrl = await compressImageForMobile(photoDataUrl);
      const originalSize = Math.round((photoDataUrl.length * 3) / 4 / 1024);
      const compressedSize = Math.round((processedPhotoDataUrl.length * 3) / 4 / 1024);
      console.log(`📦 Image compressed: ${originalSize}KB → ${compressedSize}KB`);
    }

    // Call API route with iOS-specific timeout
    const timeout = isIOS() ? 30000 : 15000; // 30s for iOS, 15s for others
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatureName,
          style,
          photoDataUrl: processedPhotoDataUrl,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If error response isn't JSON, use status message
        }

        // Provide iOS-specific error messages
        if (isIOS() && response.status === 408) {
          errorMessage = 'Request timed out. Check your internet connection.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      console.log('✅ Video generation successful!');
      console.log('⏱️ Estimated time:', data.estimatedTime, 'seconds');

      return {
        success: true,
        videoUrl: data.videoUrl,
        estimatedTime: data.estimatedTime,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error. Check your internet connection and try again.');
      }
      throw fetchError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Video generation error:', error);

    // Provide user-friendly error messages
    let userMessage = errorMessage;
    if (errorMessage.includes('Network error')) {
      userMessage = '❌ Network connection error. Please check your WiFi or cellular connection.';
    } else if (errorMessage.includes('timeout')) {
      userMessage = '❌ Request timed out. Your internet connection might be slow. Try again.';
    } else if (errorMessage.includes('API')) {
      userMessage = '❌ Server error. Please try again in a moment.';
    }

    return {
      success: false,
      error: userMessage,
    };
  }
}

/**
 * Generate cinematic prompt for aquarium animation
 * These prompts instruct the AI to animate the PROVIDED IMAGE, not create new content
 */
export function generateAquariumPrompt(
  creatureName: string,
  style: 'cinematic' | 'documentary' | 'anime' | 'cartoon' | 'realistic'
): string {
  const stylePrompts: Record<typeof style, string> = {
    cinematic: `Transform this image into a cinematic underwater scene. Keep all subjects and elements from the original image exactly as they appear. Add subtle movement: gentle swimming motions, flowing water, floating bubbles, and dramatic light rays penetrating from above. Smooth camera work, professional cinematography, 4K quality. Preserve the original composition and subjects.`,

    documentary: `Transform this image into a nature documentary scene. Maintain all subjects and elements from the original image. Add natural movements: realistic swimming behavior, gentle water currents, small bubbles rising. BBC/National Geographic documentary style with smooth, stable footage. Keep the original scene intact with subtle, lifelike animation.`,

    anime: `Transform this image into anime-style animation. Keep all subjects from the original image but add anime aesthetics: vibrant colors, sparkles, glowing particles in water, dreamy lighting effects. Studio Ghibli inspired fluid movements. Maintain the original composition while adding magical, whimsical animation style. Preserve all people and objects from the photo.`,

    cartoon: `Transform this image into cartoon animation. Keep all subjects from the original image with cartoon styling: bright saturated colors, playful movements, bouncy animation. Disney/Pixar quality with cheerful atmosphere, bubbles, and smooth movements. Preserve everyone and everything in the original photo with family-friendly cartoon treatment.`,

    realistic: `Transform this image into ultra-realistic underwater footage. Preserve all subjects and elements exactly as they appear. Add photorealistic water movement, natural lighting effects, gentle currents, rising bubbles. IMAX documentary quality with crystal clear water. Keep the original scene with subtle, natural animation. Maintain all people and objects.`,
  };

  return stylePrompts[style];
}

/**
 * Poll for video completion (Replicate async processing)
 */
export async function pollVideoStatus(
  predictionId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<VideoGenerationResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/video-status?id=${predictionId}`);

      if (!response.ok) {
        throw new Error('Failed to check video status');
      }

      const data = await response.json();

      if (data.status === 'succeeded') {
        return {
          success: true,
          videoUrl: data.videoUrl,
        };
      }

      if (data.status === 'failed') {
        return {
          success: false,
          error: data.error || 'Video generation failed',
        };
      }

      // Still processing, wait before next check
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error('Error polling video status:', error);
    }
  }

  return {
    success: false,
    error: 'Video generation timeout',
  };
}
