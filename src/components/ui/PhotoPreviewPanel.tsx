'use client';

import { useState, useEffect } from 'react';
import { photoService } from '@/services/PhotoCaptureService';
import { generateVideoAnimation, type VideoGenerationOptions } from '@/services/ReplicateVideoService';
import { useAppStore } from '@/stores/useAppStore';

interface PhotoPreviewPanelProps {
  onClose?: () => void;
}

export function PhotoPreviewPanel({ onClose }: PhotoPreviewPanelProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'cinematic' | 'documentary' | 'anime' | 'cartoon' | 'realistic'>('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { activeCreature } = useAppStore();

  useEffect(() => {
    // Get photo from service
    const url = photoService.blob.getUrl();
    if (url) {
      setPhotoUrl(url);
    }
  }, []);

  const handleGenerateVideo = async () => {
    if (!activeCreature) return;

    setIsGenerating(true);
    setProgress(0);
    setVideoUrl(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 2;
      });
    }, 500);

    try {
      // Get the captured photo blob
      const photoBlob = photoService.blob.getBlob();
      let photoDataUrl: string | undefined;

      if (photoBlob) {
        // Convert blob to data URL for API
        photoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photoBlob);
        });
        console.log('📸 Sending captured photo with video request');
      } else {
        console.warn('⚠️ No photo blob found, generating without image');
      }

      const result = await generateVideoAnimation({
        creatureName: activeCreature.name,
        style: selectedStyle,
        photoDataUrl,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.videoUrl) {
        setVideoUrl(result.videoUrl);
      } else {
        alert(`Failed to generate video: ${result.error}`);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Video generation error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl) return;

    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `aquarium-${activeCreature?.name || 'animation'}-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNativeShare = async () => {
    if (!videoUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `My Aquarium Animation - ${activeCreature?.name}`,
          text: `Check out this amazing aquarium animation I created with AI! 🐠🎬`,
          url: videoUrl,
        });
      } else {
        // Fallback - copy link
        await navigator.clipboard.writeText(videoUrl);
        alert('Video link copied to clipboard!');
      }
    } catch (error) {
      console.log('Share cancelled or not supported');
    }
  };

  const styles = [
    { id: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Hollywood-style underwater masterpiece' },
    { id: 'documentary', name: 'Documentary', icon: '📺', description: 'BBC nature documentary style' },
    { id: 'anime', name: 'Anime', icon: '⚡', description: 'Studio Ghibli magical animation' },
    { id: 'cartoon', name: 'Cartoon', icon: '🎨', description: 'Disney/Pixar playful style' },
    { id: 'realistic', name: 'Realistic', icon: '🌊', description: 'Ultra-realistic IMAX quality' },
  ];

  const motivationalPhrases = [
    '🎬 Create an Aquarium Animation with AI',
    '🌊 Transform Your Moment into Magic',
    '🎥 Create Your Own Short Film',
    '✨ Bring Your AR Photo to Life',
    '🐠 Make Cinema from Your Capture',
    '🎞️ Turn Stillness into Motion',
  ];

  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase(prev => (prev + 1) % motivationalPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 via-black/85 to-transparent backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-xl">🎬</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  AI Video Creator
                </h1>
                <p className="text-xs sm:text-sm text-cyan-300 font-semibold">
                  Create & Share Your Short Film
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 sm:px-6 space-y-6">
        {/* Animated Motivational Phrase */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative h-16 flex items-center justify-center">
            {motivationalPhrases.map((phrase, index) => (
              <div
                key={index}
                className={`absolute transition-all duration-500 ${
                  index === currentPhrase
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95'
                }`}
              >
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {phrase}
                </h2>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="max-w-2xl mx-auto">
          <div className="relative aspect-[16/9] bg-slate-800/50 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl">
            {videoUrl ? (
              // Generated Video
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            ) : photoUrl ? (
              // Original Photo
              <img
                src={photoUrl}
                alt="Captured AR Photo"
                className="w-full h-full object-contain"
              />
            ) : (
              // Loading
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-pulse">📷</div>
                  <p className="text-slate-400">Loading photo...</p>
                </div>
              </div>
            )}

            {/* Processing Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-6 px-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-white font-bold text-xl">Creating Your Masterpiece...</p>
                    <p className="text-cyan-300 text-sm">AI is generating a 6-second cinematic animation</p>

                    {/* Progress Bar */}
                    <div className="w-64 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-sm">{progress}% Complete</p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Label */}
            {videoUrl && (
              <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/50">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">✅</span>
                  <span className="text-sm font-semibold text-white">Video Ready!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Style Selection */}
        {!videoUrl && !isGenerating && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-4">Choose Animation Style</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedStyle === style.id
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 shadow-lg shadow-cyan-500/20'
                      : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-center space-y-2">
                    <div className="text-4xl">{style.icon}</div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{style.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {style.description}
                      </p>
                    </div>
                  </div>
                  {selectedStyle === style.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🤖</span>
              <div className="flex-1 text-sm text-purple-200">
                <p className="font-semibold mb-1">✨ AI-Powered by Replicate (minimax/video-01)</p>
                <p className="text-purple-300/80">
                  {videoUrl
                    ? 'Your 6-second cinematic animation is ready! Download and share your creation with the world.'
                    : 'Select a style and click "Generate Video" to transform your AR photo into a stunning 6-second animation.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Action Buttons - Fixed Bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-xl border-t border-white/10">
        <div className="p-4 sm:p-6 space-y-3 max-w-2xl mx-auto">
          {videoUrl ? (
            // Video Ready - Download & Share
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadVideo}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          ) : (
            // Generate Video Button
            <button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !activeCreature}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-2xl flex items-center justify-center space-x-3 ${
                isGenerating || !activeCreature
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 hover:scale-[1.02] active:scale-95'
              }`}
            >
              <span className="text-2xl">🎬</span>
              <span>{isGenerating ? 'Generating...' : 'Generate Video Animation'}</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
