'use client';

/**
 * Model Loader Utility
 * Automatically loads 3D models from /public/models folder
 * and integrates them with gallery creatures
 */

import { GalleryCreature } from './galleryData';

/**
 * Check if a 3D model exists for a creature
 */
export function getModelPath(creatureId: string): string | null {
  const modelFormats = ['glb', 'gltf'];

  for (const format of modelFormats) {
    const path = `/models/${creatureId}.${format}`;
    // In production, this would check if file exists
    // For now, we'll return the path and handle 404 gracefully
    return path;
  }

  return null;
}

/**
 * Check if model file exists (client-side)
 */
export async function checkModelExists(modelPath: string): Promise<boolean> {
  try {
    const response = await fetch(modelPath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get default placeholder icon for creatures without models
 */
export function getDefaultIcon(): string {
  return '📦'; // Box emoji indicating no model
}

/**
 * Enhance gallery creature with model information
 */
export async function enhanceCreatureWithModel(
  creature: GalleryCreature
): Promise<GalleryCreature> {
  const modelPath = getModelPath(creature.id);

  if (modelPath) {
    const hasModel = await checkModelExists(modelPath);
    return {
      ...creature,
      modelPath: hasModel ? modelPath : undefined,
      hasModel,
    };
  }

  return {
    ...creature,
    hasModel: false,
  };
}

/**
 * Scan and load all available models
 */
export async function loadAvailableModels(
  creatures: GalleryCreature[]
): Promise<GalleryCreature[]> {
  const enhanced = await Promise.all(
    creatures.map(creature => enhanceCreatureWithModel(creature))
  );

  console.log('📦 Models loaded:', enhanced.filter(c => c.hasModel).length, '/', creatures.length);

  return enhanced;
}
