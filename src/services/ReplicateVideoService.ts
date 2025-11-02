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
 * Generate AI video animation from AR photo context
 * This calls the Next.js API route which handles Replicate API
 */
export async function generateVideoAnimation(
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  try {
    const { creatureName = 'sea creature', style = 'cinematic', photoDataUrl } = options;

    console.log(`🎬 Generating ${style} video animation for ${creatureName}...`);
    if (photoDataUrl) {
      console.log('📸 Using captured photo as input');
    }

    // Call API route
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatureName,
        style,
        photoDataUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Video generation successful!');

    return {
      success: true,
      videoUrl: data.videoUrl,
      estimatedTime: data.estimatedTime,
    };
  } catch (error) {
    console.error('❌ Video generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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
