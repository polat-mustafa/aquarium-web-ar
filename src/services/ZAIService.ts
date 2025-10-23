/**
 * Z.AI Service - Integration with Z.AI CogView-4 for image generation
 * Uses CogView-4-250304 model for high-quality image generation from text prompts
 */

import { AITemplate } from '@/utils/aiTemplates';

// IMPORTANT: API key should be stored in .env.local file as ZAI_API_KEY
const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_API_URL = 'https://api.z.ai/api/paas/v4/images/generations';

export interface ZAIImageGenerationRequest {
  model: 'cogView-4-250304';
  prompt: string;
  quality?: 'hd' | 'standard';
  size?: string;
  user_id?: string;
}

export interface ZAIImageGenerationResponse {
  created: number;
  data: Array<{
    url: string;
  }>;
  content_filter?: Array<{
    role: 'assistant' | 'user' | 'history';
    level: number;
  }>;
}

export interface ZAIError {
  code: number;
  message: string;
}

/**
 * Generate an AI-styled image using Z.AI CogView-4
 */
export async function generateImageWithZAI(
  prompt: string,
  options?: {
    quality?: 'hd' | 'standard';
    size?: string;
  }
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  if (!ZAI_API_KEY) {
    return {
      success: false,
      error: 'Z.AI API key not configured',
    };
  }

  try {
    const requestBody: ZAIImageGenerationRequest = {
      model: 'cogView-4-250304',
      prompt: prompt,
      quality: options?.quality || 'standard',
      size: options?.size || '1024x1024',
    };

    const response = await fetch(ZAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ZAIError;
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ZAIImageGenerationResponse;

    if (data.data && data.data.length > 0 && data.data[0].url) {
      return {
        success: true,
        imageUrl: data.data[0].url,
      };
    }

    return {
      success: false,
      error: 'No image URL returned from Z.AI',
    };
  } catch (error) {
    console.error('Z.AI image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Transform an image using Z.AI by generating a new styled version
 * Combines the original image context with style prompts
 */
export async function transformImageWithZAI(
  imageBlob: Blob,
  template: AITemplate,
  originalDescription?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // Create a detailed prompt combining the template style with image context
    const stylePrompt = template.apiConfig?.stylePrompt || template.description;

    // Build a comprehensive prompt for image generation
    const prompt = `Create an image in ${template.name} style: ${stylePrompt}.

The image should feature a sea creature (fish) from an aquarium in AR.
Make it look artistic and creative while maintaining the aquatic theme.
${originalDescription ? `Context: ${originalDescription}` : ''}

Style requirements:
- Apply ${template.name} artistic style throughout
- Keep the aquatic/ocean theme
- Make it visually stunning and cohesive
- Enhance colors and details according to ${template.name} style`;

    // Use HD quality for better results
    const result = await generateImageWithZAI(prompt, {
      quality: 'standard', // Use 'standard' for faster generation (5-10s), 'hd' for higher quality (20s)
      size: '1024x1024',
    });

    return result;
  } catch (error) {
    console.error('Z.AI transform error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Download image from URL and convert to Blob
 */
export async function downloadImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Generate style-specific prompts for different templates
 */
export function generateStylePrompt(template: AITemplate, creatureName?: string): string {
  const creature = creatureName || 'beautiful sea creature';

  const stylePrompts: Record<string, string> = {
    'ghibli': `A ${creature} in Studio Ghibli anime style, hand-drawn with soft watercolors, whimsical and magical atmosphere, detailed and dreamy, floating in a fantastical ocean world`,

    'simpson': `A ${creature} transformed into The Simpsons cartoon style, with yellow/simplified colors, bold outlines, and characteristic Springfield animation look`,

    'vintage': `A ${creature} in vintage 1970s photograph style, with faded sepia tones, film grain, nostalgic atmosphere, old photo aesthetic with slight wear and retro colors`,

    'watercolor': `A ${creature} painted in soft watercolor style, with flowing colors, gentle brush strokes, artistic blending, dreamy and ethereal ocean atmosphere`,

    'cyberpunk': `A ${creature} in futuristic cyberpunk style, with neon lights, holographic effects, dark background with bright neon accents, sci-fi underwater city vibe`,

    'oil-painting': `A ${creature} as a classical oil painting masterpiece, with rich textures, visible brushstrokes, Renaissance or Baroque style, museum-quality art`,

    'pixel-art': `A ${creature} in 8-bit pixel art style, retro gaming aesthetic, blocky pixelated design, vibrant colors, nostalgic video game look`,

    'anime': `A ${creature} in Japanese anime illustration style, with expressive features, dynamic composition, vibrant colors, manga-inspired art`,

    'comic-book': `A ${creature} in comic book illustration style, with bold lines, halftone dots, dynamic action poses, pop art colors, superhero comic aesthetic`,

    'fantasy': `A ${creature} in epic fantasy art style, with magical elements, mystical atmosphere, detailed illustration, dragons and magic vibes`,

    'noir': `A ${creature} in film noir style, dramatic black and white, high contrast, deep shadows, mysterious and moody atmosphere`,

    'pop-art': `A ${creature} in Andy Warhol pop art style, with bright contrasting colors, bold graphic design, repeated patterns, modern art aesthetic`,
  };

  return stylePrompts[template.id] || `A ${creature} in ${template.name} artistic style, ${template.description}`;
}
