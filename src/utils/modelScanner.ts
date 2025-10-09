'use client';

/**
 * Model Scanner Utility
 * Automatically scans /public/models/ for 3D models
 * Naming convention: {creature-name}-{category}.glb
 * Example: "clown fish-fish.glb" → name: "Clown Fish", category: "fish"
 */

import { GalleryCreature } from './galleryData';

export interface ScannedModel {
  fileName: string;
  name: string;
  category: string;
  modelPath: string;
}

/**
 * Valid category IDs from the gallery
 */
const VALID_CATEGORIES = [
  'fish',
  'mammals',
  'shellfish',
  'mollusks',
  'jellyfish',
  'reptiles',
  'baltic',
  'custom'
] as const;

type ValidCategory = typeof VALID_CATEGORIES[number];

/**
 * Parse model filename to extract creature info
 * Format: "{creature-name}-{category}.glb"
 * Example: "clown fish-fish.glb" → { name: "Clown Fish", category: "fish" }
 */
export function parseModelFileName(fileName: string): ScannedModel | null {
  // Remove file extension
  const nameWithoutExt = fileName.replace(/\.(glb|gltf)$/i, '');

  // Split by last hyphen to get name and category
  const lastHyphenIndex = nameWithoutExt.lastIndexOf('-');

  if (lastHyphenIndex === -1) {
    console.warn(`Invalid model filename format: ${fileName} (missing category after hyphen)`);
    return null;
  }

  const creatureName = nameWithoutExt.substring(0, lastHyphenIndex).trim();
  const category = nameWithoutExt.substring(lastHyphenIndex + 1).trim().toLowerCase();

  // Validate category
  if (!VALID_CATEGORIES.includes(category as ValidCategory)) {
    console.warn(`Invalid category "${category}" in file: ${fileName}. Valid categories: ${VALID_CATEGORIES.join(', ')}`);
    return null;
  }

  // Format creature name (capitalize words)
  const formattedName = creatureName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    fileName,
    name: formattedName,
    category,
    modelPath: `/models/${fileName}`
  };
}

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
 * List of known model files in /public/models/
 * This will be automatically populated by scanning
 */
export const KNOWN_MODEL_FILES = [
  'tuna fish-fish.glb',
  'Zebrasoma Xanthurum-fish.glb',
  // Add more model files here as you add them
];

/**
 * Scan and load models from /public/models/
 * Returns gallery creatures created from the models
 */
export async function loadModelsFromPublic(): Promise<GalleryCreature[]> {
  const creatures: GalleryCreature[] = [];

  for (const fileName of KNOWN_MODEL_FILES) {
    const modelPath = `/models/${fileName}`;

    // Check if model exists
    const exists = await checkModelExists(modelPath);
    if (!exists) {
      console.warn(`Model file not found: ${modelPath}`);
      continue;
    }

    // Parse filename
    const parsed = parseModelFileName(fileName);
    if (!parsed) {
      continue;
    }

    // Generate creature ID from name
    const creatureId = `model-${parsed.name.toLowerCase().replace(/\s+/g, '-')}`;

    // Create gallery creature
    const creature: GalleryCreature = {
      id: creatureId,
      name: parsed.name,
      emoji: getCategoryEmoji(parsed.category),
      category: parsed.category,
      hashtags: generateHashtags(parsed.name),
      modelPath: parsed.modelPath,
      hasModel: true,
      defaultIconPath: `/default-icons/${parsed.category}.png` // Use category icon as fallback
    };

    creatures.push(creature);
    console.log(`✅ Loaded model: ${parsed.name} (${parsed.category})`);
  }

  return creatures;
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
 * Helper: Add a new model file to the scanner
 * Instructions for adding new models:
 *
 * 1. Add your model file to /public/models/
 * 2. Name it: "{creature-name}-{category}.glb"
 *    Categories: fish, mammals, shellfish, mollusks, jellyfish, reptiles, baltic, custom
 * 3. Add the filename to KNOWN_MODEL_FILES array above
 *
 * Example:
 *   File: "blue whale-mammals.glb" → Name: "Blue Whale", Category: "mammals"
 */
export function getModelInstructions(): string {
  return `
📂 How to Add New 3D Models:

1. Add model file to: /public/models/
2. Name format: "{creature-name}-{category}.glb"
3. Valid categories: ${VALID_CATEGORIES.join(', ')}
4. Add filename to KNOWN_MODEL_FILES in modelScanner.ts

Examples:
  ✅ "clown fish-fish.glb" → Clown Fish (fish)
  ✅ "blue whale-mammals.glb" → Blue Whale (mammals)
  ✅ "red crab-shellfish.glb" → Red Crab (shellfish)
  ❌ "dolphin.glb" → Invalid (missing category)
  ❌ "shark-ocean.glb" → Invalid (invalid category)
  `;
}
