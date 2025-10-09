'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { GalleryCreature } from '@/utils/galleryData';

interface CreatureIconProps {
  creature: GalleryCreature;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * CreatureIcon Component
 * Displays creature icon with smart fallback:
 * 1. Custom icon (/creatures/{id}/icon/icon.*)
 * 2. Default icon (/default-icons/{id}.png)
 * 3. Emoji fallback
 */
export const CreatureIcon: React.FC<CreatureIconProps> = ({
  creature,
  size = 'medium',
  className = '',
}) => {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [iconType, setIconType] = useState<'custom' | 'default' | 'emoji'>('emoji');
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    small: 'w-12 h-12 text-2xl',
    medium: 'w-16 h-16 text-4xl',
    large: 'w-24 h-24 text-6xl',
  };

  useEffect(() => {
    let isMounted = true;

    const resolveIcon = async () => {
      try {
        // Get the base folder name
        const folderName = creature.id.startsWith('custom-')
          ? creature.id.replace('custom-', '')
          : creature.id;

        // Priority 1: Check for custom icon
        const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
        for (const ext of extensions) {
          const customPath = `/creatures/${folderName}/icon/icon.${ext}`;
          const response = await fetch(customPath, { method: 'HEAD' });
          if (response.ok && isMounted) {
            setIconSrc(customPath);
            setIconType('custom');
            setIsLoading(false);
            return;
          }
        }

        // Priority 2: Check for default icon
        if (creature.defaultIconPath) {
          const response = await fetch(creature.defaultIconPath, { method: 'HEAD' });
          if (response.ok && isMounted) {
            setIconSrc(creature.defaultIconPath);
            setIconType('default');
            setIsLoading(false);
            return;
          }
        }

        // Priority 3: Use emoji fallback
        if (isMounted) {
          setIconType('emoji');
          setIsLoading(false);
        }
      } catch (error) {
        // On any error, fall back to emoji
        if (isMounted) {
          setIconType('emoji');
          setIsLoading(false);
        }
      }
    };

    resolveIcon();

    return () => {
      isMounted = false;
    };
  }, [creature]);

  const containerClass = `${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`;

  // Loading state
  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Image icon (custom or default)
  if (iconSrc && iconType !== 'emoji') {
    return (
      <div className={`${containerClass} overflow-hidden bg-slate-700/30 relative`}>
        <Image
          src={iconSrc}
          alt={creature.name}
          fill
          className="object-cover"
          onError={() => {
            // If image fails to load, fall back to emoji
            setIconType('emoji');
            setIconSrc(null);
          }}
        />
        {/* Badge to indicate icon type */}
        {iconType === 'custom' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <span className="text-[8px]">✓</span>
          </div>
        )}
      </div>
    );
  }

  // Emoji fallback
  return (
    <div className={containerClass}>
      <span className="select-none">{creature.emoji || '📦'}</span>
    </div>
  );
};
