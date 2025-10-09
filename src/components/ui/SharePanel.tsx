'use client';

import React, { useState, useEffect } from 'react';
import { videoService } from '@/services/VideoRecordingService';
import { useSettings } from '@/contexts/SettingsContext';

interface SharePanelProps {
  isVisible: boolean;
  onClose: () => void;
  creatureName?: string;
}

export const SharePanel: React.FC<SharePanelProps> = ({
  isVisible,
  onClose,
  creatureName = 'sea-creature',
}) => {
  const { t } = useSettings();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Get video from service
      const url = videoService.blob.getUrl();
      const blob = videoService.blob.getBlob();

      console.log('📱 SharePanel opened', {
        hasUrl: !!url,
        hasBlob: !!blob,
        blobSize: blob?.size || 0,
      });

      if (url && blob && blob.size > 0) {
        setVideoUrl(url);
        setTimeout(() => setIsLoading(false), 300);
      } else {
        setIsLoading(false);
      }
    } else {
      setVideoUrl('');
      setIsLoading(true);
    }
  }, [isVisible]);

  const handleDownload = () => {
    const blob = videoService.blob.getBlob();
    if (!blob) {
      console.error('No video blob available');
      return;
    }

    setIsDownloading(true);
    try {
      const fileName = videoService.share.generateFileName(
        `aquarium-${creatureName.replace(/\s+/g, '-')}`
      );
      videoService.share.download(blob, fileName);
      console.log('✅ Download complete');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const message = `Just experienced ${creatureName} in AR at Aquarium! 🌊`;
    const url = 'https://polat-mustafa.github.io/portfolio/';
    videoService.share.shareOnSocial(platform, message, url);
  };

  if (!isVisible) return null;

  const blob = videoService.blob.getBlob();
  const sizeKB = videoService.blob.getSizeKB();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700/50">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 backdrop-blur-sm p-6 border-b border-slate-700/50 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-3xl">🎥</span>
                {t.yourARVideo}
              </h2>
              <p className="text-slate-400 text-sm mt-1">{creatureName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center text-2xl hover:rotate-90 duration-300"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Processing your video...</p>
            </div>
          )}

          {/* Video preview */}
          {!isLoading && videoUrl && blob && (
            <div className="space-y-6 animate-fade-in">
              {/* Video player */}
              <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full aspect-video object-contain"
                  onLoadedData={() => console.log('✅ Video loaded')}
                  onError={(e) => console.error('❌ Video error:', e)}
                >
                  Your browser doesn't support video playback.
                </video>

                {/* Video info badge */}
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <span className="text-white text-xs font-medium">
                    {sizeKB} KB
                  </span>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{isDownloading ? `${t.downloading}...` : t.downloadVideo}</span>
              </button>

              {/* Share section */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-white font-semibold mb-4 text-center">{t.shareExperience}</h3>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 hover:from-blue-600 hover:to-blue-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                    title="Share on Twitter"
                  >
                    <span className="text-2xl">𝕏</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 hover:from-blue-700 hover:to-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                    title="Share on Facebook"
                  >
                    <span className="text-2xl">📘</span>
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 hover:from-green-600 hover:to-green-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                    title="Share on WhatsApp"
                  >
                    <span className="text-2xl">💬</span>
                  </button>
                </div>
              </div>

              {/* Info text */}
              <p className="text-center text-slate-500 text-xs">
                #aquarium #WebAR
              </p>
            </div>
          )}

          {/* No video state */}
          {!isLoading && !videoUrl && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-6xl">🌊</div>
              <h3 className="text-white font-semibold text-lg">{t.noVideo}</h3>
              <p className="text-slate-400 text-sm text-center">
                {t.recordFirst}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
