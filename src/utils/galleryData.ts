import { translations, Language } from '@/i18n/translations';

export interface GalleryCreature {
  id: string;
  name: string;
  emoji: string;
  category: string;
  hashtags: string[];
  modelPath?: string;
  hasModel?: boolean;
  defaultIconPath?: string; // Path to default icon in /public/default-icons/
  customIconPath?: string; // Path to custom icon (resolved at runtime)
}

export interface CreatureCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

/**
 * Get creature categories with translated names and descriptions
 */
export function getCreatureCategories(language: Language): CreatureCategory[] {
  const t = translations[language];

  return [
    {
      id: 'fish',
      name: t.categories.fish.name,
      emoji: '🐟',
      description: t.categories.fish.description,
      color: '#06b6d4'
    },
    {
      id: 'mammals',
      name: t.categories.mammals.name,
      emoji: '🐋',
      description: t.categories.mammals.description,
      color: '#3b82f6'
    },
    {
      id: 'shellfish',
      name: t.categories.shellfish.name,
      emoji: '🦀',
      description: t.categories.shellfish.description,
      color: '#f97316'
    },
    {
      id: 'mollusks',
      name: t.categories.mollusks.name,
      emoji: '🐙',
      description: t.categories.mollusks.description,
      color: '#8b5cf6'
    },
    {
      id: 'jellyfish',
      name: t.categories.jellyfish.name,
      emoji: '🪼',
      description: t.categories.jellyfish.description,
      color: '#ec4899'
    },
    {
      id: 'reptiles',
      name: t.categories.reptiles.name,
      emoji: '🐢',
      description: t.categories.reptiles.description,
      color: '#10b981'
    },
    {
      id: 'baltic',
      name: t.categories.baltic.name,
      emoji: '🌊',
      description: t.categories.baltic.description,
      color: '#0ea5e9'
    },
    {
      id: 'custom',
      name: t.categories.custom.name,
      emoji: '⭐',
      description: t.categories.custom.description,
      color: '#f59e0b'
    }
  ];
}

/**
 * Get all creatures with translated names and hashtags
 */
