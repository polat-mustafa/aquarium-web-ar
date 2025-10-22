'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ARViewer } from '@/components/ar/ARViewer';
import { SharePanel } from '@/components/ui/SharePanel';
import { SpeechBubble } from '@/components/ui/SpeechBubble';
import { useAppStore } from '@/stores/useAppStore';
import { galleryCreatures } from '@/utils/galleryData';
import { MODEL_REGISTRY } from '@/utils/modelMatcher';
import { initializeQRDetection, createCameraStream, stopCameraStream } from '@/utils/qrDetection';
import type { QRDetectionResult } from '@/utils/qrDetection';
import { hideGlobalLoading } from '@/components/ui/LoadingOverlay';
import { getRandomFishFact } from '@/utils/fishFacts';
import { videoService } from '@/services/VideoRecordingService';

function ARExperienceContent() {
  // CRITICAL FIX: Extract creature ID once with useMemo to prevent infinite re-renders
  const searchParams = useSearchParams();
  const creatureIdFromUrl = useMemo(() => searchParams.get('creature'), [searchParams]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const creatureLoadedRef = useRef(false); // Prevent re-loading creature
  const arInitializedRef = useRef(false); // Prevent re-initializing AR

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCreaturePopup, setShowCreaturePopup] = useState(false);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const recordingInitializedRef = useRef(false);
  const [showDelayedTouchIndicator, setShowDelayedTouchIndicator] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    activeCreature,
    triggerSpecialAnimation,
    setActiveCreature,
    initializeAR,
    isARInitialized,
    showSpeechBubble,
    setShowSpeechBubble,
    preferredLanguage,
    setPreferredLanguage,
    zoomLevel,
    setZoomLevel,
    modelSizeSettings,
    enableSpeechBubbles,
    speechBubbleDuration,
    showTouchIndicator,
    touchIndicatorDuration,
    hashtags,
  } = useAppStore();

  // State for current fish fact
  const [currentFact, setCurrentFact] = useState<ReturnType<typeof getRandomFishFact>>(null);

  // Pinch zoom state
  const lastPinchDistance = useRef<number | null>(null);

  // Set body data-page attribute for AR-specific styles
  useEffect(() => {
    document.body.setAttribute('data-page', 'ar');
    hideGlobalLoading();
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  // Initialize AR from store (once) - ONLY on first mount
  useEffect(() => {
    if (!arInitializedRef.current && !isARInitialized) {
      arInitializedRef.current = true;
      console.log('🎯 Initializing AR (ONE TIME ONLY)');
      initializeAR().catch((error) => {
        console.error('AR initialization failed:', error);
      });
    }
  }, []); // Empty deps - only run once

  // Initialize camera and QR detection (once)
  useEffect(() => {
    let stopQRDetection: (() => void) | null = null;

    const initializeCamera = async () => {
      try {
        const stream = await createCameraStream();
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video metadata to load
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => resolve();
            }
          });

          await videoRef.current.play();
          setCameraError(null);
          setIsCameraReady(true);

          // Initialize QR detection
          stopQRDetection = initializeQRDetection(
            videoRef.current,
            handleQRDetection
          );
        }
      } catch (error) {
        console.error('Camera initialization failed:', error);
        setCameraError('Camera access denied. Please allow camera permissions and refresh.');
      }
    };

    initializeCamera();

    return () => {
      if (stopQRDetection) stopQRDetection();
      if (streamRef.current) stopCameraStream(streamRef.current);
    };
  }, []);

  // CRITICAL FIX: Load creature from URL ONCE using ref to prevent re-loading
  useEffect(() => {
    if (!creatureIdFromUrl || creatureLoadedRef.current) return;

    console.log('🐟 Loading creature from URL:', creatureIdFromUrl);

    // Try resolve modelPath via MODEL_REGISTRY first
    let resolvedName: string | undefined = undefined;
    let resolvedType: string = 'fish';
    let resolvedModelPath: string | undefined = undefined;

    // Case 1: Model creature created from registry -> id: model-<kebab-name>
    if (creatureIdFromUrl.startsWith('model-')) {
      const kebab = creatureIdFromUrl.slice('model-'.length);
      const fromRegistry = MODEL_REGISTRY.find(m =>
        m.creatureName && m.creatureName.toLowerCase().replace(/\s+/g, '-') === kebab
      );
      if (fromRegistry) {
        resolvedName = fromRegistry.creatureName;
        resolvedModelPath = fromRegistry.modelPath;
        resolvedType = fromRegistry.category || 'fish';
      }
    } else {
      // Case 2: Existing gallery creature possibly attached via registry.creatureId
      const base = galleryCreatures.find(c => c.id === creatureIdFromUrl);
      if (base) {
        resolvedName = base.name;
        resolvedType = (base as any).category || 'fish';
      }
      const attached = MODEL_REGISTRY.find(m => m.creatureId === creatureIdFromUrl);
      if (attached) {
        resolvedModelPath = attached.modelPath;
        if (!resolvedName && attached.creatureName) resolvedName = attached.creatureName;
        if (attached.category) resolvedType = attached.category;
      }
    }

    if (resolvedName) {
      // Use custom size from settings if available, otherwise use default
      const customScale = modelSizeSettings[creatureIdFromUrl] || 1.5;

      const creature = {
        id: creatureIdFromUrl,
        type: resolvedType,
        name: resolvedName,
        modelPath: resolvedModelPath,
        description: `Experience the amazing ${resolvedName} in AR!`,
        scale: customScale,
        position: [0, 0, -3] as [number, number, number],
        animation: 'idle' as const
      };

      console.log('✅ Setting active creature:', {
        name: resolvedName,
        modelPath: resolvedModelPath,
        hasModel: !!resolvedModelPath
      });

      setActiveCreature(creature);
      setShowCreaturePopup(true);
      creatureLoadedRef.current = true; // Mark as loaded - never reload

      // Auto-close popup after 2 seconds
      setTimeout(() => {
        setShowCreaturePopup(false);
      }, 2000);
    } else {
      console.warn('⚠️ Could not resolve creature from URL:', creatureIdFromUrl);
    }
  }, [creatureIdFromUrl, modelSizeSettings, setActiveCreature]); // Only depend on the memoized creature ID and settings

  // QR Detection handler - useCallback to prevent re-creation
  const handleQRDetection = useCallback((result: QRDetectionResult) => {
    try {
      if (result.detected && result.creature) {
        console.log('📱 QR code detected, loading creature:', result.creature.name);
        setActiveCreature(result.creature);
        setShowCreaturePopup(true);
        creatureLoadedRef.current = true;

        // Auto-close popup after 2 seconds
        setTimeout(() => {
          setShowCreaturePopup(false);
        }, 2000);
      }
    } catch (error) {
      console.error('QR handling error:', error);
    }
  }, [setActiveCreature]);


  // Creature tap handler
  const handleCreatureTap = useCallback(() => {
    if (activeCreature) {
      console.log('✨ Triggering animation for:', activeCreature.name);
      triggerSpecialAnimation();
    }
  }, [activeCreature, triggerSpecialAnimation]);

  // Handle screen tap for bubble effects
  const handleScreenTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    // Create multiple small bubbles
    const newBubbles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
    }));

    setBubbles(prev => [...prev, ...newBubbles]);

    // Remove bubbles after animation
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => !newBubbles.find(nb => nb.id === b.id)));
    }, 1000);
  }, []);

  // Handle pinch zoom
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastPinchDistance.current !== null) {
        const delta = distance - lastPinchDistance.current;
        const zoomDelta = delta * 0.01;
        setZoomLevel(zoomLevel + zoomDelta);
      }

      lastPinchDistance.current = distance;
    }
  }, [zoomLevel, setZoomLevel]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  // Initialize video recording service when camera is ready
  useEffect(() => {
    if (isCameraReady && videoRef.current && !recordingInitializedRef.current) {
      videoService.recording.initialize(videoRef.current)
        .then(() => {
          console.log('✅ Video recording service initialized');
          recordingInitializedRef.current = true;

          // Setup callbacks
          videoService.recording.onData((blob) => {
            console.log('📹 Video recorded:', blob.size, 'bytes');
            setRecordedVideo(blob);
            setShowSharePanel(true);
          });

          videoService.recording.onError((error) => {
            console.error('❌ Recording error:', error);
            alert('Video recording failed: ' + error.message);
          });
        })
        .catch((error) => {
          console.error('❌ Failed to initialize recording:', error);
        });
    }

    return () => {
      if (recordingInitializedRef.current) {
        videoService.reset();
        recordingInitializedRef.current = false;
      }
    };
  }, [isCameraReady]);

  // Video recording handlers
  const startRecording = useCallback(async () => {
    try {
      if (!recordingInitializedRef.current) {
        console.error('❌ Recording service not initialized');
        return;
      }

      videoService.recording.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎬 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording: ' + (error as Error).message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    try {
      videoService.recording.stop();
      setIsRecording(false);

      // Stop timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);

      console.log('⏹️ Recording stopped');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  // Fullscreen handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update fish fact when speech bubble is shown
  useEffect(() => {
    if (showSpeechBubble && activeCreature) {
      const fact = getRandomFishFact(activeCreature.name);
      setCurrentFact(fact);
    }
  }, [showSpeechBubble, activeCreature]);

  // Show touch indicator 1 second after creature appears
  useEffect(() => {
    if (activeCreature && showTouchIndicator) {
      setShowDelayedTouchIndicator(false);
      const timer = setTimeout(() => {
        setShowDelayedTouchIndicator(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowDelayedTouchIndicator(false);
    }
  }, [activeCreature, showTouchIndicator]);

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

      {/* Recording Timer - Show when recording */}
      {isRecording && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-red-500 text-white px-6 py-2 rounded-full flex items-center space-x-2 shadow-2xl animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-mono font-bold text-lg">
              {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
              {(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* AR Content Overlay - Render Three.js model viewer - Always visible */}
      <div
        className="fixed inset-0 w-full h-full z-20"
        style={{ background: 'transparent', pointerEvents: 'auto' }}
        onClick={handleScreenTap}
        onTouchStart={handleScreenTap}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ARViewer className="w-full h-full" />

          {/* Bubble effects */}
          {bubbles.map(bubble => (
            <div
              key={bubble.id}
              className="absolute pointer-events-none"
              style={{
                left: bubble.x,
                top: bubble.y,
                animation: 'bubbleFloat 1s ease-out forwards',
              }}
            >
              <div className="w-4 h-4 bg-cyan-400/60 rounded-full border-2 border-cyan-300/80 shadow-lg"
                style={{
                  animation: 'bubblePop 1s ease-out forwards',
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)',
                }}
              />
            </div>
          ))}

          {/* Animated Touch Indicator - Controlled by dashboard settings */}
          {activeCreature && showDelayedTouchIndicator && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                animation: 'slideInFromTop 0.6s ease-out, fadeOut 0.5s ease-out forwards',
                animationDelay: `0s, ${(touchIndicatorDuration - 500) / 1000}s`
              }}>
              <div className="relative flex flex-col items-center">
                {/* Professional instruction card with enhanced styling */}
                <div className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 backdrop-blur-xl text-white px-8 py-4 rounded-3xl font-bold text-base shadow-[0_0_30px_rgba(6,182,212,0.6)] border-2 border-white/40"
                  style={{
                    boxShadow: '0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.3)',
                  }}>
                  <div className="flex items-center space-x-3">
                    {/* Animated touch icon */}
                    <div className="relative">
                      <div className="text-3xl" style={{
                        animation: 'touchBounce 1.5s ease-in-out infinite',
                      }}>👆</div>
                      {/* Ripple rings around the hand */}
                      <div className="absolute inset-0 -m-2">
                        <div className="absolute inset-0 border-2 border-white/40 rounded-full"
                          style={{ animation: 'ripple 2s ease-out infinite' }}></div>
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full"
                          style={{ animation: 'ripple 2s ease-out infinite 0.5s' }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg tracking-wide">Tap Fish to Interact</span>
                      <span className="text-xs text-cyan-100 font-normal mt-0.5">Watch them dance!</span>
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-cyan-400/20 rounded-3xl blur-xl -z-10"></div>
                </div>
              </div>
            </div>
          )}

          {/* Speech Bubble for Fish Facts - Controlled by dashboard settings */}
          {enableSpeechBubbles && showSpeechBubble && currentFact && activeCreature && (
            <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
              <SpeechBubble
                fact={currentFact}
                language={preferredLanguage}
                onLanguageChange={setPreferredLanguage}
                onClose={() => setShowSpeechBubble(false)}
              />
            </div>
          )}

          {/* AR Controls - Bottom Right - Always visible */}
          <div className="absolute bottom-32 right-4 z-40 flex flex-col space-y-3 pointer-events-auto">
            {/* Video Recording Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all hover:scale-110 active:scale-95 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}
              aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? (
                <div className="w-5 h-5 bg-white rounded-sm" />
              ) : (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all hover:scale-110 active:scale-95"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
      </div>

      {/* Mobile UI - Professional Overlay */}
      <div className="relative z-30 w-full min-h-screen flex flex-col pointer-events-none"
        style={{
          background: isCameraReady
            ? 'transparent'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.9), rgba(15, 23, 42, 0.95))'
        }}
      >
        {/* Professional Sticky Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 via-black/85 to-transparent backdrop-blur-xl border-b border-white/10 pointer-events-auto">
          <div className="safe-area-inset-top">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Logo */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                      <span className="text-xl">🌊</span>
                    </div>
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl blur opacity-20"></div>
                  </div>

                  {/* Brand Info */}
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                      Aquarium
                    </h1>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <p className="text-xs sm:text-sm text-cyan-300 font-semibold tracking-wide uppercase">
                        AR Experience Live
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = 'https://aquarium-web-ar.vercel.app/gallery/';
                      }
                    }}
                    className="group relative bg-gradient-to-r from-cyan-600/90 to-blue-600/90 backdrop-blur-sm border border-cyan-500/50 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:from-cyan-500/90 hover:to-blue-500/90 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-105 active:scale-95"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="text-sm font-semibold">Gallery</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.history.back();
                      }
                    }}
                    className="group relative bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 text-white p-2.5 rounded-xl font-medium transition-all duration-300 hover:from-slate-700/90 hover:to-slate-600/90 hover:border-slate-500/50 hover:shadow-xl hover:scale-105 active:scale-95"
                    aria-label="Go back"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pt-20 pb-8 overflow-y-auto">

          {/* Content Container */}
          <div className="px-4 sm:px-6 space-y-6">
            {cameraError && (
              <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-red-500/30 text-white p-8 rounded-2xl text-center space-y-6 shadow-2xl max-w-md mx-auto">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative text-7xl">📷</div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                  Camera Required
                </h2>
                <p className="text-slate-300 leading-relaxed">{cameraError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
                >
                  Retry Camera Access
                </button>
              </div>
            )}
            {!isCameraReady && !cameraError && (
              <div className="bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 backdrop-blur-xl border border-cyan-500/30 text-white p-10 rounded-3xl text-center space-y-8 shadow-2xl max-w-md mx-auto">
                {/* Animated Camera Icon */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative text-7xl animate-bounce">
                    📹
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Camera Access Required
                  </h2>
                  <p className="text-slate-300 leading-relaxed">
                    We need your camera to create an amazing AR experience
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-3 text-left bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <p className="text-sm text-slate-300">Click <span className="text-cyan-400 font-semibold">"Allow"</span> when prompted</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <p className="text-sm text-slate-300">Point your camera at the creature</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <p className="text-sm text-slate-300">Watch your sea creature come to life!</p>
                  </div>
                </div>

                {/* Loading Animation */}
                <div className="flex justify-center items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                <p className="text-xs text-slate-400">
                  🔒 Your privacy is protected - we don't record or store any video
                </p>
              </div>
            )}
          </div>

        {/* Professional Footer with Controls */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/98 via-black/90 to-black/60 backdrop-blur-2xl border-t border-white/10 pointer-events-auto">
          <div className="p-4 sm:p-6">
            {/* Compact Social Section - Always visible */}
            <div className="flex items-center justify-center space-x-6 mb-3">
              <a
                href="https://github.com/polat-mustafa"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-2 text-slate-400 hover:text-white transition-all duration-300"
                aria-label="GitHub"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
              </a>

              <a
                href="https://aquarium-web-ar.vercel.app/gallery/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300"
                aria-label="Gallery"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium hidden sm:inline">Gallery</span>
              </a>

              <a
                href="https://polat-mustafa.github.io/portfolio/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-2 text-slate-400 hover:text-white transition-all duration-300"
                aria-label="Portfolio"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 919-9" />
                  </svg>
                </div>
              </a>
            </div>

            {/* Hashtags - From dashboard settings */}
            <div className="text-center text-cyan-400/70 text-xs font-medium mb-2">
              {hashtags.join(' ')}
            </div>

            {/* Bottom Handle */}
            <div className="flex justify-center">
              <div className="w-12 h-1.5 bg-slate-600/50 rounded-full"></div>
            </div>
          </div>
        </footer>
        </main>


        {/* Transparent QR Scanning Overlay */}
        {isCameraReady && !activeCreature && (
          <div className="fixed inset-0 z-30 pointer-events-none">
            {/* Central scanning area */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-48 h-48">
                {/* Scanning frame with corners */}
                <div className="absolute inset-0 border border-cyan-400/40 rounded-3xl"></div>

                {/* Animated corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-2xl animate-pulse"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-2xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-2xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-2xl animate-pulse"></div>

                {/* Scanning line animation */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"
                    style={{
                      top: '50%',
                      transform: 'translateY(-50%)',
                      boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)'
                    }}
                  ></div>
                </div>

                {/* Center instruction text */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center pointer-events-auto">
                  <div className="bg-black/80 backdrop-blur-sm border border-cyan-400/30 rounded-2xl px-4 py-2 shadow-2xl">
                    <p className="text-cyan-300 text-sm font-medium whitespace-nowrap">
                      Point camera at QR code
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Panel */}
      <SharePanel
        isVisible={showSharePanel}
        onClose={() => {
          setShowSharePanel(false);
          setRecordedVideo(null);
        }}
        creatureName={activeCreature?.name || 'sea-creature'}
      />
    </div>
  );
}

export default function ARExperience() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold">Loading AR Experience</h2>
        </div>
      </div>
    }>
      <ARExperienceContent />
    </Suspense>
  );
}
