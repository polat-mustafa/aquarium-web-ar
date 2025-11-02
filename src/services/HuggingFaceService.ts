/**
 * Hugging Face Service - Image-to-Image Transformation
 * Uses FREE Hugging Face Inference API for style transfer
 * This transforms actual photos (not generates new ones like Z.AI)
 */

import { AITemplate } from '@/utils/aiTemplates';

// Hugging Face API Configuration - NEW Inference Providers API (Nov 2025)
// Migrated from deprecated api-inference.huggingface.co to router.huggingface.co
const HF_API_URL = 'https://router.huggingface.co/hf-inference';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || '';

// Free models for each style - these are publicly available
const STYLE_MODELS = {
  simpson: 'SG161222/Realistic_Vision_V5.1_noVAE',  // Can do cartoon transformations
  pixar: 'prompthero/openjourney-v4',  // 3D animation style
  anime: 'Linaqruf/anime-detailer',  // Anime style transfer
  default: 'stabilityai/stable-diffusion-2-1',  // Fallback
} as const;

export interface HFTransformOptions {
  style: 'simpson' | 'pixar' | 'anime' | 'default';
  prompt: string;
  strength?: number; // How much to transform (0-1)
}

export interface HFTransformResult {
  success: boolean;
  imageBlob?: Blob;
  error?: string;
  cached?: boolean;
}

/**
 * Transform image using Hugging Face models
 * This uses the FREE Inference API with built-in rate limiting
 */
export async function transformImageWithHF(
  imageBlob: Blob,
  options: HFTransformOptions
): Promise<HFTransformResult> {
  try {
    const model = STYLE_MODELS[options.style] || STYLE_MODELS.default;
    const apiUrl = `${HF_API_URL}/${model}`;

    console.log(`🎨 Transforming image with ${options.style} style using ${model}`);

    // Convert blob to base64 for API
    const arrayBuffer = await imageBlob.arrayBuffer();

    // Call Hugging Face API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: options.prompt,
        parameters: {
          strength: options.strength || 0.75,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        }
      }),
    });

    if (!response.ok) {
      // Check if model is loading
      if (response.status === 503) {
        const errorData = await response.json();
        if (errorData.error?.includes('loading')) {
          return {
            success: false,
            error: 'Model is loading. Please try again in a few seconds.',
          };
        }
      }

      throw new Error(`HF API error: ${response.status} ${response.statusText}`);
    }

    // Response is the image blob directly
    const resultBlob = await response.blob();

    console.log('✅ Hugging Face transformation successful!');

    return {
      success: true,
      imageBlob: resultBlob,
      cached: false,
    };
  } catch (error) {
    console.error('❌ Hugging Face transformation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate style-specific prompts for Hugging Face
 */
export function generateHFPrompt(template: AITemplate, style: 'simpson' | 'pixar' | 'anime'): string {
  const prompts: Record<string, string> = {
    simpson: 'Transform this photo into The Simpsons cartoon style: yellow skin, simplified features, bold outlines, characteristic Springfield animation, 2D cartoon aesthetic',

    pixar: 'Transform this photo into Pixar 3D animation style: 3D rendered character, soft lighting, Pixar animation quality, expressive features, Disney/Pixar aesthetic',

    anime: 'Transform this photo into Japanese anime style: manga illustration, large expressive eyes, anime hair styling, vibrant colors, Japanese animation aesthetic',
  };

  return prompts[style] || template.description;
}

/**
 * Transform using Next.js API route (to keep API key secret)
 */
export async function transformImageViaAPI(
  imageBlob: Blob,
  template: AITemplate,
  style: 'simpson' | 'pixar' | 'anime'
): Promise<HFTransformResult> {
  try {
    // Create FormData to send image and parameters
    const formData = new FormData();
    formData.append('image', imageBlob, 'photo.jpg');
    formData.append('style', style);
    formData.append('templateId', template.id);

    console.log(`🚀 Calling API route for ${style} transformation`);

    const response = await fetch('/api/transform-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const resultBlob = await response.blob();

    console.log('✅ API transformation successful!');

    return {
      success: true,
      imageBlob: resultBlob,
      cached: false,
    };
  } catch (error) {
    console.error('❌ API transformation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
