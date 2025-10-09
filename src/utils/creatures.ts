import type { SeaCreature, ARMarker } from '@/types';

export const seaCreatures: SeaCreature[] = [
  {
    id: 'shark-1',
    name: 'Great White Shark',
    type: 'shark',
    modelPath: '/models/shark.glb',
    scale: 0.08,
    position: [0, -0.05, -0.3],
    animations: ['entrance', 'idle', 'specialAction'],
    description:
      'The apex predator of the ocean, known for their incredible hunting skills and streamlined body design.',
  },
  {
    id: 'dolphin-1',
    name: 'Bottlenose Dolphin',
    type: 'dolphin',
    modelPath: '/models/dolphin.glb',
    scale: 0.06,
    position: [0, -0.02, -0.25],
    animations: ['entrance', 'idle', 'specialAction'],
    description:
      'Highly intelligent marine mammals known for their playful behavior and complex social structures.',
  },
  {
    id: 'turtle-1',
    name: 'Sea Turtle',
    type: 'turtle',
    modelPath: '/models/turtle.glb',
    scale: 0.04,
    position: [0, -0.08, -0.2],
    animations: ['entrance', 'idle', 'specialAction'],
    description:
      'Ancient mariners that have been swimming in our oceans for over 100 million years.',
  },
  {
    id: 'octopus-1',
    name: 'Giant Pacific Octopus',
    type: 'octopus',
    modelPath: '/models/octopus.glb',
    scale: 0.05,
    position: [0, -0.05, -0.2],
    animations: ['entrance', 'idle', 'specialAction'],
    description:
      'Masters of camouflage and problem-solving, with eight arms and three hearts.',
  },
  {
    id: 'jellyfish-1',
    name: 'Moon Jellyfish',
    type: 'jellyfish',
    modelPath: '/models/jellyfish.glb',
    scale: 0.03,
    position: [0, 0.02, -0.15],
    animations: ['entrance', 'idle', 'specialAction'],
    description:
      'Graceful drifters that have survived in our oceans for over 500 million years.',
  },
  {
    id: 'whale-1',
    name: 'Humpback Whale',
    type: 'whale',
    modelPath: '/models/whale.glb',
    scale: 0.1,
    position: [0, -0.1, -0.4],
    animations: ['entrance', 'idle', 'specialAction'],
    description:
      'Gentle giants known for their complex songs and spectacular breaching displays.',
  },
];

export const arMarkers: ARMarker[] = [
  {
    id: 'shark-marker',
    imagePath: '/markers/shark-marker.png',
    creatureId: 'shark-1',
    size: 0.15,
  },
  {
    id: 'dolphin-marker',
    imagePath: '/markers/dolphin-marker.png',
    creatureId: 'dolphin-1',
    size: 0.15,
  },
  {
    id: 'turtle-marker',
    imagePath: '/markers/turtle-marker.png',
    creatureId: 'turtle-1',
    size: 0.15,
  },
  {
    id: 'octopus-marker',
    imagePath: '/markers/octopus-marker.png',
    creatureId: 'octopus-1',
    size: 0.15,
  },
  {
    id: 'jellyfish-marker',
    imagePath: '/markers/jellyfish-marker.png',
    creatureId: 'jellyfish-1',
    size: 0.15,
  },
  {
    id: 'whale-marker',
    imagePath: '/markers/whale-marker.png',
    creatureId: 'whale-1',
    size: 0.15,
  },
];

export const getCreatureById = (id: string): SeaCreature | undefined => {
  return seaCreatures.find((creature) => creature.id === id);
};

export const getCreaturesByType = (type: string): SeaCreature[] => {
  return seaCreatures.filter((creature) => creature.type === type);
};

export const getMarkerByCreatureId = (
  creatureId: string
): ARMarker | undefined => {
  return arMarkers.find((marker) => marker.creatureId === creatureId);
};

export const getCreatureByMarkerId = (
  markerId: string
): SeaCreature | undefined => {
  // First try to find by marker ID
  const marker = arMarkers.find((m) => m.id === markerId);
  if (marker) {
    return getCreatureById(marker.creatureId);
  }

  // Then try to find directly by creature ID (for gallery links)
  const creature = getCreatureById(markerId);
  if (creature) {
    return creature;
  }

  return undefined;
};
