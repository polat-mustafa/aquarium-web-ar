'use client';

import { useState, useEffect } from 'react';
import { photoService } from '@/services/PhotoCaptureService';
import {
  AI_TEMPLATES,
  getRandomTemplate,
  generateShareMessage,
  type AITemplate,
} from '@/utils/aiTemplates';
import { useAppStore } from '@/stores/useAppStore';

interface PhotoPreviewPanelProps {
  onClose?: () => void;
}

export function PhotoPreviewPanel({ onClose }: PhotoPreviewPanelProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AITemplate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AITemplate['category'] | 'all'>('all');

  const { activeCreature, setSelectedAITemplate } = useAppStore();

  useEffect(() => {
    // Get photo from service
    const url = photoService.blob.getUrl();
    if (url) {
      setPhotoUrl(url);
    }
  }, []);

  const handleTemplateSelect = (template: AITemplate) => {
    setSelectedTemplate(template);
    setSelectedAITemplate(template.id);
    photoService.blob.setSelectedTemplate(template.id);
  };

  const handleRandomTemplate = () => {
    const randomTemplate = getRandomTemplate();
    handleTemplateSelect(randomTemplate);
  };

  const handleDownload = () => {
    const blob = photoService.blob.getBlob();
    if (!blob) return;

    const fileName = photoService.share.generateFileName(
      `${activeCreature?.name || 'aquarium'}-${selectedTemplate?.id || 'photo'}`,
      'jpg'
    );
    photoService.share.download(blob, fileName);
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'whatsapp' | 'instagram') => {
    const message = generateShareMessage(
      activeCreature?.name || 'Sea Creature',
      selectedTemplate?.name || 'Original'
    );
    const url = window.location.origin;

    photoService.share.shareOnSocial(platform, message, url);
  };

  const handleNativeShare = async () => {
    const blob = photoService.blob.getBlob();
    if (!blob) return;

    try {
      const file = new File(
        [blob],
        photoService.share.generateFileName(
          `${activeCreature?.name || 'aquarium'}-${selectedTemplate?.id || 'photo'}`,
          'jpg'
        ),
        { type: 'image/jpeg' }
      );

      await photoService.share.nativeShare(
        file,
        'AR Aquarium Photo',
        generateShareMessage(
          activeCreature?.name || 'Sea Creature',
          selectedTemplate?.name || 'Original'
        )
      );
    } catch (error) {
      console.log('Native share cancelled or not supported');
    }
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? AI_TEMPLATES
      : AI_TEMPLATES.filter((t) => t.category === selectedCategory);

  const categories: Array<AITemplate['category'] | 'all'> = [
    'all',
    'artistic',
    'cartoon',
    'vintage',
    'fantasy',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 via-black/85 to-transparent backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-xl">📸</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Photo Preview
                </h1>
                <p className="text-xs sm:text-sm text-cyan-300 font-semibold">
                  Choose Your Style
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  window.history.back();
                }
              }}
              className="bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 text-white p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 sm:px-6 space-y-6">
        {/* Photo Preview */}
        <div className="max-w-2xl mx-auto">
          <div className="relative aspect-[4/3] bg-slate-800/50 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Captured AR Photo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-pulse">📷</div>
                  <p className="text-slate-400">Loading photo...</p>
                </div>
              </div>
            )}

            {/* Selected Template Indicator */}
            {selectedTemplate && (
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-cyan-500/50">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <span className="text-sm font-semibold">{selectedTemplate.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* AI Templates Grid */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Choose AI Style</h2>
            <button
              onClick={handleRandomTemplate}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              🎲 Random
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-4xl">{template.icon}</div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{template.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* AI Processing Note */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1 text-sm text-blue-200">
                <p className="font-semibold mb-1">Future AI Enhancement</p>
                <p className="text-blue-300/80">
                  Template selection is ready! AI image processing will be enabled soon with
                  integration to AI APIs like DALL-E, Stable Diffusion, and Midjourney.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Action Buttons - Fixed Bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-xl border-t border-white/10">
        <div className="p-4 sm:p-6 space-y-3 max-w-2xl mx-auto">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download</span>
            </button>

            {navigator.share ? (
              <button
                onClick={handleNativeShare}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span>Share</span>
              </button>
            ) : (
              <button
                onClick={() => handleShare('twitter')}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                <span>Twitter</span>
              </button>
            )}
          </div>

          {/* Social Share Options */}
          {!navigator.share && (
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => handleShare('facebook')}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                aria-label="Share on Facebook"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              <button
                onClick={() => handleShare('whatsapp')}
                className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                aria-label="Share on WhatsApp"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </button>

              <button
                onClick={() => handleShare('instagram')}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                aria-label="Share on Instagram"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
