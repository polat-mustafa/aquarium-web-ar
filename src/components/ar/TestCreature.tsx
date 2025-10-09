'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';

interface TestCreatureProps {
  className?: string;
}

export const TestCreature: React.FC<TestCreatureProps> = ({ className = '' }) => {
  const { activeCreature, currentAnimation } = useAppStore();
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isVisible, setIsVisible] = useState(false);

  // Show creature with entrance animation
  useEffect(() => {
    if (activeCreature) {
      setIsVisible(true);
    }
  }, [activeCreature]);

  // Handle different animation states
  useEffect(() => {
    if (!activeCreature) return;

    switch (currentAnimation) {
      case 'entrance':
        // Animate creature appearing from bottom
        setPosition({ x: 50, y: 80 });
        setTimeout(() => setPosition({ x: 50, y: 50 }), 100);
        break;
      case 'specialAction':
        // Make creature move around when tapped
        const moveSequence = [
          { x: 30, y: 40 },
          { x: 70, y: 60 },
          { x: 40, y: 30 },
          { x: 50, y: 50 }
        ];

        moveSequence.forEach((pos, index) => {
          setTimeout(() => setPosition(pos), index * 500);
        });
        break;
      case 'idle':
      default:
        // Gentle floating animation
        const floatInterval = setInterval(() => {
          setPosition(prev => ({
            x: 50 + Math.sin(Date.now() * 0.002) * 3,
            y: 50 + Math.cos(Date.now() * 0.002) * 2
          }));
        }, 50);

        return () => clearInterval(floatInterval);
    }
  }, [currentAnimation, activeCreature]);

  if (!activeCreature || !isVisible) return null;

  // Get creature emoji and color based on type
  const getCreatureDisplay = (type: string) => {
    switch (type) {
      case 'shark':
        return { emoji: '🦈', color: '#0ea5e9', name: 'Great White Shark' };
      case 'angelfish':
        return { emoji: '🐠', color: '#06b6d4', name: 'Angelfish' };
      case 'tuna':
        return { emoji: '🐟', color: '#059669', name: 'Bluefin Tuna' };
      case 'whale':
        return { emoji: '🐋', color: '#3b82f6', name: 'Humpback Whale' };
      case 'dolphin':
        return { emoji: '🐬', color: '#06b6d4', name: 'Bottlenose Dolphin' };
      case 'seal':
        return { emoji: '🦭', color: '#0ea5e9', name: 'Harbor Seal' };
      case 'crab':
        return { emoji: '🦀', color: '#f97316', name: 'Red Crab' };
      case 'lobster':
        return { emoji: '🦞', color: '#ea580c', name: 'European Lobster' };
      case 'shrimp':
        return { emoji: '🦐', color: '#ec4899', name: 'Giant Shrimp' };
      case 'octopus':
        return { emoji: '🐙', color: '#8b5cf6', name: 'Giant Pacific Octopus' };
      case 'squid':
        return { emoji: '🦑', color: '#7c3aed', name: 'Giant Squid' };
      case 'jellyfish':
        return { emoji: '🪼', color: '#ec4899', name: 'Moon Jellyfish' };
      case 'medusa':
        return { emoji: '🎐', color: '#f59e0b', name: 'Blue Blubber' };
      case 'turtle':
        return { emoji: '🐢', color: '#10b981', name: 'Green Sea Turtle' };
      case 'sea-snake':
        return { emoji: '🐍', color: '#059669', name: 'Sea Snake' };
      case 'herring':
        return { emoji: '🐟', color: '#0ea5e9', name: 'Baltic Herring' };
      case 'cod':
        return { emoji: '🐠', color: '#0ea5e9', name: 'Baltic Cod' };
      case 'flounder':
        return { emoji: '🐟', color: '#06b6d4', name: 'European Flounder' };
      case 'baltic-seal':
        return { emoji: '🦭', color: '#10b981', name: 'Baltic Grey Seal' };
      default:
        return { emoji: '🐠', color: '#06b6d4', name: 'Sea Creature' };
    }
  };

  const creature = getCreatureDisplay(activeCreature.type);

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${className}`}>
      {/* Creature Animation */}
      <div
        className="absolute transition-all duration-500 ease-in-out"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Main creature with glow effect */}
        <div
          className="relative animate-pulse"
          data-creature-animation="true"
          style={{
            filter: `drop-shadow(0 0 20px ${creature.color})`,
          }}
        >
          <div
            className="text-6xl sm:text-8xl"
            style={{
              textShadow: `0 0 10px ${creature.color}`,
            }}
          >
            {creature.emoji}
          </div>

          {/* Floating particles around creature */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full opacity-70 animate-bounce"
                style={{
                  backgroundColor: creature.color,
                  left: `${20 + (i * 15)}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>

          {/* Name label */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div
              className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-semibold"
              style={{ borderColor: creature.color, borderWidth: 1 }}
            >
              {activeCreature.name}
            </div>
          </div>
        </div>

        {/* Special action effects */}
        {currentAnimation === 'specialAction' && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: creature.color,
                opacity: 0.3,
              }}
            />
          </div>
        )}
      </div>

      {/* Water effect overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${position.x}% ${position.y}%, ${creature.color}20 0%, transparent 50%)`,
          }}
        />
      </div>
    </div>
  );
};