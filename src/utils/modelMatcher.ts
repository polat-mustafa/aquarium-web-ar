'use client';

/**
 * Model Matcher Utility
 * Matches 3D model files to existing gallery creatures
 * OR creates new creatures from model files
 */

import { GalleryCreature } from './galleryData';

/**
 * Model file registry
 * Maps model files to creature IDs or creates new creatures
 */
export interface ModelDefinition {
  fileName: string;
  creatureId?: string; // If set, attaches to existing creature
  creatureName?: string; // If set, creates new creature
  category: string;
  modelPath: string;
}

/**
 * Define your 3D models here
 *
 * Option 1: Attach to existing creature
 *   { fileName: 'clown-fish.glb', creatureId: 'angelfish', category: 'fish' }
 *
 * Option 2: Create new creature
 *   { fileName: 'clown fish-fish.glb', creatureName: 'Clown Fish', category: 'fish' }
 */
export const MODEL_REGISTRY: ModelDefinition[] = [
  // Fish models - Your uploaded 3D models
  {
    fileName: 'tuna fish-fish.glb',
    creatureName: 'Tuna Fish',
    category: 'fish',
    modelPath: '/models/tuna fish-fish.glb'
  },
  {
    fileName: 'Zebrasoma Xanthurum-fish.glb',
    creatureName: 'Zebrasoma Xanthurum',
    category: 'fish',
    modelPath: '/models/Zebrasoma Xanthurum-fish.glb'
  },
  // Koi Fish - GLTF format COMMENTED OUT (missing scene.bin and textures)
  // Uncomment when you have the complete GLTF package (scene.bin + textures)
  // {
  //   fileName: 'Koi fish - Custom Creatures.gltf',
  //   creatureName: 'Koi Fish',
  //   category: 'fish',
  //   modelPath: '/models/Koi fish - Custom Creatures.gltf'
  // },

  // Example: Attach model to existing creature
  // Uncomment and modify as needed:
  // {
  //   fileName: 'shark-model.glb',
  //   creatureId: 'shark', // Attaches to existing shark
  //   category: 'fish',
  //   modelPath: '/models/shark-model.glb'
  // },
];

/**
 * Check if a model file exists
 */
async function checkModelExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Attach models to existing creatures
 * Returns updated creatures array with model paths
 */
export async function attachModelsToCreatures(
  creatures: GalleryCreature[]
): Promise<GalleryCreature[]> {
  const updatedCreatures = [...creatures];

  for (const model of MODEL_REGISTRY) {
    // Only process models that attach to existing creatures
    if (!model.creatureId) continue;

    const creatureIndex = updatedCreatures.findIndex(c => c.id === model.creatureId);
    if (creatureIndex === -1) {
      console.warn(`Creature "${model.creatureId}" not found for model "${model.fileName}"`);
      continue;
    }

    // Check if model file exists
    const exists = await checkModelExists(model.modelPath);
    if (!exists) {
      console.warn(`Model file not found: ${model.modelPath}`);
      continue;
    }

    // Attach model to creature
    updatedCreatures[creatureIndex] = {
      ...updatedCreatures[creatureIndex],
      modelPath: model.modelPath,
      hasModel: true
    };

    console.log(`✅ Attached model to ${updatedCreatures[creatureIndex].name}: ${model.modelPath}`);
  }

  return updatedCreatures;
}

/**
 * Create new creatures from models (those not attached to existing)
 */
export async function createCreaturesFromModels(): Promise<GalleryCreature[]> {
  console.log('🔍 createCreaturesFromModels called, registry size:', MODEL_REGISTRY.length);
  const newCreatures: GalleryCreature[] = [];

  for (const model of MODEL_REGISTRY) {
    console.log('📋 Processing model:', model);

    // Only process models that create new creatures
    if (!model.creatureName || model.creatureId) {
      console.log('⏭️ Skipping - has creatureId or no creatureName');
      continue;
    }

    // Check if model file exists
    console.log('🔍 Checking if model exists:', model.modelPath);
    const exists = await checkModelExists(model.modelPath);
    console.log('📁 Model exists?', exists);

    if (!exists) {
      console.warn(`❌ Model file not found, skipping: ${model.modelPath}`);
      continue;
    }

    // Generate creature ID
    const creatureId = `model-${model.creatureName.toLowerCase().replace(/\s+/g, '-')}`;
    console.log('🆔 Generated creature ID:', creatureId);

    // Create new creature
    const creature: GalleryCreature = {
      id: creatureId,
      name: model.creatureName,
      emoji: getCategoryEmoji(model.category),
      category: model.category,
      hashtags: generateHashtags(model.creatureName),
      modelPath: model.modelPath,
      hasModel: true,
      defaultIconPath: `/default-icons/${model.category}.png`
    };

    newCreatures.push(creature);
    console.log(`✅ Created model creature:`, {
      id: creature.id,
      name: creature.name,
      modelPath: creature.modelPath,
      hasModel: creature.hasModel
    });
  }

  console.log(`📦 Total creatures created: ${newCreatures.length}`);
  return newCreatures;
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    fish: '🐟',
    mammals: '🐋',
    shellfish: '🦀',
    mollusks: '🐙',
    jellyfish: '🪼',
    reptiles: '🐢',
    baltic: '🌊',
    custom: '⭐'
  };
  return emojiMap[category] || '🐠';
}

/**
 * Generate hashtags from creature name
 */
function generateHashtags(name: string): string[] {
  const nameTag = `#${name.replace(/\s+/g, '')}`;
  return [nameTag, '#3DModel', '#aquarium', '#WebAR'];
}