export function getGalleryCreatures(language: Language): GalleryCreature[] {
  const t = translations[language];

  return [
    // Fish
    {
      id: 'shark',
      name: t.creatures.shark.name,
      emoji: '🦈',
      category: 'fish',
      hashtags: t.creatures.shark.hashtags,
      defaultIconPath: '/default-icons/shark.png'
    },
    {
      id: 'angelfish',
      name: t.creatures.angelfish.name,
      emoji: '🐠',
      category: 'fish',
      hashtags: t.creatures.angelfish.hashtags,
      defaultIconPath: '/default-icons/angelfish.png'
    },
    {
      id: 'tuna',
      name: t.creatures.tuna.name,
      emoji: '🐟',
      category: 'fish',
      hashtags: t.creatures.tuna.hashtags,
      defaultIconPath: '/default-icons/tuna.png'
    },
    {
      id: 'zebrasoma',
      name: 'Zebrasoma Xanthurum',
      emoji: '🐠',
      category: 'fish',
      hashtags: ['tropical', 'colorful', 'tang'],
      defaultIconPath: '/default-icons/angelfish.png'
    },

    // Marine Mammals
    {
      id: 'whale',
      name: t.creatures.whale.name,
      emoji: '🐋',
      category: 'mammals',
      hashtags: t.creatures.whale.hashtags,
      defaultIconPath: '/default-icons/whale.png'
    },
    {
      id: 'dolphin',
      name: t.creatures.dolphin.name,
      emoji: '🐬',
      category: 'mammals',
      hashtags: t.creatures.dolphin.hashtags,
      defaultIconPath: '/default-icons/dolphin.png'
    },
    {
      id: 'seal',
      name: t.creatures.seal.name,
      emoji: '🦭',
      category: 'mammals',
      hashtags: t.creatures.seal.hashtags,
      defaultIconPath: '/default-icons/seal.png'
    },

    // Shellfish
    {
      id: 'crab',
      name: t.creatures.crab.name,
      emoji: '🦀',
      category: 'shellfish',
      hashtags: t.creatures.crab.hashtags,
      defaultIconPath: '/default-icons/crab.png'
    },
    {
      id: 'lobster',
      name: t.creatures.lobster.name,
      emoji: '🦞',
      category: 'shellfish',
      hashtags: t.creatures.lobster.hashtags,
      defaultIconPath: '/default-icons/lobster.png'
    },
    {
      id: 'shrimp',
      name: t.creatures.shrimp.name,
      emoji: '🦐',
      category: 'shellfish',
      hashtags: t.creatures.shrimp.hashtags,
      defaultIconPath: '/default-icons/shrimp.png'
    },

    // Mollusks
    {
      id: 'octopus',
      name: t.creatures.octopus.name,
      emoji: '🐙',
      category: 'mollusks',
      hashtags: t.creatures.octopus.hashtags,
      defaultIconPath: '/default-icons/octopus.png'
    },
    {
      id: 'squid',
      name: t.creatures.squid.name,
      emoji: '🦑',
      category: 'mollusks',
      hashtags: t.creatures.squid.hashtags,
      defaultIconPath: '/default-icons/squid.png'
    },

    // Jellyfish
    {
      id: 'jellyfish',
      name: t.creatures.jellyfish.name,
      emoji: '🪼',
      category: 'jellyfish',
      hashtags: t.creatures.jellyfish.hashtags,
      defaultIconPath: '/default-icons/jellyfish.png'
    },
    {
      id: 'medusa',
      name: t.creatures.medusa.name,
      emoji: '🎐',
      category: 'jellyfish',
      hashtags: t.creatures.medusa.hashtags,
      defaultIconPath: '/default-icons/medusa.png'
    },

    // Sea Reptiles
    {
      id: 'turtle',
      name: t.creatures.turtle.name,
      emoji: '🐢',
      category: 'reptiles',
      hashtags: t.creatures.turtle.hashtags,
      defaultIconPath: '/default-icons/turtle.png'
    },
    {
      id: 'sea-snake',
      name: t.creatures['sea-snake'].name,
      emoji: '🐍',
      category: 'reptiles',
      hashtags: t.creatures['sea-snake'].hashtags,
      defaultIconPath: '/default-icons/sea-snake.png'
    },

    // Baltic Species
    {
      id: 'herring',
      name: t.creatures.herring.name,
      emoji: '🐟',
      category: 'baltic',
      hashtags: t.creatures.herring.hashtags,
      defaultIconPath: '/default-icons/herring.png'
    },
    {
      id: 'cod',
      name: t.creatures.cod.name,
      emoji: '🐠',
      category: 'baltic',
      hashtags: t.creatures.cod.hashtags,
      defaultIconPath: '/default-icons/cod.png'
    },
    {
      id: 'flounder',
      name: t.creatures.flounder.name,
      emoji: '🐟',
      category: 'baltic',
      hashtags: t.creatures.flounder.hashtags,
      defaultIconPath: '/default-icons/flounder.png'
    },
    {
      id: 'baltic-seal',
      name: t.creatures['baltic-seal'].name,
      emoji: '🦭',
      category: 'baltic',
      hashtags: t.creatures['baltic-seal'].hashtags,
      defaultIconPath: '/default-icons/baltic-seal.png'
    }
  ];
}

export const getCreaturesByCategory = (creatures: GalleryCreature[], categoryId: string): GalleryCreature[] => {
  return creatures.filter(creature => creature.category === categoryId);
};

export const getCategoryById = (categories: CreatureCategory[], categoryId: string): CreatureCategory | undefined => {
  return categories.find(category => category.id === categoryId);
};

// Legacy exports for backward compatibility (using English)
export const creatureCategories = getCreatureCategories('en');
export const galleryCreatures = getGalleryCreatures('en');
