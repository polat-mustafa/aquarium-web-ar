'use client';

/**
 * Icon Resolver Utility
 * Handles icon resolution priority: Custom Icon > Default Icon > Emoji Fallback
 */

import { GalleryCreature } from './galleryData';

export interface ResolvedIcon {
  type: 'custom' | 'default' | 'emoji';
  path?: string;
  emoji?: string;
}

/**
 * Check if an image file exists
 */
async function checkImageExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Resolve the best icon for a creature
 * Priority:
 * 1. Custom icon from /creatures/{creature-id}/icon/icon.*
 * 2. Default icon from /default-icons/{creature-id}.png
 * 3. Emoji fallback
 */
export async function resolveCreatureIcon(creature: GalleryCreature): Promise<ResolvedIcon> {
  // For custom creatures (starting with 'custom-')
  if (creature.id.startsWith('custom-')) {
    const folderName = creature.id.replace('custom-', '');
    const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];

    // Check for custom icon
    for (const ext of extensions) {
      const customPath = `/creatures/${folderName}/icon/icon.${ext}`;
      if (await checkImageExists(customPath)) {
        return { type: 'custom', path: customPath };
      }
    }

    // No custom icon found, use emoji
    return { type: 'emoji', emoji: creature.emoji || '⭐' };
  }

  // For regular creatures
  // First check if user has added a custom override
  const folderName = creature.id;
  const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];

  for (const ext of extensions) {
    const customPath = `/creatures/${folderName}/icon/icon.${ext}`;
    if (await checkImageExists(customPath)) {
      return { type: 'custom', path: customPath };
    }
  }

  // Check for default icon
  if (creature.defaultIconPath && await checkImageExists(creature.defaultIconPath)) {
    return { type: 'default', path: creature.defaultIconPath };
  }

  // Fallback to emoji
  return { type: 'emoji', emoji: creature.emoji };
}

/**
 * Batch resolve icons for multiple creatures (more efficient)
 */
export async function resolveCreatureIcons(
  creatures: GalleryCreature[]
): Promise<Map<string, ResolvedIcon>> {
  const iconMap = new Map<string, ResolvedIcon>();

  await Promise.all(
    creatures.map(async (creature) => {
      const resolved = await resolveCreatureIcon(creature);
      iconMap.set(creature.id, resolved);
    })
  );

  return iconMap;
}

/**
 * Get icon path synchronously (for cases where async is not possible)
 * Returns default icon path or null
 */
export function getDefaultIconPath(creature: GalleryCreature): string | null {
  if (creature.defaultIconPath) {
    return creature.defaultIconPath;
  }
  return null;
}

/**
 * Get custom icon path pattern for a creature
 */
export function getCustomIconBasePath(creatureId: string): string {
  const folderName = creatureId.startsWith('custom-')
    ? creatureId.replace('custom-', '')
    : creatureId;
  return `/creatures/${folderName}/icon/icon`;
}
