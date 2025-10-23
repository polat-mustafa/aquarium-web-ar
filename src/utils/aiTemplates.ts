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
 * Future: These can be dynamically loaded from an API or database
 */
export const AI_TEMPLATES: AITemplate[] = [
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
    id: 'simpson',
    name: 'Simpson Style',
    description: 'Become a character from The Simpsons',
    icon: '🟡',
    category: 'cartoon',
    apiConfig: {
      stylePrompt: 'The Simpsons cartoon style, yellow skin, simplified features',
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
    id: 'anime',
    name: 'Anime',
    description: 'Japanese anime illustration style',
    icon: '⚡',
    category: 'cartoon',
    apiConfig: {
      stylePrompt: 'Anime style, manga illustration, expressive eyes, dynamic',
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
 * Apply AI template to image using Z.AI CogView-4
 * This will generate a new styled image based on the template
 */
export async function applyAITemplate(
  imageBlob: Blob,
  template: AITemplate,
  creatureName?: string
): Promise<Blob> {
  console.log('Applying AI Template:', template.name);
  console.log('Style prompt:', template.apiConfig?.stylePrompt);

  try {
    // Import Z.AI service dynamically
    const { transformImageWithZAI, generateStylePrompt, downloadImageAsBlob } = await import('@/services/ZAIService');

    // Option 1: Use the direct transformation (uses AI to analyze original and apply style)
    const result = await transformImageWithZAI(imageBlob, template);

    if (result.success && result.imageUrl) {
      console.log('✅ Z.AI transformation successful!');

      // Download the generated image as blob
      const transformedBlob = await downloadImageAsBlob(result.imageUrl);
      return transformedBlob;
    } else {
      console.warn('❌ Z.AI transformation failed, returning original:', result.error);
      return imageBlob;
    }
  } catch (error) {
    console.error('Error applying AI template:', error);
    // Return original image on error
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
