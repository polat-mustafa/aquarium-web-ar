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
  approved?: boolean; // If true, shows in gallery. If false/undefined, shows in dashboard for approval
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
    creatureId: 'tuna',
    category: 'fish',
    modelPath: '/models/tuna fish-fish.glb',
    approved: true  // ✅ Already approved - shows in gallery
  },
  {
    fileName: 'Zebrasoma Xanthurum-fish.glb',
    creatureId: 'zebrasoma',
    category: 'fish',
    modelPath: '/models/Zebrasoma Xanthurum-fish.glb',
    approved: true  // ✅ Already approved - shows in gallery
  },
  // Koi Fish - GLB format (4.8 MB)
  {
    fileName: 'Koi fish-fish.glb',
    creatureName: 'Koi Fish',
    category: 'fish',
    modelPath: '/models/Koi fish-fish.glb',
    approved: true  // ✅ Approved - shows in gallery and AR
  },

  // Jellyfish - GLB format
  {
    fileName: 'jellyfish-jellyfish.glb',
    creatureName: 'Jellyfish',
    category: 'jellyfish',
    modelPath: '/models/jellyfish-jellyfish.glb',
    approved: true  // ✅ Approved - shows in gallery and AR
  },

  // Tilapia Buttikoferi (Zebra Tilapia)
  {
    fileName: 'Tillapia buttikoferi-fish.glb',
    creatureName: 'Tilapia Buttikoferi',
    category: 'fish',
    modelPath: '/models/Tillapia buttikoferi-fish.glb',
    approved: true  // ✅ Approved - shows in gallery and AR
  },

  // Coral Fish
  {
    fileName: 'coral_fish-fish.glb',
    creatureName: 'Coral Fish',
    category: 'fish',
    modelPath: '/models/coral_fish-fish.glb',
    approved: true  // ✅ Approved - shows in gallery and AR
  },

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
 * Only processes APPROVED models for gallery
 */
export async function attachModelsToCreatures(
  creatures: GalleryCreature[]
): Promise<GalleryCreature[]> {
  const updatedCreatures = [...creatures];

  for (const model of MODEL_REGISTRY) {
    // Only process approved models (check both static and localStorage)
    if (!isModelApproved(model)) continue;

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
 * Only processes APPROVED models for gallery
 */
export async function createCreaturesFromModels(): Promise<GalleryCreature[]> {
  console.log('🔍 createCreaturesFromModels called, registry size:', MODEL_REGISTRY.length);
  const newCreatures: GalleryCreature[] = [];

  for (const model of MODEL_REGISTRY) {
    console.log('📋 Processing model:', model);

    // Only process approved models (check both static and localStorage)
    if (!isModelApproved(model)) {
      console.log('⏭️ Skipping - not approved yet (will show in dashboard)');
      continue;
    }

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

    // Get the approved category (might be different from original if changed in dashboard)
    const approvedCategory = getApprovedCategory(model);

    // Create new creature
    const creature: GalleryCreature = {
      id: creatureId,
      name: model.creatureName,
      emoji: getCategoryEmoji(approvedCategory),
      category: approvedCategory,
      hashtags: generateHashtags(model.creatureName),
      modelPath: model.modelPath,
      hasModel: true,
      defaultIconPath: `/default-icons/${approvedCategory}.png`
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

/**
 * Check if a model is approved (checks both static config and localStorage)
 */
function isModelApproved(model: ModelDefinition): boolean {
  // If approved in code, it's approved
  if (model.approved) return true;

  // Check localStorage for runtime approvals
  if (typeof window !== 'undefined') {
    const approvals = JSON.parse(localStorage.getItem('model_approvals') || '{}');
    return approvals[model.fileName] === true;
  }

  return false;
}

/**
 * Approve a model (stores in localStorage)
 */
export function approveModel(fileName: string, category?: string): void {
  if (typeof window === 'undefined') return;

  const approvals = JSON.parse(localStorage.getItem('model_approvals') || '{}');
  approvals[fileName] = true;
  localStorage.setItem('model_approvals', JSON.stringify(approvals));

  // If category is provided, store it too
  if (category) {
    const categories = JSON.parse(localStorage.getItem('model_categories') || '{}');
    categories[fileName] = category;
    localStorage.setItem('model_categories', JSON.stringify(categories));
  }

  console.log(`✅ Approved model: ${fileName}${category ? ` in category: ${category}` : ''}`);
}

/**
 * Get approved category for a model (from localStorage)
 */
function getApprovedCategory(model: ModelDefinition): string {
  if (typeof window === 'undefined') return model.category;

  const categories = JSON.parse(localStorage.getItem('model_categories') || '{}');
  return categories[model.fileName] || model.category;
}

/**
 * Get pending (unapproved) models for dashboard review
 */
export async function getPendingModels(): Promise<ModelDefinition[]> {
  const pendingModels: ModelDefinition[] = [];

  for (const model of MODEL_REGISTRY) {
    // Check if model is approved
    if (isModelApproved(model)) continue;

    // Check if model file exists
    const exists = await checkModelExists(model.modelPath);
    if (!exists) {
      console.warn(`Pending model file not found: ${model.modelPath}`);
      continue;
    }

    pendingModels.push(model);
  }

  console.log(`📋 Found ${pendingModels.length} pending models for approval`);
  return pendingModels;
}
