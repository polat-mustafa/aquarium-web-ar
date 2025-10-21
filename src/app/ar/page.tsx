'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ARViewer } from '@/components/ar/ARViewer';
import { RecordButton } from '@/components/ui/RecordButton';
import { SharePanel } from '@/components/ui/SharePanel';
import { useAppStore } from '@/stores/useAppStore';
import { galleryCreatures } from '@/utils/galleryData';
import { MODEL_REGISTRY } from '@/utils/modelMatcher';
import { initializeQRDetection, createCameraStream, stopCameraStream } from '@/utils/qrDetection';
import type { QRDetectionResult } from '@/utils/qrDetection';
import { hideGlobalLoading } from '@/components/ui/LoadingOverlay';

function ARExperienceContent() {
  // CRITICAL FIX: Extract creature ID once with useMemo to prevent infinite re-renders
  const searchParams = useSearchParams();
  const creatureIdFromUrl = useMemo(() => searchParams.get('creature'), [searchParams]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const creatureLoadedRef = useRef(false); // Prevent re-loading creature
  const arInitializedRef = useRef(false); // Prevent re-initializing AR

  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showRecordingPopup, setShowRecordingPopup] = useState(true);
  const [showCreaturePopup, setShowCreaturePopup] = useState(false);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const {
    activeCreature,
    isRecording,
    triggerSpecialAnimation,
    setActiveCreature,
    initializeAR,
    isARInitialized,
  } = useAppStore();

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

          // Initialize QR detection
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
  }, []); // Empty deps - only run once

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
      const creature = {
        id: creatureIdFromUrl,
        type: resolvedType,
        name: resolvedName,
        modelPath: resolvedModelPath,
        description: `Experience the amazing ${resolvedName} in AR!`,
        scale: 1.5,
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
  }, [creatureIdFromUrl]); // Only depend on the memoized creature ID

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

  // Recording completion handler
  const handleRecordingComplete = useCallback((blob: Blob) => {
    console.log('🎯 Recording complete!', {
      blobSize: blob.size,
      blobType: blob.type
    });

    if (blob.size === 0) {
      console.error('❌ Blob is empty!');
      return;
    }

    setRecordedVideo(blob);
    setShowSharePanel(true);
  }, []);

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

      {/* AR Content Overlay - Render Three.js model viewer */}
      {isCameraReady && (
        <div
          className="fixed inset-0 w-full h-full z-10"
          style={{ background: 'transparent', pointerEvents: 'auto' }}
          onClick={handleScreenTap}
          onTouchStart={handleScreenTap}
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

          {/* Animated Touch Indicator - Shows for 10 seconds - Right side, smaller */}
          {activeCreature && (
            <div className="absolute top-1/3 right-8 pointer-events-none animate-pulse">
              <div className="relative">
                {/* Animated finger pointer - smaller */}
                <div className="text-4xl animate-bounce" style={{
                  animation: 'bounce 2s infinite, fadeOut 10s forwards',
                  textShadow: '0 0 15px rgba(6, 182, 212, 0.8), 0 0 30px rgba(6, 182, 212, 0.4)'
                }}>
                  👆
                </div>

                {/* Tap indication with ripple effect */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-cyan-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-lg border border-cyan-300/50"
                    style={{ animation: 'fadeOut 10s forwards' }}>
                    Tap & Drag
                  </div>
                </div>

                {/* Ripple circles - smaller */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="absolute w-12 h-12 border-2 border-cyan-400 rounded-full animate-ping opacity-75"
                    style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite, fadeOut 10s forwards' }}></div>
                  <div className="absolute w-10 h-10 border-2 border-blue-400 rounded-full animate-ping opacity-50"
                    style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s, fadeOut 10s forwards' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile UI - Professional Overlay */}
      <div className="relative z-20 w-full min-h-screen flex flex-col"
        style={{
          background: isCameraReady
            ? 'transparent'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.9), rgba(15, 23, 42, 0.95))'
        }}
      >
        {/* Professional Sticky Header */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/95 via-black/85 to-transparent backdrop-blur-xl border-b border-white/10">
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
          {/* Minimal Recording Status */}
          {isRecording && (
            <div className="fixed top-20 right-6 z-50">
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-full flex items-center space-x-2 shadow-lg border border-red-400/30">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">REC</span>
              </div>
            </div>
          )}

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
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/98 via-black/90 to-black/60 backdrop-blur-2xl border-t border-white/10">
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

            {/* Hashtags */}
            <div className="text-center text-cyan-400/70 text-xs font-medium mb-2">
              #aquarium #WebAR #OceanMagic
            </div>

            {/* Bottom Handle */}
            <div className="flex justify-center">
              <div className="w-12 h-1.5 bg-slate-600/50 rounded-full"></div>
            </div>
          </div>
        </footer>
        </main>

        {/* Fixed Recording Pop-up (only when camera is active) */}
        {isCameraReady && showRecordingPopup && (
          <div
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40"
          >
            <div className="bg-black/70 backdrop-blur-lg border border-white/20 rounded-xl px-3 py-2 shadow-lg max-w-[200px]">
              {/* Hide Button - only show when not recording */}
              {!isRecording && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setShowRecordingPopup(false)}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                    aria-label="Hide recording controls"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Recording Section */}
              <div className="flex flex-col items-center space-y-2">
                <RecordButton
                  maxDuration={15}
                  onRecordingComplete={handleRecordingComplete}
                />

                {/* After recording completion, show redirect button */}
                {recordedVideo && (
                  <div className="mt-3 pt-3 border-t border-white/20 text-center space-y-2">
                    <button
                      onClick={() => {
                        console.log('🚀 Manual redirect button clicked');
                        window.location.href = '/share';
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      ✨ Share Your Video
                    </button>
                    <a
                      href="https://aquarium-web-ar.vercel.app/gallery/"
                      className="block w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      🎨 View Gallery
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Show Recording Button (when popup is hidden) */}
        {isCameraReady && !showRecordingPopup && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowRecordingPopup(true)}
              className="bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm border border-red-400/50 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Show recording controls"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" fill="currentColor"/>
              </svg>
            </button>
          </div>
        )}

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

      {/* Tap Overlay for AR Interactions - now enabled during recording for 3D models */}
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
