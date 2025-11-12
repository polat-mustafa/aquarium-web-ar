'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ARViewer } from '@/components/ar/ARViewer';
import { SharePanel } from '@/components/ui/SharePanel';
import { SpeechBubble } from '@/components/ui/SpeechBubble';
import LensAnimation from '@/components/ar/LensAnimation';
import { PrivacyModal } from '@/components/ui/PrivacyModal';
import { useAppStore } from '@/stores/useAppStore';
import { useSettings } from '@/contexts/SettingsContext';
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
  const router = useRouter();
  const creatureIdFromUrl = useMemo(() => searchParams.get('creature'), [searchParams]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const creatureLoadedRef = useRef(false); // Prevent re-loading creature
  const arInitializedRef = useRef(false); // Prevent re-initializing AR

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCreaturePopup, setShowCreaturePopup] = useState(false);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([]);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const recordingInitializedRef = useRef(false);
  const [showDelayedTouchIndicator, setShowDelayedTouchIndicator] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Privacy Modal State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Get language from Settings context
  const { language } = useSettings();

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
    capturePhoto,
    showLensAnimation,
    setShowLensAnimation,
    isCapturingPhoto,
  } = useAppStore();

  // Custom photo capture handler that uses Next.js router
  const handlePhotoCapture = useCallback(() => {
    if (!activeCreature) return;

    // Start the photo capture process (don't wait)
    capturePhoto();

    // Navigate immediately to show loading screen
    // The photo will be captured and saved while loading screen is showing
    setTimeout(() => {
      router.push('/ar/photo-preview');
    }, 100); // Navigate almost immediately after button press
  }, [activeCreature, capturePhoto, router]);

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

  // Check if privacy was already accepted
  useEffect(() => {
    const accepted = localStorage.getItem('aquarium-privacy-accepted');
    if (accepted === 'true') {
      setPrivacyAccepted(true);
    } else {
      setShowPrivacyModal(true);
    }
  }, []);

  const handlePrivacyAccept = useCallback(() => {
    localStorage.setItem('aquarium-privacy-accepted', 'true');
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
  }, []);

  const handlePrivacyDecline = useCallback(() => {
    router.push('/');
  }, [router]);

  // Sync Settings language with AR preferredLanguage
  useEffect(() => {
    if (language !== preferredLanguage) {
      setPreferredLanguage(language);
    }
  }, [language, preferredLanguage, setPreferredLanguage]);

  // Initialize AR from store (once) - ONLY on first mount
  useEffect(() => {
    if (!arInitializedRef.current && !isARInitialized) {
      arInitializedRef.current = true;
      initializeAR().catch((error) => {
      });
    }
  }, []); // Empty deps - only run once

  // Initialize camera and QR detection (once)
  useEffect(() => {
    let stopQRDetection: (() => void) | null = null;
    let mounted = true;

    const initializeCamera = async () => {
      try {
        const stream = await createCameraStream();

        if (!mounted) return;

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video metadata to load
          await new Promise<void>((resolve, reject) => {
            if (!videoRef.current) {
              reject(new Error('Video ref lost'));
              return;
            }

            const timeout = setTimeout(() => reject(new Error('Metadata load timeout')), 5000);

            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve();
            };
          });

          if (!mounted) return;

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
        if (mounted) {
          setCameraError('Camera access denied. Please allow camera permissions and refresh.');
        }
      }
    };

    initializeCamera();

    return () => {
      mounted = false;
      if (stopQRDetection) stopQRDetection();
      if (streamRef.current) stopCameraStream(streamRef.current);
    };
  }, []);

  // CRITICAL FIX: Load creature from URL ONCE using ref to prevent re-loading
  useEffect(() => {
    if (!creatureIdFromUrl || creatureLoadedRef.current) return;


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

      setActiveCreature(creature);
      setShowCreaturePopup(true);
      creatureLoadedRef.current = true; // Mark as loaded - never reload

      // Auto-close popup after 2 seconds
      setTimeout(() => {
        setShowCreaturePopup(false);
      }, 2000);
    } else {
    }
  }, [creatureIdFromUrl, modelSizeSettings, setActiveCreature]); // Only depend on the memoized creature ID and settings

  // QR Detection handler - useCallback to prevent re-creation
  const handleQRDetection = useCallback((result: QRDetectionResult) => {
    try {
      if (result.detected && result.creature) {
        setActiveCreature(result.creature);
        setShowCreaturePopup(true);
        creatureLoadedRef.current = true;

        // Auto-close popup after 2 seconds
        setTimeout(() => {
          setShowCreaturePopup(false);
        }, 2000);
      }
    } catch (error) {
    }
  }, [setActiveCreature]);


  // Creature tap handler
  const handleCreatureTap = useCallback(() => {
    if (activeCreature) {
      triggerSpecialAnimation();
    }
  }, [activeCreature, triggerSpecialAnimation]);

  // Handle screen tap for bubble effects
  const handleScreenTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    // Create multiple small bubbles with initial opacity
    const newBubbles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      opacity: 1,
    }));

    setBubbles(prev => [...prev, ...newBubbles]);

    // Animate bubble opacity
    const startTime = Date.now();
    const animationDuration = 1000;
    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / animationDuration;

      if (progress >= 1) {
        clearInterval(animationInterval);
        setBubbles(prev => prev.filter(b => !newBubbles.find(nb => nb.id === b.id)));
      } else {
        setBubbles(prev =>
          prev.map(b => {
            const newBubble = newBubbles.find(nb => nb.id === b.id);
            if (newBubble) {
              return { ...b, opacity: 1 - progress };
            }
            return b;
          })
        );
      }
    }, 16); // ~60fps
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
        // Increased sensitivity: 0.015 instead of 0.01 for better control
        const zoomDelta = delta * 0.015;
        const newZoom = zoomLevel + zoomDelta;
        // Clamp between 0.5 and 3
        setZoomLevel(Math.max(0.5, Math.min(3, newZoom)));

        // Show zoom indicator
        setShowZoomIndicator(true);

        // Clear existing timeout
        if (zoomIndicatorTimeoutRef.current) {
          clearTimeout(zoomIndicatorTimeoutRef.current);
        }

        // Hide indicator after 1 second of no zooming
        zoomIndicatorTimeoutRef.current = setTimeout(() => {
          setShowZoomIndicator(false);
        }, 1000);
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
          recordingInitializedRef.current = true;

          // Setup callbacks
          videoService.recording.onData((blob) => {
            // Store blob in service for SharePanel to access
            videoService.blob.store(blob);
            setRecordedVideo(blob);
            setShowSharePanel(true);
          });

          videoService.recording.onError((error) => {
            alert('Video recording failed: ' + error.message);
          });
        })
        .catch((error) => {
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
        return;
      }

      videoService.recording.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
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
    } catch (error) {
    }
  }, []);

  // Fullscreen handler with iOS/WebKit support
  const toggleFullscreen = useCallback(() => {
    const docEl = document.documentElement as any;
    const isFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement;

    if (!isFullscreen) {
      // Try standard API first, then WebKit for iOS Safari
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          console.log('Fullscreen request failed:', err);
        });
      } else if (docEl.webkitRequestFullscreen) {
        // iOS Safari
        docEl.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if (docEl.webkitEnterFullscreen) {
        // iOS video element fullscreen
        docEl.webkitEnterFullscreen();
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen with iOS/WebKit support
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  // Listen for fullscreen changes with iOS/WebKit support
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFullscreen);
    };

    // Add listeners for both standard and WebKit events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
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

  // Update video recording with overlay data
  useEffect(() => {
    if (!isRecording) return;

    const overlayData = {
      bubbles: bubbles,
      speechBubble: enableSpeechBubbles && showSpeechBubble && currentFact ? {
        text: currentFact[language],
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.15,
      } : undefined,
      // Don't include touch indicator - it's just UI guidance, not for recording
    };

    videoService.recording.updateOverlayData(overlayData);
  }, [isRecording, bubbles, showSpeechBubble, currentFact, language, enableSpeechBubbles]);

  return (
    <div
      className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 relative"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'none',  // Disable browser pinch-zoom, handle ourselves
        overscrollBehavior: 'none',  // Prevent rubber-band scroll on iOS
        WebkitUserSelect: 'none',  // Disable text selection on iOS
      } as React.CSSProperties}
    >
      {/* Camera Video Background */}
      <video
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover z-0"
        autoPlay
        playsInline
        muted
        {...({ 'webkit-playsinline': 'true' } as any)}
        style={{
          transform: 'scaleX(-1)',
          WebkitTransform: 'scaleX(-1)'
        }}
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

      {/* Zoom Indicator - Show when pinch zooming */}
      {showZoomIndicator && (
        <div className="fixed top-20 right-6 z-50 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-xl border border-white/20">
            <span className="text-2xl">🔍</span>
            <span className="font-bold text-base">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* AR Content Overlay - Render Three.js model viewer - Always visible */}
      <div
        id="ar-overlay-content"
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
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 pointer-events-none"
              style={{
                animation: 'slideInFromTop 0.6s ease-out, fadeOut 0.5s ease-out forwards',
                animationDelay: `0s, ${(touchIndicatorDuration - 500) / 1000}s`
              }}>
              <div className="relative flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                {/* Animated touch icon */}
                <div className="text-xl animate-bounce">👆</div>
                <span className="text-white/70 text-sm font-medium">Tap Fish</span>
              </div>
            </div>
          )}

          {/* Speech Bubble for Fish Facts - Controlled by dashboard settings */}
          {enableSpeechBubbles && showSpeechBubble && currentFact && activeCreature && (
            <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
              <SpeechBubble
                fact={currentFact}
                language={language}
                onLanguageChange={() => {}}
                onClose={() => setShowSpeechBubble(false)}
              />
            </div>
          )}

          {/* AR Controls - Bottom Right - Always visible */}
          <div className="absolute bottom-32 right-4 z-40 flex flex-col space-y-3 pointer-events-auto">
            {/* Photo Capture Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isCapturingPhoto && activeCreature) {
                  handlePhotoCapture();
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              disabled={isCapturingPhoto || !activeCreature}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all ${
                isCapturingPhoto || !activeCreature
                  ? 'bg-gradient-to-br from-gray-500 to-gray-600 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-110 active:scale-95'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Capture Photo"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

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
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all hover:scale-110 active:scale-95 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
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
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all hover:scale-110 active:scale-95"
              style={{ WebkitTapHighlightColor: 'transparent' }}
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
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                        Aquarium
                      </h1>
                      <span className="text-xs font-semibold text-cyan-400/80 bg-cyan-900/30 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        v1.1
                      </span>
                    </div>
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
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
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
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
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
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
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

      {/* Lens Animation */}
      <LensAnimation
        isVisible={showLensAnimation}
        onComplete={() => setShowLensAnimation(false)}
      />

      {/* Privacy Modal */}
      <PrivacyModal
        show={showPrivacyModal}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
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
