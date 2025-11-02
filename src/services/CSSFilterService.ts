/**
 * CSS Filter Service - INSTANT photo transformation using Canvas + CSS filters
 * TRUE photo transformation (not generating new images)
 * 100% FREE, INSTANT (no API calls), works offline
 */

import { AITemplate } from '@/utils/aiTemplates';

// CSS filter configurations for each style
const FILTER_PRESETS: Record<string, {
  filters: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}> = {
  simpson: {
    filters: 'sepia(40%) saturate(300%) hue-rotate(-10deg) brightness(1.1) contrast(1.2)',
    brightness: 1.1,
    contrast: 1.2,
    saturation: 3,
    hue: -10,
  },
  pixar: {
    filters: 'saturate(150%) brightness(1.15) contrast(1.1) blur(0.3px)',
    brightness: 1.15,
    contrast: 1.1,
    saturation: 1.5,
    hue: 0,
  },
  anime: {
    filters: 'saturate(180%) contrast(1.3) brightness(1.05) hue-rotate(5deg)',
    brightness: 1.05,
    contrast: 1.3,
    saturation: 1.8,
    hue: 5,
  },
};

/**
 * Transform photo using CSS filters (INSTANT, FREE, OFFLINE)
 */
export async function transformImageWithFilters(
  imageBlob: Blob,
  templateId: 'simpson' | 'pixar' | 'anime'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const preset = FILTER_PRESETS[templateId];
      if (!preset) {
        reject(new Error(`No filter preset for ${templateId}`));
        return;
      }

      // Create image element
      const img = new Image();
      const url = URL.createObjectURL(imageBlob);

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Apply CSS filters via canvas
          ctx.filter = preset.filters;

          // Draw image with filters
          ctx.drawImage(img, 0, 0);

          // Apply additional style-specific effects
          applyStyleEffects(ctx, canvas.width, canvas.height, templateId);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            'image/jpeg',
            0.95
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Apply style-specific effects
 */
function applyStyleEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: 'simpson' | 'pixar' | 'anime'
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  switch (style) {
    case 'simpson':
      // Apply yellow tint for Simpson style
      for (let i = 0; i < data.length; i += 4) {
        // Add yellow tint
        data[i] = Math.min(255, data[i] * 1.2); // R
        data[i + 1] = Math.min(255, data[i + 1] * 1.1); // G
        data[i + 2] = Math.max(0, data[i + 2] * 0.8); // B
      }
      break;

    case 'pixar':
      // Smooth and brighten for Pixar style
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1);
        data[i + 1] = Math.min(255, data[i + 1] * 1.1);
        data[i + 2] = Math.min(255, data[i + 2] * 1.1);
      }
      break;

    case 'anime':
      // Boost colors and contrast for anime style
      for (let i = 0; i < data.length; i += 4) {
        // Increase contrast
        data[i] = Math.min(255, (data[i] - 128) * 1.3 + 128);
        data[i + 1] = Math.min(255, (data[i + 1] - 128) * 1.3 + 128);
        data[i + 2] = Math.min(255, (data[i + 2] - 128) * 1.3 + 128);
      }
      break;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Check if this is a filter-based style
 */
export function isFilterStyle(templateId: string): boolean {
  return ['simpson', 'pixar', 'anime'].includes(templateId);
}
