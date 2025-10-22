'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModelPreview } from './ModelPreview';
import { createCreaturesFromModels } from '@/utils/modelMatcher';
import { attachModelsToCreatures } from '@/utils/modelMatcher';
import { galleryCreatures } from '@/utils/galleryData';
import type { GalleryCreature } from '@/utils/galleryData';
import { useSettings } from '@/contexts/SettingsContext';

interface ModelSelectorProps {
  onModelSelect?: (creatureId: string) => void;
  currentCreatureId?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelect,
  currentCreatureId
}) => {
  const { t } = useSettings();
  const router = useRouter();
  const [creatures, setCreatures] = useState<GalleryCreature[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCreatures = async () => {
      try {
        setIsLoading(true);

        // Get creatures with attached models
        const creaturesWithModels = await attachModelsToCreatures(galleryCreatures);

        // Get model-only creatures
        const modelCreatures = await createCreaturesFromModels();

        // Combine and filter only those with models
        const allCreatures = [...creaturesWithModels, ...modelCreatures]
          .filter(c => c.hasModel && c.modelPath);

        setCreatures(allCreatures);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    loadCreatures();
  }, []);

  const handleCreatureSelect = (creatureId: string) => {
    if (onModelSelect) {
      onModelSelect(creatureId);
    } else {
      // Navigate to AR page with creature
      router.push(`/ar?creature=${creatureId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed bottom-24 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-xl border-t border-white/10 p-4">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Loading 3D Models...</p>
        </div>
      </div>
    );
  }

  if (creatures.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-32 left-0 right-0 z-30">
      {/* Toggle Button */}
      <div className="flex justify-center mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>{isExpanded ? 'Hide' : 'Show'} 3D Models ({creatures.length})</span>
        </button>
      </div>

      {/* Model Gallery */}
      <div
        className={`bg-gradient-to-t from-black/98 via-black/95 to-black/90 backdrop-blur-2xl border-t border-white/10 transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-80' : 'max-h-0'
        }`}
      >
        <div className="p-4 overflow-y-auto max-h-80">
          <div className="mb-3">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">🐟</span>
              Select a Creature
            </h3>
            <p className="text-slate-400 text-sm">Tap to view in AR</p>
          </div>

          {/* Horizontal Scrollable Grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {creatures.map((creature) => (
              <div
                key={creature.id}
                onClick={() => handleCreatureSelect(creature.id)}
                className={`flex-shrink-0 w-48 snap-center cursor-pointer group ${
                  currentCreatureId === creature.id
                    ? 'ring-4 ring-cyan-400'
                    : 'hover:ring-2 hover:ring-cyan-500/50'
                } rounded-xl overflow-hidden transition-all duration-300`}
              >
                {/* 3D Model Preview */}
                <div className="h-40 relative">
                  {creature.modelPath && (
                    <ModelPreview
                      modelPath={creature.modelPath}
                      autoRotate={true}
                      scale={0.8}
                    />
                  )}

                  {/* Active Indicator */}
                  {currentCreatureId === creature.id && (
                    <div className="absolute top-2 right-2 bg-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Active
                    </div>
                  )}
                </div>

                {/* Creature Info */}
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm p-3 border-t border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-1 truncate">
                    {creature.name}
                  </h4>
                  <p className="text-cyan-400 text-xs">
                    {creature.emoji} {creature.category}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/20 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-xl"></div>
              </div>
            ))}
          </div>

          {/* Scroll Hint */}
          {creatures.length > 2 && (
            <div className="text-center mt-2">
              <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Swipe to see more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
