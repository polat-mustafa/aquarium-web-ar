'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { ARViewer } from '@/components/ar/ARViewer';
import { SharePanel } from '@/components/ui/SharePanel';
import { SpeechBubble } from '@/components/ui/SpeechBubble';
import { useAppStore } from '@/stores/useAppStore';
import { initializeQRDetection, createCameraStream, stopCameraStream } from '@/utils/qrDetection';
import type { QRDetectionResult } from '@/utils/qrDetection';
import { hideGlobalLoading } from '@/components/ui/LoadingOverlay';
import { videoService } from '@/services/VideoRecordingService';
import { getRandomFishFact } from '@/utils/fishFacts';

function ZebrasomaARContent() {
  // Set body data-page attribute for AR-specific styles
  useEffect(() => {
    document.body.setAttribute('data-page', 'ar');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  // Hide global loading when AR page loads
  useEffect(() => {
    hideGlobalLoading();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSocialSection, setShowSocialSection] = useState(false);
  const [showCreaturePopup, setShowCreaturePopup] = useState(true);
  const [isRecordingLocal, setIsRecordingLocal] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingInitializedRef = useRef(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [currentFact, setCurrentFact] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'tr'>('en');

  const {
    activeCreature,
    isRecording,
    triggerSpecialAnimation,
    setActiveCreature,
    initializeAR,
    isARInitialized,
  } = useAppStore();

  // Initialize AR from store (once)
  useEffect(() => {
    if (!isARInitialized) {
      initializeAR().catch((error) => {
        console.error('AR initialization failed:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set Zebrasoma Xanthurum as the active creature with custom settings
  useEffect(() => {
    setActiveCreature({
      id: 'model-zebrasoma-xanthurum',
      type: 'fish',
      name: 'Zebrasoma Xanthurum',
      modelPath: '/models/Zebrasoma Xanthurum-fish.glb',
      description: 'Experience the stunning Zebrasoma Xanthurum (Purple Tang) in AR!',
      scale: 2.0,  // Custom scale for Zebrasoma (larger than tuna)
      position: [0, -0.5, -3],  // Custom position (slightly lower)
      animation: 'idle'
    });
    console.log('✅ Set Zebrasoma Xanthurum as active creature with custom settings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize camera and QR detection
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await createCameraStream();
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
            setCameraError(null);
            setIsCameraReady(true);
          } catch (playError) {
            if (playError instanceof Error && playError.name !== 'AbortError') {
              console.error('Video play error:', playError);
              setCameraError('Unable to start camera video');
              return;
            }
            console.log('Video play was interrupted, continuing...');
            setCameraError(null);
            setIsCameraReady(true);
          }

          const stopQRDetection = initializeQRDetection(
            videoRef.current,
            handleQRDetection
          );

          return () => {
            stopQRDetection();
            if (streamRef.current) {
              stopCameraStream(streamRef.current);
            }
          };
        }
      } catch (error) {
        console.error('Camera initialization failed:', error);
        setCameraError('Camera access denied. Please allow camera permissions and refresh.');
      }
    };

    initializeCamera().catch((error) => {
      setCameraError('Failed to initialize camera');
    });
  }, []);

  useEffect(() => {
    console.log('🔍 Active creature state changed:', activeCreature ? activeCreature.name : 'null');
  }, [activeCreature]);

  // Auto-close creature pop-up after 2 seconds
  useEffect(() => {
    if (activeCreature && showCreaturePopup) {
      const timer = setTimeout(() => {
        setShowCreaturePopup(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [activeCreature, showCreaturePopup]);

  const [wasRecording, setWasRecording] = useState(false);
  useEffect(() => {
    if (wasRecording && !isRecording) {
      const fallbackTimer = setTimeout(() => {
        if (!showSharePanel) {
          setShowSharePanel(true);
        }
      }, 2000);

      return () => clearTimeout(fallbackTimer);
    }
    setWasRecording(isRecording);
  }, [isRecording, wasRecording, showSharePanel]);

  const handleQRDetection = (result: QRDetectionResult) => {
    try {
      if (result.detected && result.creature) {
        setActiveCreature(result.creature);
        setShowCreaturePopup(true);
      }
    } catch (error) {
      console.error('QR handling error:', error);
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    console.log('🎯 Recording complete for Zebrasoma:', blob.size, 'bytes');
    setRecordedVideo(blob);
    setShowSharePanel(true);
  };

  const handleCreatureTap = () => {
    triggerSpecialAnimation();
  };

  const handleCreaturePopupTap = () => {
    setShowCreaturePopup(false);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 relative">
      {/* Camera Video Background */}
      <video
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover z-0"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* AR Content Overlay */}
      {isCameraReady && (
        <div className="fixed inset-0 w-full h-full z-10 pointer-events-none" style={{ background: 'transparent' }}>
          <ARViewer className="w-full h-full" />
        </div>
      )}

      {/* Mobile UI */}
      <div className="relative z-20 w-full min-h-screen flex flex-col"
        style={{
          background: isCameraReady
            ? 'transparent'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.9), rgba(15, 23, 42, 0.95))'
        }}
      >
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/95 via-black/85 to-transparent backdrop-blur-xl border-b border-white/10">
          <div className="safe-area-inset-top">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                      <span className="text-xl">🐠</span>
                    </div>
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-400 to-violet-600 rounded-2xl blur opacity-20"></div>
                  </div>

                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-300 via-violet-400 to-purple-300 bg-clip-text text-transparent tracking-tight">
                      Aquarium
                    </h1>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <p className="text-xs sm:text-sm text-purple-300 font-semibold tracking-wide uppercase">
                        AR Experience Live
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.history.back();
                    }
                  }}
                  className="group relative bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:from-slate-700/90 hover:to-slate-600/90 hover:border-slate-500/50 hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-20 pb-8 overflow-y-auto">
          {isRecording && (
            <div className="fixed top-20 right-6 z-50">
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-full flex items-center space-x-2 shadow-lg border border-red-400/30">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">REC</span>
              </div>
            </div>
          )}

          <div className="px-4 sm:px-6 space-y-6">
          {activeCreature && showCreaturePopup ? (
              <div
                onClick={handleCreaturePopupTap}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 backdrop-blur-2xl border border-purple-700/60 text-white rounded-3xl shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-violet-500/20"></div>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-violet-400/30 to-transparent rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
                </div>

                <div className="relative z-10 p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-2">
                        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-200 via-violet-300 to-purple-300 bg-clip-text text-transparent leading-tight">
                          {activeCreature.name}
                        </h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-purple-400 via-violet-500 to-purple-400 rounded-full shadow-lg"></div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="relative bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 px-4 py-2 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg">
                          <span className="relative z-10">{activeCreature.type}</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl blur opacity-50"></div>
                        </span>
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-slate-300">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="font-medium">Active</span>
                      </div>
                      <div className="w-px h-4 bg-slate-600"></div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                        <span className="font-medium">AR Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-base text-slate-200 leading-relaxed font-medium">
                      {activeCreature.description}
                    </p>
                  </div>

                  <div className="relative bg-gradient-to-r from-purple-500/15 via-violet-500/15 to-purple-500/15 border border-purple-400/40 rounded-2xl p-5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center space-x-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
                        <h3 className="text-lg font-bold text-purple-200">Interactive Mode</h3>
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping animation-delay-500"></div>
                      </div>
                      <p className="text-center text-purple-300 font-medium">
                        Tap anywhere on screen to trigger amazing animations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          ) : (
            <>
              {cameraError && (
                <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-white p-8 rounded-2xl text-center space-y-6 shadow-2xl">
                  <div className="text-6xl mb-2">📷</div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                    Camera Required
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{cameraError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Retry Camera Access
                  </button>
                </div>
              )}
              {!isCameraReady && !cameraError && (
                <div className="bg-gradient-to-br from-slate-900/98 via-purple-900/95 to-slate-900/98 backdrop-blur-2xl border border-purple-500/30 text-white p-10 rounded-3xl text-center space-y-8 shadow-2xl relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-400/20 via-transparent to-violet-500/20 animate-pulse"></div>
                  </div>

                  <div className="relative z-10 space-y-6">
                    {/* Animated spinner */}
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
                      <div className="absolute inset-3 border-4 border-transparent border-t-violet-400 rounded-full animate-spin animation-delay-150" style={{ animationDuration: '1s' }}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">🐠</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-violet-400 to-purple-300 bg-clip-text text-transparent">
                        Loading AR Experience
                      </h2>
                      <p className="text-purple-200 text-lg font-medium">Preparing Zebrasoma Xanthurum</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">Please allow camera access when prompted</p>
                      <div className="flex justify-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce animation-delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-violet-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/98 via-black/90 to-black/60 backdrop-blur-2xl border-t border-white/10">
          <div className="p-6 space-y-6">
            <div className="flex justify-center">
              <button
                onClick={() => setShowSocialSection(!showSocialSection)}
                className="text-slate-400 hover:text-white text-xs transition-colors"
              >
                {showSocialSection ? '▲ Hide Social' : '▼ Show Social'}
              </button>
            </div>

            {showSocialSection && (
              <div className="border-t border-slate-700/50 pt-3">
                <div className="flex items-center justify-center space-x-4">
                  <a
                    href="https://github.com/polat-mustafa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center hover:scale-110 transition-all duration-300"
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>

                  <a
                    href="https://polat-mustafa.github.io/portfolio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center hover:scale-110 transition-all duration-300"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 919-9" />
                    </svg>
                  </a>

                  <div className="text-purple-300 text-xs">
                    #aquarium #AR
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <div className="w-12 h-1.5 bg-slate-600/50 rounded-full"></div>
            </div>
          </div>
        </footer>
        </main>

        {/* Recording Controls */}
        {isCameraReady && showRecordingPopup && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-black/70 backdrop-blur-lg border border-white/20 rounded-xl px-3 py-2 shadow-lg max-w-[200px]">
              {!isRecording && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setShowRecordingPopup(false)}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center space-y-2">
                {isRecording ? (
                  <div className="flex flex-col items-center space-y-1">
                    <RecordButton
                      maxDuration={15}
                      onRecordingComplete={handleRecordingComplete}
                    />
                  </div>
                ) : (
                  <>
                    <RecordButton
                      maxDuration={15}
                      onRecordingComplete={handleRecordingComplete}
                    />
                  </>
                )}

                {recordedVideo && (
                  <div className="mt-3 pt-3 border-t border-white/20 text-center space-y-3">
                    <button
                      onClick={() => {
                        window.location.href = '/share';
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all hover:scale-105"
                    >
                      ✨ Share Your Video
                    </button>
                  </div>
                )}
              </div>
            </div>

            {activeCreature && (
              <div className="mt-2">
                <button
                  onClick={handleCreatureTap}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-300 ${
                    isRecording
                      ? 'bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white'
                      : 'bg-gradient-to-r from-purple-500/80 to-violet-500/80 hover:from-purple-600/80 hover:to-violet-600/80 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1.5">
                    <span className="text-xs">✨</span>
                    <span>{isRecording ? 'Interact' : 'Animate'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {isCameraReady && !showRecordingPopup && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowRecordingPopup(true)}
              className="bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm border border-red-400/50 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" fill="currentColor"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <SharePanel
        isVisible={showSharePanel}
        onClose={() => {
          setShowSharePanel(false);
          setRecordedVideo(null);
        }}
        creatureName={activeCreature?.name || 'zebrasoma-xanthurum'}
      />

      {activeCreature && (
        <div
          className="fixed inset-0 z-15 bg-transparent cursor-pointer"
          onClick={handleCreatureTap}
          style={{
            background: 'transparent',
            pointerEvents: 'auto'
          }}
        />
      )}
    </div>
  );
}

export default function ZebrasomaARPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold">Loading Zebrasoma AR Experience</h2>
        </div>
      </div>
    }>
      <ZebrasomaARContent />
    </Suspense>
  );
}
