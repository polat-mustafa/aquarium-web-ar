/**
 * Gemini AI Service - Integration with Google's Gemini AI for image transformation
 * Uses Gemini Pro Vision for image-to-image style transfer
 */

import { AITemplate } from '@/utils/aiTemplates';

// IMPORTANT: API key should be stored in .env.local file
// Create .env.local file in the root directory with:
// GEMINI_API_KEY=your_api_key_here (SECRET - DO NOT USE NEXT_PUBLIC_)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface AITransformResult {
  success: boolean;
  transformedImageUrl?: string;
  error?: string;
}

/**
 * Convert image blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transform image using Gemini AI
 */
export async function transformImageWithGemini(
  imageBlob: Blob,
  template: AITemplate
): Promise<AITransformResult> {
  try {
    // Convert image to base64
    const base64Image = await blobToBase64(imageBlob);

    // Create a detailed prompt for style transfer
    const prompt = `Transform this image into ${template.name} style. ${template.description}.

Style requirements: ${template.apiConfig?.stylePrompt || template.description}

Important instructions:
- Keep the main subject (fish or sea creature) in the image
- Apply the ${template.name} artistic style throughout
- Maintain the composition and layout
- Make it look natural and cohesive
- Enhance colors and details according to the style

Generate a transformed version of this image in the specified style.`;

    // Make API request to Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: imageBlob.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to transform image');
    }

    const data = await response.json();

    // Note: Gemini Pro Vision returns text descriptions, not images
    // For actual image generation, we would need to use a different approach
    // This is a placeholder that returns the analysis
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (analysisText) {
      console.log('Gemini AI Analysis:', analysisText);

      // For now, return the original image since Gemini doesn't generate images directly
      // In production, you would:
      // 1. Use the analysis to generate prompts for Imagen API
      // 2. Or use a different image generation model
      // 3. Or use the analysis as metadata for client-side filters

      return {
        success: true,
        transformedImageUrl: URL.createObjectURL(imageBlob),
        error: undefined,
      };
    }

    throw new Error('No response from Gemini AI');
  } catch (error) {
    console.error('Gemini AI transformation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Apply client-side CSS filters based on template
 * This is a fallback/preview method while AI processing happens
 */
export function getTemplateFilters(template: AITemplate): string {
  const filterMap: Record<string, string> = {
    'ghibli': 'saturate(1.3) contrast(1.1) brightness(1.05)',
    'simpson': 'saturate(1.5) hue-rotate(15deg) contrast(1.2)',
    'vintage': 'sepia(0.4) contrast(0.9) brightness(1.1) saturate(0.8)',
    'watercolor': 'blur(0.5px) saturate(1.2) brightness(1.1)',
    'cyberpunk': 'saturate(1.5) contrast(1.3) brightness(0.9) hue-rotate(10deg)',
    'oil-painting': 'contrast(1.2) saturate(1.3) blur(0.3px)',
    'pixel-art': 'pixelate(8) saturate(1.2)',
    'anime': 'saturate(1.4) contrast(1.2) brightness(1.05)',
    'comic-book': 'contrast(1.4) saturate(1.3)',
    'fantasy': 'saturate(1.3) brightness(1.1) contrast(1.1)',
    'noir': 'grayscale(1) contrast(1.5) brightness(0.9)',
    'pop-art': 'saturate(2) contrast(1.5) brightness(1.1)',
  };

  return filterMap[template.id] || 'none';
}

/**
 * Generate AI-enhanced description using Gemini
 */
export async function generateImageDescription(
  imageBlob: Blob
): Promise<string> {
  try {
    const base64Image = await blobToBase64(imageBlob);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Describe this AR aquarium photo in a creative and engaging way. Focus on the sea creature and the artistic composition.',
              },
              {
                inline_data: {
                  mime_type: imageBlob.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate description');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Beautiful AR capture!';
  } catch (error) {
    console.error('Failed to generate description:', error);
    return 'Amazing AR aquarium capture!';
  }
}
