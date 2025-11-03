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

// Depth sensing detection types
type DepthSensingMode = 'mediapipe' | 'webxr' | 'tensorflow' | 'none';

interface ObstacleZone {
  id: string;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  width: number;
  height: number;
  depth?: number; // estimated depth in meters
  type: 'hand' | 'person' | 'object';
}

function TestNewSceneContent() {
  // CRITICAL FIX: Extract creature ID once with useMemo to prevent infinite re-renders
  const searchParams = useSearchParams();
  const router = useRouter();
  const creatureIdFromUrl = useMemo(() => searchParams.get('creature'), [searchParams]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const creatureLoadedRef = useRef(false);
  const arInitializedRef = useRef(false);

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

  // DEPTH SENSING STATES
  const [depthSensingMode, setDepthSensingMode] = useState<DepthSensingMode>('none');
  const [obstacleZones, setObstacleZones] = useState<ObstacleZone[]>([]);
  const [showDepthVisualization, setShowDepthVisualization] = useState(true);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const mediaPipeWorkerRef = useRef<any>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [showQuickTip, setShowQuickTip] = useState(true);

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

    capturePhoto();

    setTimeout(() => {
      router.push('/ar/photo-preview');
    }, 100);
  }, [activeCreature, capturePhoto, router]);

  // State for current fish fact
  const [currentFact, setCurrentFact] = useState<ReturnType<typeof getRandomFishFact>>(null);

  // Pinch zoom state
  const lastPinchDistance = useRef<number | null>(null);

  // Set body data-page attribute for AR-specific styles
  useEffect(() => {
    document.body.setAttribute('data-page', 'ar-test');
    hideGlobalLoading();

    // Hide quick tip after 5 seconds
    const tipTimer = setTimeout(() => {
      setShowQuickTip(false);
    }, 5000);

    return () => {
      document.body.removeAttribute('data-page');
      clearTimeout(tipTimer);
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

  // Initialize AR from store (once)
  useEffect(() => {
    if (!arInitializedRef.current && !isARInitialized) {
      arInitializedRef.current = true;
      initializeAR().catch((error) => {
        console.error('AR initialization error:', error);
      });
    }
  }, []);

  // Initialize camera and QR detection
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

  // Load creature from URL
  useEffect(() => {
    if (!creatureIdFromUrl || creatureLoadedRef.current) return;

    let resolvedName: string | undefined = undefined;
    let resolvedType: string = 'fish';
    let resolvedModelPath: string | undefined = undefined;

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
      creatureLoadedRef.current = true;

      setTimeout(() => {
        setShowCreaturePopup(false);
      }, 2000);
    }
  }, [creatureIdFromUrl, modelSizeSettings, setActiveCreature]);

  // QR Detection handler
  const handleQRDetection = useCallback((result: QRDetectionResult) => {
    try {
      if (result.detected && result.creature) {
        setActiveCreature(result.creature);
        setShowCreaturePopup(true);
        creatureLoadedRef.current = true;

        setTimeout(() => {
          setShowCreaturePopup(false);
        }, 2000);
      }
    } catch (error) {
      console.error('QR detection error:', error);
    }
  }, [setActiveCreature]);

  // DEPTH SENSING: Initialize MediaPipe
  const initializeMediaPipe = useCallback(async () => {
    try {
      // Dynamic import of MediaPipe
      const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      if (!videoRef.current) return;

      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const newObstacles: ObstacleZone[] = results.multiHandLandmarks.map((landmarks: any, index: number) => {
            // Calculate bounding box from landmarks
            const xs = landmarks.map((lm: any) => lm.x);
            const ys = landmarks.map((lm: any) => lm.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            // Add padding
            const padding = 0.05;
            return {
              id: `hand-${index}`,
              x: Math.max(0, minX - padding),
              y: Math.max(0, minY - padding),
              width: Math.min(1, maxX - minX + padding * 2),
              height: Math.min(1, maxY - minY + padding * 2),
              type: 'hand' as const
            };
          });

          setObstacleZones(newObstacles);
        } else {
          setObstacleZones([]);
        }
      });

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720
      });

      camera.start();
      mediaPipeWorkerRef.current = { hands, camera };
      setMediaPipeReady(true);

      console.log('✅ MediaPipe initialized successfully');
    } catch (error) {
      console.error('❌ MediaPipe initialization failed:', error);
    }
  }, []);

  // DEPTH SENSING: Handle mode change
  const handleDepthModeChange = useCallback((mode: DepthSensingMode) => {
    setDepthSensingMode(mode);

    // Clean up previous mode
    if (mediaPipeWorkerRef.current) {
      mediaPipeWorkerRef.current.camera?.stop();
      mediaPipeWorkerRef.current = null;
      setMediaPipeReady(false);
    }

    // Initialize new mode
    if (mode === 'mediapipe' && isCameraReady) {
      initializeMediaPipe();
    }

    setObstacleZones([]);
  }, [isCameraReady, initializeMediaPipe]);

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

    const newBubbles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      opacity: 1,
    }));

    setBubbles(prev => [...prev, ...newBubbles]);

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
    }, 16);
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
        const zoomDelta = delta * 0.015;
        const newZoom = zoomLevel + zoomDelta;
        setZoomLevel(Math.max(0.5, Math.min(3, newZoom)));

        setShowZoomIndicator(true);

        if (zoomIndicatorTimeoutRef.current) {
          clearTimeout(zoomIndicatorTimeoutRef.current);
        }

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

  // Initialize video recording service
  useEffect(() => {
    if (isCameraReady && videoRef.current && !recordingInitializedRef.current) {
      videoService.recording.initialize(videoRef.current)
        .then(() => {
          recordingInitializedRef.current = true;

          videoService.recording.onData((blob) => {
            videoService.blob.store(blob);
            setRecordedVideo(blob);
            setShowSharePanel(true);
          });

          videoService.recording.onError((error) => {
            alert('Video recording failed: ' + error.message);
          });
        })
        .catch((error) => {
          console.error('Recording initialization error:', error);
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
      if (!recordingInitializedRef.current) return;

      videoService.recording.start();
      setIsRecording(true);
      setRecordingTime(0);

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

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  }, []);

  // Fullscreen handler
  const toggleFullscreen = useCallback(() => {
    const docEl = document.documentElement as any;
    const isFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement;

    if (!isFullscreen) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          console.log('Fullscreen request failed:', err);
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
        setIsFullscreen(true);
      }
    } else {
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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update fish fact
  useEffect(() => {
    if (showSpeechBubble && activeCreature) {
      const fact = getRandomFishFact(activeCreature.name);
      setCurrentFact(fact);
    }
  }, [showSpeechBubble, activeCreature]);

  // Show touch indicator
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
    };

    videoService.recording.updateOverlayData(overlayData);
  }, [isRecording, bubbles, showSpeechBubble, currentFact, language, enableSpeechBubbles]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 relative">
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

      {/* Floating Control Button - Mobile Friendly */}
      <div className="fixed top-20 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-auto">
        {/* Quick tip tooltip */}
        {showQuickTip && !showControlPanel && (
          <div className="mr-16 bg-gradient-to-r from-orange-500/95 to-red-500/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-2xl border border-yellow-300/30 animate-slideDown">
            <p className="text-white text-xs font-medium whitespace-nowrap">
              👈 Tap to enable depth sensing
            </p>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowControlPanel(!showControlPanel);
            setShowQuickTip(false);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl border-2 border-yellow-300/50 active:scale-95 transition-transform"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Toggle Controls"
        >
          <span className="text-2xl">{showControlPanel ? '✕' : '🧪'}</span>
          {/* Active indicator when depth sensing is on */}
          {depthSensingMode !== 'none' && !showControlPanel && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>

        {/* Status badge when panel is closed */}
        {!showControlPanel && depthSensingMode !== 'none' && (
          <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-green-500/30 shadow-xl animate-slideDown">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs">✋</span>
              <span className="text-xs text-green-300 font-medium">{obstacleZones.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Depth Sensing Controls Panel - Collapsible & Mobile Optimized */}
      {showControlPanel && (
        <div className="fixed inset-x-4 top-32 z-50 bg-black/95 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/30 max-w-sm mx-auto pointer-events-auto shadow-2xl animate-slideDown">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-cyan-300 font-bold text-xs sm:text-sm flex items-center">
              <span className="mr-2">🎯</span>
              Depth Sensing
            </h3>
            <span className="text-xs text-slate-400">
              {obstacleZones.length} detected
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDepthModeChange('none');
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                depthSensingMode === 'none'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              🚫 Disabled
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDepthModeChange('mediapipe');
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                depthSensingMode === 'mediapipe'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex items-center justify-between">
                <span>✋ MediaPipe</span>
                {mediaPipeReady && <span className="text-xs bg-green-600 px-2 py-0.5 rounded">Active</span>}
              </div>
            </button>

            <button
              disabled
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-500 cursor-not-allowed"
            >
              🥽 WebXR (Soon)
            </button>

            <button
              disabled
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-500 cursor-not-allowed"
            >
              🧠 TensorFlow (Soon)
            </button>
          </div>

          {depthSensingMode !== 'none' && (
            <div className="mt-3 pt-3 border-t border-slate-600">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDepthVisualization}
                  onChange={(e) => setShowDepthVisualization(e.target.checked)}
                  className="rounded w-4 h-4"
                />
                <span>Show Detection Zones</span>
              </label>
            </div>
          )}

          <div className="mt-3 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowControlPanel(false);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Close Panel
            </button>
          </div>
        </div>
      )}

      {/* Obstacle Zone Visualization */}
      {showDepthVisualization && obstacleZones.length > 0 && (
        <div className="fixed inset-0 z-25 pointer-events-none">
          {obstacleZones.map((zone) => (
            <div
              key={zone.id}
              className="absolute border-2 rounded-lg"
              style={{
                left: `${zone.x * 100}%`,
                top: `${zone.y * 100}%`,
                width: `${zone.width * 100}%`,
                height: `${zone.height * 100}%`,
                borderColor: zone.type === 'hand' ? '#00ff00' : '#ff00ff',
                backgroundColor: zone.type === 'hand' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 255, 0.1)',
              }}
            >
              <span className="absolute -top-6 left-0 text-xs font-bold text-white bg-black/70 px-2 py-1 rounded">
                {zone.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recording Timer */}
      {isRecording && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-red-500 text-white px-6 py-2 rounded-full flex items-center space-x-2 shadow-2xl animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-mono font-bold text-lg">
              {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
              {(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Zoom Indicator */}
      {showZoomIndicator && (
        <div className="fixed top-32 right-6 z-50 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-xl border border-white/20">
            <span className="text-2xl">🔍</span>
            <span className="font-bold text-base">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* AR Content Overlay */}
      <div
        id="ar-overlay-content"
        className="fixed inset-0 w-full h-full z-20"
        style={{ background: 'transparent', pointerEvents: 'auto' }}
        onClick={handleScreenTap}
        onTouchStart={handleScreenTap}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ARViewer
          className="w-full h-full"
          obstacleZones={obstacleZones}
          enableCollisionDetection={depthSensingMode !== 'none'}
        />

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

        {/* Touch Indicator */}
        {activeCreature && showDelayedTouchIndicator && (
          <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 pointer-events-none"
            style={{
              animation: 'slideInFromTop 0.6s ease-out, fadeOut 0.5s ease-out forwards',
              animationDelay: `0s, ${(touchIndicatorDuration - 500) / 1000}s`
            }}>
            <div className="relative flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <div className="text-xl animate-bounce">👆</div>
              <span className="text-white/70 text-sm font-medium">Tap Fish</span>
            </div>
          </div>
        )}

        {/* Speech Bubble */}
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

        {/* AR Controls - Mobile Optimized */}
        <div className="absolute bottom-32 right-4 z-40 flex flex-col space-y-3 pointer-events-auto sm:bottom-36">
          {/* Photo Capture Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isCapturingPhoto && activeCreature) {
                handlePhotoCapture();
              }
            }}
            onTouchStart={(e) => e.stopPropagation()}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Video Recording Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              isRecording ? stopRecording() : startRecording();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all hover:scale-110 active:scale-95 ${
              isRecording ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' : 'bg-gradient-to-br from-red-500 to-red-600'
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
            onTouchStart={(e) => e.stopPropagation()}
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
          background: isCameraReady ? 'transparent' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.9), rgba(15, 23, 42, 0.95))'
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
                        Aquarium Test
                      </h1>
                      <span className="text-xs font-semibold text-orange-400/80 bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-500/30">
                        BETA
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <p className="text-xs sm:text-sm text-cyan-300 font-semibold tracking-wide uppercase">
                        Depth Sensing Test
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push('/ar')}
                    onTouchStart={(e) => e.stopPropagation()}
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
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
                >
                  Retry Camera Access
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Professional Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/98 via-black/90 to-black/60 backdrop-blur-2xl border-t border-white/10 pointer-events-auto">
          <div className="p-4 sm:p-6">
            <div className="text-center text-cyan-400/70 text-xs font-medium mb-2">
              {hashtags.join(' ')}
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-1.5 bg-slate-600/50 rounded-full"></div>
            </div>
          </div>
        </footer>
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

export default function TestNewScene() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold">Loading Test Scene</h2>
        </div>
      </div>
    }>
      <TestNewSceneContent />
    </Suspense>
  );
}
