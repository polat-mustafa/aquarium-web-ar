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
import { DepthSensingManager, type ObstacleZone, type DepthSensingMode } from '@/utils/depthSensing';
import ScanningAnimation from '@/components/ar/ScanningAnimation';
import { EnvironmentScanAnimation } from '@/components/ar/EnvironmentScanAnimation';
import { getUserFriendlyError, checkAllCapabilities, type DeviceCapabilities } from '@/utils/featureDetection';
import { Professional3DScanInterface } from '@/components/ar/Professional3DScanInterface';
import { ScreenshotCaptureEffect } from '@/components/ar/ScreenshotCaptureEffect';

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

  // DEPTH SENSING STATES - Support multiple modes simultaneously
  const [activeModes, setActiveModes] = useState<Set<DepthSensingMode>>(new Set(['none']));
  const [depthSensingMode, setDepthSensingMode] = useState<DepthSensingMode>('none'); // Legacy for single mode
  const [obstacleZones, setObstacleZones] = useState<ObstacleZone[]>([]);
  const [showDepthVisualization, setShowDepthVisualization] = useState(false); // Disabled by default - no visual boxes
  const [showScanningAnimation, setShowScanningAnimation] = useState(false);
  const [depthSensorReady, setDepthSensorReady] = useState(false);
  const depthManagerRef = useRef<DepthSensingManager>(new DepthSensingManager());
  const tensorflowSensorRef = useRef<any>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [showQuickTip, setShowQuickTip] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  // Detection counters
  const [detectionCounts, setDetectionCounts] = useState({
    hands: 0,
    faces: 0,
    webxr: 0,
    pose: 0
  });

  // WebXR surface detection with depth and dimensions
  const [detectedSurfaces, setDetectedSurfaces] = useState<number>(0);
  const [webxrStatus, setWebxrStatus] = useState<string>('Off');
  const [surfacePoses, setSurfacePoses] = useState<Array<{
    position: [number, number, number];
    size: [number, number];
    depth: number;
    dimensions: { width: number; height: number; depth: number };
    volume: number;
  }>>([]);
  // DETECTED OBJECTS: Real-time environment detection (WebXR + MediaPipe)
  const [detectedObjects, setDetectedObjects] = useState<Array<{
    id: string;
    position: [number, number, number];
    dimensions: { width: number; height: number; depth: number };
    volume: number;
    type: 'table' | 'floor' | 'wall' | 'object';
  }>>([]);

  // POKEMON GO STYLE: Placed organisms tracking
  const [placedOrganisms, setPlacedOrganisms] = useState<Array<{
    id: string;
    position: [number, number, number];
    creature: any;
  }>>([]);
  const [placementMode, setPlacementMode] = useState(false);
  const [canPlace, setCanPlace] = useState(false);

  // ANIMATION TEST CONTROLS
  const [showAnimationTests, setShowAnimationTests] = useState(false);
  const [triggerHideBehind, setTriggerHideBehind] = useState(0);
  const [triggerExplore, setTriggerExplore] = useState(0);
  const [triggerDance, setTriggerDance] = useState(0);

  // ⭐ VISUAL INDICATOR: Show when fish is hiding
  const [showHidingIndicator, setShowHidingIndicator] = useState(false);
  const [hidingReason, setHidingReason] = useState<'threat' | 'explore'>('threat');

  // FEEDING STATES
  const [isFeedingAnimation, setIsFeedingAnimation] = useState(false);
  const [feedPosition, setFeedPosition] = useState<[number, number] | null>(null);
  const [triggerFeedReturn, setTriggerFeedReturn] = useState(0);

  // ENVIRONMENT SCAN STATES
  const [showEnvironmentScan, setShowEnvironmentScan] = useState(false);
  const [environmentScanComplete, setEnvironmentScanComplete] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

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

    // Check device capabilities
    checkAllCapabilities().then(caps => {
      setDeviceCapabilities(caps);
      console.log('Device capabilities:', caps);
    });

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

  // Animate scan progress - faster
  useEffect(() => {
    if (!showEnvironmentScan || environmentScanComplete) return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          setEnvironmentScanComplete(true);
          return 100;
        }
        return prev + 10; // Faster loading
      });
    }, 50); // Faster interval

    return () => clearInterval(interval);
  }, [showEnvironmentScan, environmentScanComplete]);

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

          // Trigger environment scan animation on camera ready
          setShowEnvironmentScan(true);

          // ⭐ AUTO-START: Automatically start ALL environment detection
          console.log('🎯 Auto-starting environment detection (WebXR + MediaPipe)...');
          setTimeout(async () => {
            if (!mounted) return;

            try {
              // 1. Start MediaPipe for hand/face detection
              console.log('🖐️ Starting MediaPipe...');
              await depthManagerRef.current.setMode(
                'mediapipe',
                videoRef.current!,
                (zones: ObstacleZone[]) => {
                  setObstacleZones(zones);
                  const handCount = zones.filter(z => z.type === 'hand').length;
                  setDetectionCounts(prev => ({ ...prev, hands: handCount }));
                }
              );
              setDepthSensingMode('mediapipe');
              setDepthSensorReady(true);
              console.log('✅ MediaPipe started');

              // 2. Start WebXR for environment/surface detection
              if ('xr' in navigator && navigator.xr) {
                console.log('🌐 Starting WebXR...');
                try {
                  const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                  if (isSupported) {
                    setWebXRAvailable(true);
                    startWebXR(); // Use existing WebXR function
                    console.log('✅ WebXR started');
                  } else {
                    console.log('⚠️ WebXR not supported on this device');
                  }
                } catch (xrErr) {
                  console.log('⚠️ WebXR error:', xrErr);
                }
              } else {
                console.log('⚠️ WebXR not available');
              }

              console.log('✅ Environment detection started automatically');
            } catch (err) {
              console.error('❌ Auto-start failed:', err);
            }
          }, 2000); // Wait 2 seconds for camera to stabilize

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

  // DEPTH SENSING: Handle mode change
  const handleDepthModeChange = useCallback(async (mode: DepthSensingMode) => {
    console.log(`🔄 Switching to ${mode} mode...`);
    setDepthSensingMode(mode);
    setErrorMessage(null);
    setDepthSensorReady(false);
    setObstacleZones([]);

    if (mode === 'none') {
      depthManagerRef.current.stop();
      setActiveModes(new Set(['none']));
      setIsRunningAll(false);
      console.log('⏹️ Depth sensing stopped');
      return;
    }

    if (!videoRef.current) {
      setErrorMessage('Camera not available');
      setDepthSensingMode('none');
      return;
    }

    if (!isCameraReady) {
      setErrorMessage('Please wait for camera to be ready');
      setDepthSensingMode('none');
      return;
    }

    // Check video is actually playing
    if (videoRef.current.paused || videoRef.current.readyState < 2) {
      setErrorMessage('Camera video not ready. Please refresh the page.');
      setDepthSensingMode('none');
      return;
    }

    try {
      console.log(`📹 Video ready: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);

      await depthManagerRef.current.setMode(
        mode,
        videoRef.current,
        (zones: ObstacleZone[]) => {
          setObstacleZones(zones);
        }
      );

      setDepthSensorReady(true);
      setActiveModes(new Set([mode]));
      console.log(`✅ ${mode.toUpperCase()} initialized successfully`);
    } catch (error: any) {
      console.error(`❌ ${mode} initialization failed:`, error);
      const userFriendlyMsg = getUserFriendlyError(mode, error);
      setErrorMessage(userFriendlyMsg);
      setDepthSensingMode('none');
    }
  }, [isCameraReady]);

  // RUN ALL MODES: Handle running all tracking simultaneously
  const handleRunAll = useCallback(async () => {
    console.log('🚀 Starting ALL tracking modes simultaneously...');
    setIsRunningAll(true);
    setErrorMessage(null);
    // Don't show visualization boxes - they block the screen
    // setShowDepthVisualization(true);
    setShowScanningAnimation(true);

    if (!videoRef.current || !isCameraReady) {
      setErrorMessage('Camera not ready. Please wait.');
      setIsRunningAll(false);
      return;
    }

    // Start with MediaPipe (hands + faces)
    const successfulModes = new Set<DepthSensingMode>();

    try {
      console.log('📡 Starting MediaPipe...');
      await depthManagerRef.current.setMode(
        'mediapipe',
        videoRef.current,
        (zones: ObstacleZone[]) => {
          setObstacleZones(zones);
          // Count hand detections (faces are handled by TensorFlow)
          const handCount = zones.filter(z => z.type === 'hand').length;
          setDetectionCounts(prev => ({ ...prev, hands: handCount }));
        }
      );
      successfulModes.add('mediapipe');
      console.log('✅ MediaPipe started');
    } catch (error: any) {
      console.error('❌ MediaPipe failed:', error);
    }

    // Try TensorFlow (face detection)
    try {
      console.log('📡 Starting TensorFlow...');
      const { TensorFlowDepthSensor } = await import('@/utils/depthSensing');
      const tfSensor = new TensorFlowDepthSensor();

      await tfSensor.initialize(videoRef.current, (zones) => {
        // Update face count from TensorFlow
        const faceCount = zones.filter(z => z.type === 'person').length;
        setDetectionCounts(prev => ({ ...prev, faces: faceCount }));
      });

      tensorflowSensorRef.current = tfSensor;
      successfulModes.add('tensorflow');
      console.log('✅ TensorFlow started (face detection)');
    } catch (error: any) {
      console.error('❌ TensorFlow failed:', error);
    }

    // Try WebXR (Professional implementation following WebXR Cookbook)
    try {
        console.log('📡 Starting WebXR AR session...');
        setWebxrStatus('Initializing...');

        const xr = (navigator as any).xr;
        if (!xr) {
          throw new Error('navigator.xr not available');
        }

        // Check if immersive-ar is supported
        const isARSupported = await xr.isSessionSupported('immersive-ar');
        console.log(`AR supported: ${isARSupported}`);

        if (!isARSupported) {
          throw new Error('immersive-ar not supported on this device');
        }

        // Request AR session with minimal required features
        const session = await xr.requestSession('immersive-ar', {
          requiredFeatures: [],
          optionalFeatures: ['hit-test', 'dom-overlay', 'local', 'local-floor']
        });

        console.log('✅ WebXR AR session created!');
        setWebxrStatus('Active');
        successfulModes.add('webxr');

        // Request reference space for AR (use 'local' not 'local-floor')
        const xrRefSpace = await session.requestReferenceSpace('local');
        console.log('✅ Reference space created: local');

        // Create hit test source using viewer space
        const viewerSpace = await session.requestReferenceSpace('viewer');
        let hitTestSource: any = null;

        try {
          hitTestSource = await session.requestHitTestSource({
            space: viewerSpace
          });
          console.log('✅ Hit test source created');
        } catch (e) {
          console.warn('⚠️ Hit test not available:', e);
        }

        // XR Animation loop
        const onXRFrame = (time: number, frame: any) => {
          if (!session) return;

          try {
            // Get viewer pose
            const pose = frame.getViewerPose(xrRefSpace);

            if (pose && hitTestSource) {
              const hitTestResults = frame.getHitTestResults(hitTestSource);

              if (hitTestResults.length > 0) {
                setDetectedSurfaces(hitTestResults.length);
                setWebxrStatus('Detecting');
                setDetectionCounts(prev => ({ ...prev, webxr: 1 }));

                // Extract surface poses with depth and dimension calculations
                const poses: Array<{
                  position: [number, number, number];
                  size: [number, number];
                  depth: number;
                  dimensions: { width: number; height: number; depth: number };
                  volume: number;
                }> = [];

                const objects: Array<{
                  id: string;
                  position: [number, number, number];
                  dimensions: { width: number; height: number; depth: number };
                  volume: number;
                  type: 'table' | 'floor' | 'wall' | 'object';
                }> = [];

                const zones: ObstacleZone[] = [];

                for (let i = 0; i < hitTestResults.length; i++) {
                  const hitTestResult = hitTestResults[i];
                  const hitPose = hitTestResult.getPose(xrRefSpace);

                  if (hitPose) {
                    const pos = hitPose.transform.position;
                    const orientation = hitPose.transform.orientation;

                    // Calculate depth (distance from camera)
                    const depth = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);

                    // Estimate dimensions based on surface normal and depth
                    // Assume horizontal surface if Y component of normal is strong
                    const isHorizontal = Math.abs(orientation.y) > 0.7;

                    // Estimate object size (larger depth = larger estimated size)
                    const estimatedWidth = Math.max(0.5, Math.min(2.0, depth * 0.4));
                    const estimatedHeight = isHorizontal ? 0.1 : Math.max(0.5, depth * 0.3);
                    const estimatedDepth = Math.max(0.5, Math.min(2.0, depth * 0.4));

                    // Calculate volume (in cubic meters)
                    const volume = estimatedWidth * estimatedHeight * estimatedDepth;

                    // Classify object type based on position and orientation
                    let objectType: 'table' | 'floor' | 'wall' | 'object' = 'object';
                    if (isHorizontal && pos.y < -0.5) {
                      objectType = 'floor';
                    } else if (isHorizontal && pos.y > -0.5 && pos.y < 0.5) {
                      objectType = 'table';
                    } else if (!isHorizontal) {
                      objectType = 'wall';
                    }

                    poses.push({
                      position: [pos.x, pos.y, pos.z],
                      size: [estimatedWidth, estimatedDepth],
                      depth: depth,
                      dimensions: {
                        width: estimatedWidth,
                        height: estimatedHeight,
                        depth: estimatedDepth
                      },
                      volume: volume
                    });

                    // Create detected object
                    objects.push({
                      id: `webxr-object-${i}`,
                      position: [pos.x, pos.y, pos.z],
                      dimensions: {
                        width: estimatedWidth,
                        height: estimatedHeight,
                        depth: estimatedDepth
                      },
                      volume: volume,
                      type: objectType
                    });

                    // Create obstacle zone for collision detection
                    // Convert 3D world position to 2D screen space (approximate)
                    const screenX = (pos.x / depth) * 0.5 + 0.5; // Normalize to 0-1
                    const screenY = (-pos.y / depth) * 0.5 + 0.5; // Normalize to 0-1
                    const screenWidth = (estimatedWidth / depth) * 0.3; // Scale by depth
                    const screenHeight = (estimatedHeight / depth) * 0.3;

                    zones.push({
                      id: `webxr-zone-${i}`,
                      x: Math.max(0, Math.min(1, screenX - screenWidth / 2)),
                      y: Math.max(0, Math.min(1, screenY - screenHeight / 2)),
                      width: Math.min(screenWidth, 1),
                      height: Math.min(screenHeight, 1),
                      depth: depth,
                      type: 'object',
                      confidence: 0.9
                    });
                  }
                }

                setSurfacePoses(poses);
                setDetectedObjects(objects);

                // Merge WebXR obstacles with existing obstacles
                setObstacleZones(prev => {
                  // Keep non-WebXR obstacles, add new WebXR obstacles
                  const nonWebXR = prev.filter(z => !z.id.startsWith('webxr-zone-'));
                  return [...nonWebXR, ...zones];
                });

                // Enable placement when surface detected
                setCanPlace(true);
              } else {
                setDetectedSurfaces(0);
                setSurfacePoses([]);
                setDetectedObjects([]);
                setDetectionCounts(prev => ({ ...prev, webxr: 0 }));
                setCanPlace(false);

                // Remove WebXR obstacles
                setObstacleZones(prev => prev.filter(z => !z.id.startsWith('webxr-zone-')));
              }
            }
          } catch (err) {
            console.warn('⚠️ XR frame error:', err);
          }

          session.requestAnimationFrame(onXRFrame);
        };

        // Start animation loop
        session.requestAnimationFrame(onXRFrame);

        // Handle session end
        session.addEventListener('end', () => {
          console.log('📴 WebXR session ended');
          setWebxrStatus('Ended');
          setDetectedSurfaces(0);
          setSurfacePoses([]);
          setDetectionCounts(prev => ({ ...prev, webxr: 0 }));
        });

      } catch (error: any) {
        console.error('❌ WebXR initialization failed:', error);
        setWebxrStatus(`Failed: ${error.message}`);
      }

    if (successfulModes.size > 0) {
      setActiveModes(successfulModes);
      setDepthSensorReady(true);
      setDepthSensingMode('mediapipe');
      console.log(`✅ Running ${successfulModes.size} modes:`, Array.from(successfulModes).join(', '));
      console.log('⚠️ Note: Only MediaPipe actually running due to single-manager limitation');
    } else {
      setErrorMessage('Failed to start any tracking mode');
      setIsRunningAll(false);
    }
  }, [isCameraReady, deviceCapabilities]);

  // STOP ALL MODES
  const handleStopAll = useCallback(() => {
    console.log('⏹️ Stopping all tracking modes...');
    depthManagerRef.current.stop();

    // Stop TensorFlow sensor if running
    if (tensorflowSensorRef.current) {
      tensorflowSensorRef.current.stop();
      tensorflowSensorRef.current = null;
    }

    setIsRunningAll(false);
    setActiveModes(new Set(['none']));
    setDepthSensingMode('none');
    setDepthSensorReady(false);
    setObstacleZones([]);
    setDetectionCounts({ hands: 0, faces: 0, webxr: 0, pose: 0 });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      depthManagerRef.current.stop();
      if (tensorflowSensorRef.current) {
        tensorflowSensorRef.current.stop();
      }
    };
  }, []);

  // Creature tap handler
  const handleCreatureTap = useCallback(() => {
    if (activeCreature) {
      triggerSpecialAnimation();
    }
  }, [activeCreature, triggerSpecialAnimation]);

  // Feeding handler
  const handleFeeding = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Convert to normalized coordinates
    const normX = centerX / window.innerWidth;
    const normY = centerY / window.innerHeight;

    setFeedPosition([normX, normY]);
    setIsFeedingAnimation(true);

    // Trigger fish to return to center
    setTriggerFeedReturn(prev => prev + 1);

    // Reset after animation completes
    setTimeout(() => {
      setIsFeedingAnimation(false);
      setFeedPosition(null);
    }, 2000);
  }, []);

  // Handle screen tap for bubble effects and placement
  const handleScreenTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    // POKEMON GO STYLE: Place organism on tap if in placement mode
    if (placementMode && canPlace && surfacePoses.length > 0 && activeCreature) {
      const surfacePos = surfacePoses[0].position;

      // Place organism at detected surface with slight random offset
      const newOrganism = {
        id: `placed-${Date.now()}`,
        position: [
          surfacePos[0] + (Math.random() - 0.5) * 0.5, // Small random X offset
          surfacePos[1] + 0.2, // Slightly above surface
          surfacePos[2] + (Math.random() - 0.5) * 0.5  // Small random Z offset
        ] as [number, number, number],
        creature: { ...activeCreature }
      };

      setPlacedOrganisms(prev => [...prev, newOrganism]);
      console.log('🐟 Placed organism at:', newOrganism.position);

      // Show bubble effect at placement
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const placementBubbles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + 1000 + i,
        x: centerX + (Math.random() - 0.5) * 60,
        y: centerY + (Math.random() - 0.5) * 60,
        opacity: 1,
      }));
      setBubbles(prev => [...prev, ...placementBubbles]);

      return;
    }

    // Regular bubble effects
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
  }, [placementMode, canPlace, surfacePoses, activeCreature]);

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
      />

      {/* Simple Loading Screen */}
      {showEnvironmentScan && !environmentScanComplete && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            {/* Simple Loading Icon */}
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 border-4 border-cyan-200/20 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>

            {/* Progress */}
            <div className="w-48 mx-auto">
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-cyan-500 transition-all duration-100"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-cyan-300 text-xs">
                {scanProgress}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Capture Effect */}
      <ScreenshotCaptureEffect
        isActive={isCapturingPhoto}
        duration={800}
        onComplete={() => {
          setIsCapturingPhoto(false);
          setTimeout(() => {
            router.push('/ar/photo-preview');
          }, 100);
        }}
      />

      {/* Floating Control Button - Mobile Friendly */}
      <div className="fixed top-20 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-auto">
        {/* Quick tip tooltip */}
        {showQuickTip && !showControlPanel && (
          <div className="mr-16 bg-gradient-to-r from-blue-500/95 to-cyan-500/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-2xl border border-blue-300/30 animate-slideDown">
            <p className="text-white text-xs font-medium whitespace-nowrap">
              👈 Optional: Enable tracking
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
              Tracking (Optional)
            </h3>
            <span className="text-xs text-yellow-400">
              {isRunningAll ? `${activeModes.size} active` : 'May slow device'}
            </span>
          </div>

          {/* RUN ALL BUTTON */}
          <div className="mb-3">
            {!isRunningAll ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRunAll();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                🚀 Run All at the Same Time
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopAll();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg animate-pulse"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                ⏹️ Stop All Tracking
              </button>
            )}
          </div>

          <div className="border-t border-slate-600 mb-3"></div>

          <p className="text-xs text-slate-400 mb-3 text-center">Or select individual mode:</p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDepthModeChange('none');
              }}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isRunningAll}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                depthSensingMode === 'none' && !isRunningAll
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : isRunningAll
                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
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
              disabled={isRunningAll}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                (depthSensingMode === 'mediapipe' || activeModes.has('mediapipe'))
                  ? 'bg-green-500 text-white shadow-lg'
                  : isRunningAll
                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span>✋ MediaPipe Hands</span>
                  {activeModes.has('mediapipe') && depthSensorReady && (
                    <span className="text-xs bg-green-600 px-2 py-0.5 rounded">Active</span>
                  )}
                </div>
                <span className="text-[10px] text-yellow-500 mt-1">⚠ Can be slow</span>
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDepthModeChange('webxr');
              }}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isRunningAll}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                (depthSensingMode === 'webxr' || activeModes.has('webxr'))
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : isRunningAll
                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span>🥽 WebXR Depth</span>
                  {activeModes.has('webxr') && depthSensorReady && (
                    <span className="text-xs bg-cyan-600 px-2 py-0.5 rounded">Active</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Quest 3 / Samsung ARCore
                </span>
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDepthModeChange('tensorflow');
              }}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isRunningAll}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                (depthSensingMode === 'tensorflow' || activeModes.has('tensorflow'))
                  ? 'bg-purple-500 text-white shadow-lg'
                  : isRunningAll
                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span>🧠 TensorFlow.js</span>
                  {activeModes.has('tensorflow') && depthSensorReady && (
                    <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">Active</span>
                  )}
                </div>
                <span className="text-[10px] text-yellow-500 mt-1">⚠ Can be slow</span>
              </div>
            </button>
          </div>

          {depthSensingMode !== 'none' && (
            <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDepthVisualization}
                  onChange={(e) => setShowDepthVisualization(e.target.checked)}
                  className="rounded w-4 h-4"
                />
                <span>Show Detection Zones</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showScanningAnimation}
                  onChange={(e) => setShowScanningAnimation(e.target.checked)}
                  className="rounded w-4 h-4"
                />
                <span>Show Scanning Animation</span>
              </label>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 pt-3 border-t border-red-500/30">
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2">
                <p className="text-red-300 text-xs">{errorMessage}</p>
              </div>
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

      {/* Detection Counter Overlay - Compact & Responsive */}
      {isRunningAll && (
        <div className="fixed top-32 left-2 sm:top-40 sm:left-4 z-50 bg-black/90 backdrop-blur-xl rounded-lg sm:rounded-xl p-2 sm:p-3 border border-cyan-500/50 pointer-events-none shadow-2xl max-w-[140px] sm:max-w-none">
          <h3 className="text-cyan-300 font-bold text-[10px] sm:text-xs mb-2 flex items-center">
            <span className="mr-1 text-xs sm:text-sm">📊</span>
            <span className="hidden sm:inline">Live Detection</span>
            <span className="sm:hidden">Detect</span>
          </h3>
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between space-x-2 sm:space-x-3">
              <span className="text-[9px] sm:text-xs text-white flex items-center">
                <span className="mr-1 text-xs sm:text-sm">✋</span>
                <span className="hidden sm:inline">Hands:</span>
                <span className="sm:hidden">H:</span>
              </span>
              <span className={`text-xs sm:text-sm font-bold ${detectionCounts.hands > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                {detectionCounts.hands}
              </span>
            </div>
            <div className="flex items-center justify-between space-x-2 sm:space-x-3">
              <span className="text-[9px] sm:text-xs text-white flex items-center">
                <span className="mr-1 text-xs sm:text-sm">👤</span>
                <span className="hidden sm:inline">Faces:</span>
                <span className="sm:hidden">F:</span>
              </span>
              <span className={`text-xs sm:text-sm font-bold ${detectionCounts.faces > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                {detectionCounts.faces}
              </span>
            </div>
            <div className="flex items-center justify-between space-x-2 sm:space-x-3">
              <span className="text-[9px] sm:text-xs text-white flex items-center">
                <span className="mr-1 text-xs sm:text-sm">🥽</span>
                <span className="hidden sm:inline">WebXR:</span>
                <span className="sm:hidden">XR:</span>
              </span>
              <span className={`text-xs sm:text-sm font-bold ${detectedSurfaces > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {detectedSurfaces > 0 ? 'on(1)' : 'Off'}
              </span>
            </div>
            {detectedSurfaces > 0 && (
              <div className="flex items-center justify-between space-x-2 sm:space-x-3 bg-cyan-500/20 rounded px-2 py-1">
                <span className="text-[9px] sm:text-xs text-cyan-300 flex items-center">
                  <span className="mr-1 text-xs sm:text-sm">📍</span>
                  <span className="hidden sm:inline">Surfaces:</span>
                  <span className="sm:hidden">Surf:</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-cyan-400">
                  {detectedSurfaces}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between space-x-2 sm:space-x-3">
              <span className="text-[9px] sm:text-xs text-white flex items-center">
                <span className="mr-1 text-xs sm:text-sm">🧠</span>
                <span className="hidden sm:inline">TF:</span>
                <span className="sm:hidden">TF:</span>
              </span>
              <span className={`text-xs sm:text-sm font-bold ${detectionCounts.faces > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
                {detectionCounts.faces > 0 ? 'on(1)' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Animation */}
      {showScanningAnimation && depthSensingMode !== 'none' && depthSensorReady && (
        <ScanningAnimation
          isActive={true}
          mode={depthSensingMode}
          obstacleCount={obstacleZones.length}
        />
      )}

      {/* ⭐ BIG HIDING INDICATOR - Shows when fish hides behind object */}
      {showHidingIndicator && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="relative animate-bounce">
            {/* Giant pulsing background */}
            <div className="absolute inset-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
              <div className={`w-full h-full rounded-full animate-ping ${
                hidingReason === 'threat' ? 'bg-red-500/30' : 'bg-blue-500/30'
              }`}></div>
            </div>

            {/* Main indicator card */}
            <div className={`relative bg-gradient-to-br ${
              hidingReason === 'threat'
                ? 'from-red-600/95 to-orange-600/95'
                : 'from-blue-600/95 to-cyan-600/95'
            } backdrop-blur-xl px-12 py-8 rounded-3xl border-4 ${
              hidingReason === 'threat' ? 'border-red-300' : 'border-blue-300'
            } shadow-2xl transform scale-110`}>
              {/* Icon */}
              <div className="text-9xl mb-4 animate-pulse">
                {hidingReason === 'threat' ? '😱' : '🔍'}
              </div>

              {/* Text */}
              <div className="text-center">
                <h2 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
                  {hidingReason === 'threat' ? 'HIDING!' : 'EXPLORING!'}
                </h2>
                <p className="text-2xl text-white/90 font-bold">
                  {hidingReason === 'threat'
                    ? 'Fish hiding behind object'
                    : 'Fish exploring behind'}
                </p>
                <p className="text-xl text-white/70 mt-2">
                  👻 Watch it fade away!
                </p>
              </div>

              {/* Animated corner accents */}
              <div className="absolute -top-4 -left-4 w-16 h-16 border-t-8 border-l-8 border-white rounded-tl-3xl animate-pulse"></div>
              <div className="absolute -top-4 -right-4 w-16 h-16 border-t-8 border-r-8 border-white rounded-tr-3xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 border-b-8 border-l-8 border-white rounded-bl-3xl animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 border-b-8 border-r-8 border-white rounded-br-3xl animate-pulse"></div>
            </div>

            {/* Sparkles effect */}
            <div className="absolute -inset-20 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 bg-white rounded-full animate-ping"
                  style={{
                    left: `${25 + Math.cos(i * Math.PI / 4) * 40}%`,
                    top: `${25 + Math.sin(i * Math.PI / 4) * 40}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Placement Reticle - Pokemon GO Style */}
      {placementMode && canPlace && surfacePoses.length > 0 && (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
          {/* Center reticle indicator */}
          <div className="relative">
            {/* Outer ring with pulse */}
            <div className="absolute inset-0 w-32 h-32 border-4 border-green-400 rounded-full animate-ping opacity-75"></div>

            {/* Main reticle */}
            <div className="relative w-32 h-32 border-4 border-green-500 rounded-full bg-green-400/10 backdrop-blur-sm shadow-2xl flex items-center justify-center">
              {/* Crosshair lines */}
              <div className="absolute w-full h-0.5 bg-green-400"></div>
              <div className="absolute w-0.5 h-full bg-green-400"></div>

              {/* Center dot */}
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>

              {/* Corner markers */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
            </div>

            {/* Tap instruction */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-green-500/90 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl border-2 border-green-300 animate-bounce">
                👆 Tap to Place {activeCreature?.name || 'Organism'}
              </div>
            </div>

            {/* Placed count */}
            {placedOrganisms.length > 0 && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500/90 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg border border-blue-300">
                  🐟 {placedOrganisms.length} Placed
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimal Object Indicators - Dots only */}
      {detectedObjects.length > 0 && !placementMode && (
        <div className="fixed top-4 right-4 z-30 pointer-events-none">
          <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full">
            {detectedObjects.map((obj, index) => {
              const depth = Math.sqrt(
                obj.position[0] * obj.position[0] +
                obj.position[1] * obj.position[1] +
                obj.position[2] * obj.position[2]
              );
              const color = obj.type === 'table' ? '#ff9800' : obj.type === 'wall' ? '#2196f3' : '#4caf50';

              return (
                <div key={obj.id} className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: color }}
                  />
                </div>
              );
            })}
            <span className="text-white/80 text-xs ml-2">{detectedObjects.length}</span>
          </div>
        </div>
      )}

      {/* Distance Lines from Fish to Objects */}
      {detectedObjects.length > 0 && activeCreature && !placementMode && (
        <svg className="fixed inset-0 z-20 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {detectedObjects.map((obj, index) => {
            // Calculate distance
            const distance = Math.sqrt(
              obj.position[0] * obj.position[0] +
              obj.position[1] * obj.position[1] +
              obj.position[2] * obj.position[2]
            );

            // Fish is at center of screen
            const fishX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
            const fishY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

            // Project object position to screen (simplified)
            const objX = fishX + (obj.position[0] / distance) * 150;
            const objY = fishY - (obj.position[1] / distance) * 150;

            // Color based on object type
            const color = obj.type === 'table' ? '#ff9800' : obj.type === 'wall' ? '#2196f3' : '#4caf50';

            // Mid point for label
            const midX = (fishX + objX) / 2;
            const midY = (fishY + objY) / 2;

            return (
              <g key={obj.id}>
                {/* Dotted line from fish to object */}
                <line
                  x1={fishX}
                  y1={fishY}
                  x2={objX}
                  y2={objY}
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />

                {/* Distance label */}
                <text
                  x={midX}
                  y={midY - 8}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{
                    textShadow: '0 0 4px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                  }}
                >
                  {distance.toFixed(2)}m
                </text>

                {/* Object type label */}
                <text
                  x={midX}
                  y={midY + 10}
                  fill={color}
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  style={{
                    textShadow: '0 0 4px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                  }}
                >
                  {obj.type}
                </text>

                {/* Endpoint dot */}
                <circle
                  cx={objX}
                  cy={objY}
                  r="4"
                  fill={color}
                  opacity="0.8"
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* Surface Visualization - Removed (kept clean) */}

      {/* Obstacle Zone Visualization */}
      {showDepthVisualization && obstacleZones.length > 0 && (
        <div className="fixed inset-0 z-25 pointer-events-none">
          {obstacleZones.map((zone) => {
            const getZoneColor = () => {
              switch (zone.type) {
                case 'hand': return { border: '#00ff00', bg: 'rgba(0, 255, 0, 0.15)' };
                case 'person': return { border: '#00ffff', bg: 'rgba(0, 255, 255, 0.15)' };
                case 'object': return { border: '#ff00ff', bg: 'rgba(255, 0, 255, 0.15)' };
              }
            };
            const colors = getZoneColor();

            return (
              <div
                key={zone.id}
                className="absolute border-2 rounded-lg transition-all duration-300"
                style={{
                  left: `${zone.x * 100}%`,
                  top: `${zone.y * 100}%`,
                  width: `${zone.width * 100}%`,
                  height: `${zone.height * 100}%`,
                  borderColor: colors.border,
                  backgroundColor: colors.bg,
                  boxShadow: `0 0 20px ${colors.border}40`,
                }}
              >
                <span
                  className="absolute -top-8 left-0 text-xs font-bold text-white bg-black/80 px-2 py-1 rounded backdrop-blur-sm"
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  {zone.type.toUpperCase()}
                  {zone.depth && ` | ${zone.depth.toFixed(2)}m`}
                  {zone.confidence && ` | ${Math.round(zone.confidence * 100)}%`}
                </span>
              </div>
            );
          })}
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
          enableCollisionDetection={depthSensingMode !== 'none' || detectedObjects.length > 0}
          triggerFeedReturn={triggerFeedReturn}
          surfacePosition={surfacePoses.length > 0 ? surfacePoses[0].position : undefined}
          placedOrganisms={placedOrganisms}
          detectedObjects={detectedObjects}
          triggerHideBehind={triggerHideBehind}
          triggerExplore={triggerExplore}
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

        {/* Feeding Animation */}
        {isFeedingAnimation && feedPosition && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${feedPosition[0] * 100}%`,
              top: `${feedPosition[1] * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Food particles */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg"
                style={{
                  animation: `foodDrop 2s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`,
                  left: `${Math.cos((i / 12) * Math.PI * 2) * 20}px`,
                  top: `${Math.sin((i / 12) * Math.PI * 2) * 20}px`
                }}
              />
            ))}
            {/* Center glow */}
            <div className="absolute w-24 h-24 bg-yellow-400/30 rounded-full blur-2xl animate-pulse" style={{ transform: 'translate(-50%, -50%)' }} />
          </div>
        )}

        {/* Animation Test Panel */}
        {showAnimationTests && activeCreature && (
          <div className="fixed bottom-24 left-4 z-50 bg-black/95 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/50 max-w-xs pointer-events-auto shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-purple-300 font-bold text-sm flex items-center">
                <span className="mr-2">🧪</span>
                Animation Tests
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  {detectedObjects.length} obj
                </span>
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAnimationTests(false);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-white"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                ✕
              </button>
            </div>

            {/* Info text */}
            <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                ✅ Buttons work with {detectedObjects.length === 0 ? 'virtual' : 'detected'} objects. Watch fish fade & move!
              </p>
            </div>

            <div className="space-y-2">
              {/* Hide Behind Object */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTriggerHideBehind(prev => prev + 1);
                  console.log('🧪 TEST: Triggering hide behind object');

                  // ⭐ SHOW BIG HIDING INDICATOR
                  setHidingReason('threat');
                  setShowHidingIndicator(true);
                  setTimeout(() => setShowHidingIndicator(false), 4000);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                😱 Hide Behind Object
              </button>

              {/* Explore Behind */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTriggerExplore(prev => prev + 1);
                  console.log('🧪 TEST: Triggering explore behind');

                  // ⭐ SHOW BIG EXPLORING INDICATOR
                  setHidingReason('explore');
                  setShowHidingIndicator(true);
                  setTimeout(() => setShowHidingIndicator(false), 3000);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                🔍 Explore Behind
              </button>

              {/* Dance Animation */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTriggerDance(prev => prev + 1);
                  triggerSpecialAnimation();
                  console.log('🧪 TEST: Triggering dance');
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                💃 Dance Animation
              </button>

              {/* Return to Center */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTriggerFeedReturn(prev => prev + 1);
                  console.log('🧪 TEST: Return to center');
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                🏠 Return to Center
              </button>
            </div>
          </div>
        )}

        {/* AR Controls - Mobile Optimized */}
        <div className="absolute bottom-32 right-4 z-40 flex flex-col space-y-3 pointer-events-auto sm:bottom-36">
          {/* Animation Test Toggle */}
          {activeCreature && detectedObjects.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAnimationTests(!showAnimationTests);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all ${
                showAnimationTests
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600 animate-pulse'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-700 hover:scale-110 active:scale-95'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Animation Tests"
            >
              <span className="text-2xl">🧪</span>
            </button>
          )}

          {/* Placement Mode Toggle - Pokemon GO Style */}
          {activeModes.has('webxr') && activeCreature && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlacementMode(!placementMode);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all ${
                placementMode
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600 hover:scale-110 active:scale-95'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={placementMode ? 'Exit Placement Mode' : 'Enter Placement Mode'}
            >
              <span className="text-2xl">{placementMode ? '✓' : '📍'}</span>
            </button>
          )}

          {/* Clear Placed Organisms */}
          {placedOrganisms.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlacedOrganisms([]);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 hover:scale-110 active:scale-95 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Clear Placed Organisms"
            >
              <span className="text-2xl">🗑️</span>
            </button>
          )}

          {/* Feeding Button */}
          {depthSensingMode !== 'none' && (
            <button
              onClick={handleFeeding}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isFeedingAnimation}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/30 transition-all ${
                isFeedingAnimation
                  ? 'bg-gradient-to-br from-gray-500 to-gray-600 opacity-50'
                  : 'bg-gradient-to-br from-yellow-500 to-orange-600 hover:scale-110 active:scale-95'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Feed Fish"
            >
              <span className="text-2xl">🍖</span>
            </button>
          )}

          {/* Photo Capture Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isCapturingPhoto && activeCreature) {
                setIsCapturingPhoto(true);
                capturePhoto();
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

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes foodDrop {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(100px) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translateY(200px) scale(0);
            opacity: 0;
          }
        }

        @keyframes surfacePulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        @keyframes objectPulse {
          0%, 100% {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.02);
          }
        }
      `}</style>
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
