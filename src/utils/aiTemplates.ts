/**
 * AI Editing Templates - Data structure for future AI API integration
 * This system is designed to be extensible for connecting to various AI editing APIs
 */

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  category: 'artistic' | 'vintage' | 'cartoon' | 'fantasy' | 'realistic';
  preview?: string; // Optional preview image URL
  // Future: API configuration for different AI services
  apiConfig?: {
    provider?: 'openai' | 'stability' | 'midjourney' | 'custom';
    model?: string;
    stylePrompt?: string;
    parameters?: Record<string, any>;
  };
}

/**
 * Available AI editing templates
 * Top 3 (Simpson, Pixar, Anime) use FREE Hugging Face with caching
 * Others use Z.AI CogView-4
 */
export const AI_TEMPLATES: AITemplate[] = [
  // ⭐ TOP 3: Fast, FREE, Cached transformations using Hugging Face
  {
    id: 'simpson',
    name: 'Simpson Style',
    description: 'Become a character from The Simpsons TV show',
    icon: '🟡',
    category: 'cartoon',
    apiConfig: {
      provider: 'custom', // Uses Hugging Face
      stylePrompt: 'The Simpsons cartoon style, yellow skin, simplified features, 2D animation',
    },
  },
  {
    id: 'pixar',
    name: 'Pixar Style',
    description: 'Transform into a Pixar 3D animated character',
    icon: '🎬',
    category: 'cartoon',
    apiConfig: {
      provider: 'custom', // Uses Hugging Face
      stylePrompt: 'Pixar 3D animation style, Disney Pixar character, soft lighting, expressive',
    },
  },
  {
    id: 'anime',
    name: 'Anime Style',
    description: 'Japanese anime illustration style',
    icon: '⚡',
    category: 'cartoon',
    apiConfig: {
      provider: 'custom', // Uses Hugging Face
      stylePrompt: 'Anime style, manga illustration, expressive eyes, dynamic',
    },
  },

  // Other templates (using Z.AI)
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    description: 'Transform into a magical Ghibli-style animation',
    icon: '🎨',
    category: 'artistic',
    apiConfig: {
      stylePrompt: 'Studio Ghibli anime style, hand-drawn, whimsical, detailed',
    },
  },
  {
    id: 'vintage',
    name: 'Vintage Photo',
    description: 'Classic vintage photography look',
    icon: '📷',
    category: 'vintage',
    apiConfig: {
      stylePrompt: 'Vintage 1970s photograph, faded colors, film grain, nostalgic',
    },
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft watercolor painting effect',
    icon: '🎨',
    category: 'artistic',
    apiConfig: {
      stylePrompt: 'Watercolor painting, soft edges, flowing colors, artistic',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic neon cyberpunk aesthetic',
    icon: '🌆',
    category: 'fantasy',
    apiConfig: {
      stylePrompt: 'Cyberpunk style, neon lights, futuristic, high contrast',
    },
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classic oil painting masterpiece',
    icon: '🖼️',
    category: 'artistic',
    apiConfig: {
      stylePrompt: 'Oil painting, classical art style, rich textures, brushstrokes',
    },
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    description: 'Retro 8-bit pixel art style',
    icon: '👾',
    category: 'cartoon',
    apiConfig: {
      stylePrompt: '8-bit pixel art, retro gaming style, blocky, colorful',
    },
  },
  {
    id: 'comic-book',
    name: 'Comic Book',
    description: 'Bold comic book illustration',
    icon: '💥',
    category: 'cartoon',
    apiConfig: {
      stylePrompt: 'Comic book style, bold lines, halftone dots, dynamic',
    },
  },
  {
    id: 'fantasy',
    name: 'Fantasy Art',
    description: 'Epic fantasy illustration',
    icon: '🐉',
    category: 'fantasy',
    apiConfig: {
      stylePrompt: 'Fantasy art, epic, magical, detailed illustration',
    },
  },
  {
    id: 'noir',
    name: 'Film Noir',
    description: 'Dramatic black and white noir style',
    icon: '🎬',
    category: 'vintage',
    apiConfig: {
      stylePrompt: 'Film noir, black and white, high contrast, dramatic shadows',
    },
  },
  {
    id: 'pop-art',
    name: 'Pop Art',
    description: 'Bold Warhol-style pop art',
    icon: '🎭',
    category: 'artistic',
    apiConfig: {
      stylePrompt: 'Pop art style, bright colors, Andy Warhol, bold graphic',
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AITemplate | undefined {
  return AI_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: AITemplate['category']): AITemplate[] {
  return AI_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Get random template
 */
export function getRandomTemplate(): AITemplate {
  const randomIndex = Math.floor(Math.random() * AI_TEMPLATES.length);
  return AI_TEMPLATES[randomIndex];
}

/**
 * Get all template categories
 */
export function getAllCategories(): AITemplate['category'][] {
  return ['artistic', 'vintage', 'cartoon', 'fantasy', 'realistic'];
}

/**
 * Apply AI template to image
 * - Simpson, Pixar, Anime: Uses FREE Hugging Face with caching
 * - Others: Uses Z.AI CogView-4
 */
export async function applyAITemplate(
  imageBlob: Blob,
  template: AITemplate,
  creatureName?: string
): Promise<Blob> {
  console.log('🎨 Applying AI Template:', template.name);
  console.log('📝 Style prompt:', template.apiConfig?.stylePrompt);

  try {
    // Check if this is a top 3 template (Simpson, Pixar, Anime)
    const useHuggingFace = ['simpson', 'pixar', 'anime'].includes(template.id);

    if (useHuggingFace) {
      console.log('🤗 Using FREE Hugging Face with caching');

      // Import services dynamically
      const { imageCacheService } = await import('@/services/ImageCacheService');
      const { transformImageViaAPI } = await import('@/services/HuggingFaceService');

      // Check cache first
      const cachedImage = await imageCacheService.getCached(imageBlob, template.id);
      if (cachedImage) {
        console.log('✨ Using cached transformation!');
        return cachedImage;
      }

      // Transform using Hugging Face
      const result = await transformImageViaAPI(
        imageBlob,
        template,
        template.id as 'simpson' | 'pixar' | 'anime'
      );

      if (result.success && result.imageBlob) {
        console.log('✅ Hugging Face transformation successful!');

        // Cache the result for next time
        await imageCacheService.setCached(
          imageBlob,
          template.id,
          result.imageBlob,
          template.name
        );

        return result.imageBlob;
      } else {
        console.warn('❌ Hugging Face transformation failed:', result.error);
        // Show user-friendly error
        if (result.error?.includes('loading')) {
          alert('⏳ AI model is loading. Please try again in 20-30 seconds.');
        } else {
          alert(`❌ Transformation failed: ${result.error}`);
        }
        return imageBlob;
      }
    } else {
      console.log('🚀 Using Z.AI CogView-4 (generates new image)');

      // Use Z.AI for other templates
      const { transformImageWithZAI, downloadImageAsBlob } = await import('@/services/ZAIService');

      const result = await transformImageWithZAI(imageBlob, template);

      if (result.success && result.imageUrl) {
        console.log('✅ Z.AI transformation successful!');
        const transformedBlob = await downloadImageAsBlob(result.imageUrl);
        return transformedBlob;
      } else {
        console.warn('❌ Z.AI transformation failed:', result.error);
        alert(`❌ Transformation failed: ${result.error}`);
        return imageBlob;
      }
    }
  } catch (error) {
    console.error('❌ Error applying AI template:', error);
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return imageBlob;
  }
}

/**
 * Generate shareable message for social media
 */
export function generateShareMessage(
  creatureName: string,
  templateName: string
): string {
  return `Check out my ${creatureName} in ${templateName} style! 🐠✨ Created with AR Aquarium`;
}
