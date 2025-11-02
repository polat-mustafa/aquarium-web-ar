/**
 * Replicate Video Service - AI Video Animation Generation
 * Uses minimax/video-01 model to create 6-second animations
 * Transforms AR photos into cinematic video clips
 */

export interface VideoGenerationOptions {
  creatureName?: string;
  style?: 'cinematic' | 'documentary' | 'anime' | 'cartoon' | 'realistic';
  duration?: number; // seconds (default: 6)
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
    const { creatureName = 'sea creature', style = 'cinematic' } = options;

    console.log(`🎬 Generating ${style} video animation for ${creatureName}...`);

    // Call API route
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatureName,
        style,
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
 */
export function generateAquariumPrompt(
  creatureName: string,
  style: 'cinematic' | 'documentary' | 'anime' | 'cartoon' | 'realistic'
): string {
  const stylePrompts: Record<typeof style, string> = {
    cinematic: `Cinematic underwater scene: A majestic ${creatureName} swimming gracefully through crystal-clear ocean water.
Dramatic lighting rays penetrate from the surface above, creating ethereal light beams.
The creature moves elegantly with flowing fins, surrounded by gentle bubbles and coral formations in the background.
Professional cinematography, smooth camera movement following the creature, 4K quality, nature documentary style.`,

    documentary: `BBC nature documentary style: A ${creatureName} in its natural habitat, swimming through a vibrant coral reef ecosystem.
Natural lighting, educational perspective, showing the creature's natural behavior and movements.
Crystal clear water, tropical fish in background, realistic ocean environment.
National Geographic quality, smooth and stable footage.`,

    anime: `Anime style animation: A beautiful ${creatureName} swimming through a magical underwater world.
Vibrant colors, dramatic lighting effects, sparkles and glowing particles in the water.
Fluid animation with expressive movements, Studio Ghibli inspired, dreamy atmosphere with soft focus backgrounds.
Japanese animation style, enchanting and whimsical.`,

    cartoon: `Cartoon animation style: A friendly, cute ${creatureName} swimming playfully through colorful ocean waters.
Bright, saturated colors, smooth movements, Disney/Pixar animation quality.
Cheerful atmosphere with bubbles and smiling fish friends in the background.
Family-friendly, adorable character design, bouncy and energetic movements.`,

    realistic: `Ultra-realistic underwater footage: A ${creatureName} swimming naturally in clear ocean water.
Photorealistic quality, natural lighting, authentic marine environment.
Professional underwater cinematography, showcasing the creature's true colors and graceful movements.
IMAX documentary quality, crystal clear water, natural behavior.`,
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
