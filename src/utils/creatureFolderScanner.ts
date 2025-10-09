'use client';

/**
 * Creature Folder Scanner
 * Scans /public/creatures/ folder for custom creatures
 * Does NOT replace existing creatures - only adds new ones
 */

import { GalleryCreature } from './galleryData';

export interface CustomCreature {
  folderName: string;
  name: string;
  iconPath: string | null;
  modelPath: string | null;
  hasIcon: boolean;
  hasModel: boolean;
}

/**
 * Check if a file exists (client-side)
 */
async function checkFileExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Scan a single creature folder for icon and model
 */
export async function scanCreatureFolder(folderName: string): Promise<CustomCreature | null> {
  try {
    const basePath = `/creatures/${folderName}`;

    // Check for icon files (in priority order)
    const iconExtensions = ['png', 'jpg', 'jpeg', 'svg'];
    let iconPath: string | null = null;
    let hasIcon = false;

    for (const ext of iconExtensions) {
      const testPath = `${basePath}/icon/icon.${ext}`;
      if (await checkFileExists(testPath)) {
        iconPath = testPath;
        hasIcon = true;
        break;
      }
    }

    // Check for model files (in priority order)
    const modelExtensions = ['glb', 'gltf'];
    let modelPath: string | null = null;
    let hasModel = false;

    for (const ext of modelExtensions) {
      const testPath = `${basePath}/3d/model.${ext}`;
      if (await checkFileExists(testPath)) {
        modelPath = testPath;
        hasModel = true;
        break;
      }
    }

    // Only return if at least icon OR model exists
    if (hasIcon || hasModel) {
      return {
        folderName,
        name: formatCreatureName(folderName),
        iconPath,
        modelPath,
        hasIcon,
        hasModel,
      };
    }

    return null;
  } catch (error) {
    console.warn(`Failed to scan creature folder: ${folderName}`, error);
    return null;
  }
}

/**
 * Convert folder name to display name
 * Example: "demo-jellyfish" -> "Demo Jellyfish"
 */
function formatCreatureName(folderName: string): string {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert custom creature to gallery creature format
 */
export function customCreatureToGalleryCreature(
  custom: CustomCreature
): GalleryCreature {
  return {
    id: `custom-${custom.folderName}`,
    name: custom.name,
    emoji: custom.hasIcon ? '' : '📦', // Use placeholder if no icon
    category: 'custom',
    hashtags: [`#${custom.name.replace(/\s+/g, '')}`, '#Custom', '#aquarium'],
    modelPath: custom.modelPath || undefined,
    hasModel: custom.hasModel,
  };
}

/**
 * Get list of known creature folders (hardcoded safe list)
 * This prevents scanning issues and provides fallback
 */
export function getKnownCreatureFolders(): string[] {
  return [
    'demo-jellyfish',
    // Add more folder names here as you create them
  ];
}

/**
 * Load custom creatures from folders
 * SAFE: Won't break if folders don't exist
 */
export async function loadCustomCreatures(): Promise<GalleryCreature[]> {
  const customCreatures: GalleryCreature[] = [];

  try {
    const folderNames = getKnownCreatureFolders();

    for (const folderName of folderNames) {
      const scanned = await scanCreatureFolder(folderName);
      if (scanned) {
        customCreatures.push(customCreatureToGalleryCreature(scanned));
        console.log('✅ Loaded custom creature:', scanned.name);
      }
    }
  } catch (error) {
    console.warn('Failed to load custom creatures (non-fatal):', error);
  }

  return customCreatures;
}
