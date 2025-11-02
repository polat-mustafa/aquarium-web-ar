'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getCreatureCategories, getCreaturesByCategory, getGalleryCreatures, type CreatureCategory, type GalleryCreature } from '@/utils/galleryData';
import { showGlobalLoading, hideGlobalLoading } from '@/components/ui/LoadingOverlay';
import { loadCustomCreatures } from '@/utils/creatureFolderScanner';
import { attachModelsToCreatures, createCreaturesFromModels } from '@/utils/modelMatcher';
import { useSettings } from '@/contexts/SettingsContext';
import { SettingsButton } from '@/components/ui/SettingsButton';
import { CreatureIcon } from '@/components/ui/CreatureIcon';
import { PrivacyModal } from '@/components/ui/PrivacyModal';
import { useRouter } from 'next/navigation';

export default function Gallery() {
  const { t, language } = useSettings();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CreatureCategory | null>(null);
  const [showCreaturePopup, setShowCreaturePopup] = useState(false);
  const [loadingCategoryId, setLoadingCategoryId] = useState<string | null>(null);
  const [loadingCreatureId, setLoadingCreatureId] = useState<string | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [customCreatures, setCustomCreatures] = useState<GalleryCreature[]>([]);
  const [creaturesWithModels, setCreaturesWithModels] = useState<GalleryCreature[]>([]);
  const [modelCreatures, setModelCreatures] = useState<GalleryCreature[]>([]);

  // Privacy Modal State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Get translated creatures and categories based on current language
  const creatureCategories = useMemo(() => getCreatureCategories(language), [language]);
  const baseGalleryCreatures = useMemo(() => getGalleryCreatures(language), [language]);

  // Combine all creatures: base creatures (with attached models) + new model creatures + custom creatures
  const allCreatures = useMemo(() => {
    const combined = [...creaturesWithModels, ...modelCreatures, ...customCreatures];
    return combined.length > 0 ? combined : baseGalleryCreatures;
  }, [creaturesWithModels, modelCreatures, customCreatures, baseGalleryCreatures]);

  // Check if privacy was already accepted
  useEffect(() => {
    const accepted = localStorage.getItem('aquarium-privacy-accepted');
    if (accepted === 'true') {
      setPrivacyAccepted(true);
    } else {
      setShowPrivacyModal(true);
    }
  }, []);

  const handlePrivacyAccept = () => {
    localStorage.setItem('aquarium-privacy-accepted', 'true');
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
  };

  const handlePrivacyDecline = () => {
    router.push('/');
  };

  // Hide scroll hint after user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollHint(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-hide scroll hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Load custom creatures on mount
  useEffect(() => {
    const loadCustom = async () => {
      try {
        const custom = await loadCustomCreatures();
        if (custom.length > 0) {
          setCustomCreatures(custom);
          console.log('✅ Loaded', custom.length, 'custom creatures');
        }
      } catch (error) {
        console.warn('Failed to load custom creatures (non-fatal):', error);
      }
    };
    loadCustom();
  }, []);

  // Attach 3D models to creatures and create new model creatures
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Step 1: Attach models to existing creatures
        const withModels = await attachModelsToCreatures(baseGalleryCreatures);
        setCreaturesWithModels(withModels);

        // Step 2: Create new creatures from models
        const newModels = await createCreaturesFromModels();
        if (newModels.length > 0) {
          setModelCreatures(newModels);
          console.log('✅ Created', newModels.length, 'new creatures from models');
        }
      } catch (error) {
        console.warn('Failed to load model creatures (non-fatal):', error);
      }
    };
    loadModels();
  }, [baseGalleryCreatures]);

  // Hide global loading when gallery page loads
  useEffect(() => {
    hideGlobalLoading();
  }, []);

  const handleCategoryClick = (category: CreatureCategory) => {
    setLoadingCategoryId(category.id);
    // Simulate some loading time for better UX
    setTimeout(() => {
      setSelectedCategory(category);
      setShowCreaturePopup(true);
      setLoadingCategoryId(null);
    }, 300);
  };

  const closePopup = () => {
    setShowCreaturePopup(false);
    setSelectedCategory(null);
    setLoadingCreatureId(null);
  };

  const handleCreatureARClick = (creatureId: string, creatureName: string) => {
    setLoadingCreatureId(creatureId);
    showGlobalLoading(`Loading ${creatureName} AR...`);
  };


  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Mobile-first Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/95 via-black/85 to-transparent backdrop-blur-xl border-b border-white/10">
        <div className="safe-area-inset-top">
          <div className="px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Back Button - Mobile & Desktop */}
                <Link
                  href="/"
                  className="w-10 h-10 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-xl flex items-center justify-center transition-all hover:bg-slate-700/90 hover:scale-105 active:scale-95"
                  aria-label={t.back}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>

                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-lg">🌊</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Aquarium
                  </h1>
                  <p className="text-xs text-cyan-300 font-medium">{t.gallery}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <SettingsButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 min-h-screen overflow-y-auto">
        <div className="max-w-sm mx-auto space-y-4 pb-20">
          {/* Categories */}
          {creatureCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              disabled={loadingCategoryId === category.id}
              className={`w-full bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 transition-all duration-300 hover:from-slate-700/90 hover:to-slate-600/90 hover:scale-[1.02] active:scale-[0.98] ${
                loadingCategoryId === category.id ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              style={{
                borderColor: category.color + '40',
                background: `linear-gradient(135deg, ${category.color}15, ${category.color}08)`
              }}
            >
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  {category.emoji}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-slate-300">{category.description}</p>
                  <div className="text-xs text-slate-400 mt-1">
                    {getCreaturesByCategory(allCreatures, category.id).length} {t.species}
                  </div>
                </div>
                <div className="text-slate-400">
                  {loadingCategoryId === category.id ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Scroll Down Hint */}
        {showScrollHint && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
            <div
              className="bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/50 rounded-2xl px-4 py-3 shadow-lg cursor-pointer hover:bg-cyan-500/30 transition-colors"
              onClick={() => {
                window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                setShowScrollHint(false);
              }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-cyan-300 text-sm font-medium">Scroll to explore</span>
                <svg
                  className="w-5 h-5 text-cyan-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Creature Popup */}
      {showCreaturePopup && selectedCategory && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 backdrop-blur-2xl border rounded-3xl max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            style={{ borderColor: selectedCategory.color + '60' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: selectedCategory.color + '20' }}
                >
                  {selectedCategory.emoji}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
                  <p className="text-sm text-slate-300">{getCreaturesByCategory(allCreatures, selectedCategory.id).length} {t.species}</p>
                </div>
              </div>
              <button
                onClick={closePopup}
                className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Creatures Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {allCreatures.filter(c => c.category === selectedCategory.id).map((creature: GalleryCreature) => (
                <div
                  key={creature.id}
                  className="bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 border border-slate-700/30 relative group"
                >
                  {/* Main clickable area for AR */}
                  <Link
                    href={`/ar?creature=${creature.id}`}
                    onClick={(e) => {
                      handleCreatureARClick(creature.id, creature.name);
                      closePopup();
                    }}
                    className="block relative"
                  >
                    <div className="mb-3 relative flex justify-center">
                      {/* Smart Icon with fallback */}
                      <CreatureIcon creature={creature} size="medium" />
                      {/* 3D Model indicator badge */}
                      {creature.hasModel && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                          3D
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{creature.name}</h3>
                    <div className="space-y-1 mb-3">
                      {creature.hashtags.slice(0, 3).map((hashtag, index) => (
                        <div
                          key={index}
                          className="text-xs px-2 py-1 rounded-lg inline-block mr-1 mb-1"
                          style={{
                            backgroundColor: selectedCategory.color + '20',
                            color: selectedCategory.color
                          }}
                        >
                          {hashtag}
                        </div>
                      ))}
                    </div>
                    {/* Loading Overlay for AR */}
                    {loadingCreatureId === creature.id && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </Link>

                </div>
              ))}
            </div>

            {/* Close Button */}
            <div className="p-6 pt-0">
              <button
                onClick={closePopup}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      <PrivacyModal
        show={showPrivacyModal}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
      />
    </div>
  );
}