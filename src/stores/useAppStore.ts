import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppStore, SeaCreature, AnimationState } from '@/types';

// Helper to load from localStorage
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper to save to localStorage
const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
  }
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state - CRITICAL: Start with isLoading false to prevent white screen
      isARInitialized: false,
      isRecording: false,
      isLoading: false, // Don't block rendering on initial load
      activeCreature: null,
      currentAnimation: 'idle',
      recordedVideo: null,
      hasCameraPermission: false,
      // New state for enhanced features - Load from localStorage
      zoomLevel: loadFromStorage('aquarium-zoom-level', 1.5),
      preferredLanguage: loadFromStorage('aquarium-language', 'en') as 'en' | 'tr' | 'pl',
      showSpeechBubble: false,
      modelSizeSettings: loadFromStorage('aquarium-model-sizes', {}),
      manualRotation: 0,
      // Dashboard settings - Load from localStorage
      enableSpeechBubbles: loadFromStorage('aquarium-enable-speech-bubbles', true),
      speechBubbleDuration: loadFromStorage('aquarium-speech-bubble-duration', 8000),
      hashtags: loadFromStorage('aquarium-hashtags', ['#aquarium', '#WebAR', '#OceanMagic']),
      showTouchIndicator: loadFromStorage('aquarium-show-touch-indicator', true),
      touchIndicatorDuration: loadFromStorage('aquarium-touch-indicator-duration', 10000),
      // Photo capture state
      capturedPhoto: null,
      selectedAITemplate: null,
      isCapturingPhoto: false,
      showLensAnimation: false,

      // Actions
      initializeAR: async () => {
        const state = get();

        // CRITICAL: Don't re-initialize if already done - prevents Canvas unmount
        if (state.isARInitialized) {
          console.log('AR already initialized, skipping re-initialization');
          return;
        }

        set({ isLoading: true }, false, 'initializeAR/start');

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });

          stream.getTracks().forEach((track) => track.stop());

          set(
            {
              hasCameraPermission: true,
              isARInitialized: true,
              isLoading: false,
            },
            false,
            'initializeAR/success'
          );
        } catch (error) {
          console.error('Failed to initialize AR:', error);
          set(
            {
              hasCameraPermission: false,
              isARInitialized: false,
              isLoading: false,
            },
            false,
            'initializeAR/error'
          );
        }
      },

      startRecording: () => {
        const { isARInitialized, hasCameraPermission } = get();

        if (!isARInitialized || !hasCameraPermission) {
          console.warn(
            'Cannot start recording: AR not initialized or no camera permission'
          );
          return;
        }

        set({ isRecording: true }, false, 'startRecording');
      },

      stopRecording: () => {
        set({ isRecording: false }, false, 'stopRecording');
      },

      setActiveCreature: (creature: SeaCreature) => {
        set(
          {
            activeCreature: creature,
            currentAnimation: 'entrance',
          },
          false,
          'setActiveCreature'
        );

        setTimeout(() => {
          const currentState = get();
          if (currentState.activeCreature?.id === creature.id) {
            set(
              { currentAnimation: 'idle' },
              false,
              'setActiveCreature/toIdle'
            );
          }
        }, 2000);
      },

      triggerSpecialAnimation: () => {
        const { activeCreature } = get();

        if (!activeCreature) {
          console.warn('No active creature to animate');
          return;
        }

        set(
          { currentAnimation: 'specialAction' },
          false,
          'triggerSpecialAnimation'
        );

        setTimeout(() => {
          const currentState = get();
          if (currentState.activeCreature?.id === activeCreature.id) {
            set(
              { currentAnimation: 'idle' },
              false,
              'triggerSpecialAnimation/toIdle'
            );
          }
        }, 3000);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      reset: () => {
        set(
          {
            isARInitialized: false,
            isRecording: false,
            isLoading: true,
            activeCreature: null,
            currentAnimation: 'idle',
            recordedVideo: null,
            hasCameraPermission: false,
            zoomLevel: 1.5,
            preferredLanguage: 'en',
            showSpeechBubble: false,
            modelSizeSettings: {},
            manualRotation: 0,
          },
          false,
          'reset'
        );
      },

      // New actions for enhanced features
      setZoomLevel: (level: number) => {
        const newLevel = Math.max(0.5, Math.min(3, level));
        saveToStorage('aquarium-zoom-level', newLevel);
        set({ zoomLevel: newLevel }, false, 'setZoomLevel');
      },

      setPreferredLanguage: (lang: 'en' | 'tr' | 'pl') => {
        saveToStorage('aquarium-language', lang);
        set({ preferredLanguage: lang }, false, 'setPreferredLanguage');
      },

      setShowSpeechBubble: (show: boolean) => {
        set({ showSpeechBubble: show }, false, 'setShowSpeechBubble');
      },

      setModelSize: (modelId: string, size: number) => {
        const { modelSizeSettings } = get();
        const newSettings = {
          ...modelSizeSettings,
          [modelId]: size,
        };
        saveToStorage('aquarium-model-sizes', newSettings);
        set(
          {
            modelSizeSettings: newSettings,
          },
          false,
          'setModelSize'
        );
      },

      setManualRotation: (rotation: number) => {
        set({ manualRotation: rotation }, false, 'setManualRotation');
      },

      // Dashboard settings actions
      setEnableSpeechBubbles: (enable: boolean) => {
        saveToStorage('aquarium-enable-speech-bubbles', enable);
        set({ enableSpeechBubbles: enable }, false, 'setEnableSpeechBubbles');
      },

      setSpeechBubbleDuration: (duration: number) => {
        saveToStorage('aquarium-speech-bubble-duration', duration);
        set({ speechBubbleDuration: duration }, false, 'setSpeechBubbleDuration');
      },

      setHashtags: (hashtags: string[]) => {
        saveToStorage('aquarium-hashtags', hashtags);
        set({ hashtags }, false, 'setHashtags');
      },

      setShowTouchIndicator: (show: boolean) => {
        saveToStorage('aquarium-show-touch-indicator', show);
        set({ showTouchIndicator: show }, false, 'setShowTouchIndicator');
      },

      setTouchIndicatorDuration: (duration: number) => {
        saveToStorage('aquarium-touch-indicator-duration', duration);
        set({ touchIndicatorDuration: duration }, false, 'setTouchIndicatorDuration');
      },

      // Photo capture actions
      capturePhoto: async () => {
        const { isARInitialized, hasCameraPermission, activeCreature } = get();

        if (!isARInitialized || !hasCameraPermission) {
          console.warn('Cannot capture photo: AR not initialized or no camera permission');
          return;
        }

        set({ isCapturingPhoto: true, showLensAnimation: true }, false, 'capturePhoto/start');

        try {
          // Import photoService dynamically to avoid circular dependencies
          const { photoService } = await import('@/services/PhotoCaptureService');

          // Initialize photo capture if not already done
          const videoElement = document.querySelector('video');
          if (!videoElement) {
            throw new Error('Video element not found');
          }

          await photoService.capture.initialize(videoElement);

          // Update overlay data with creature name
          photoService.capture.updateOverlayData({
            creatureName: activeCreature?.name,
            timestamp: Date.now(),
          });

          // Capture the photo
          const photoBlob = await photoService.capture.capture();

          // Store the photo
          photoService.blob.store(photoBlob, activeCreature?.name);

          set(
            {
              capturedPhoto: photoBlob,
              isCapturingPhoto: false,
            },
            false,
            'capturePhoto/success'
          );

          // Navigate to preview page after lens animation
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/ar/photo-preview';
            }
          }, 800); // Wait for lens animation to complete
        } catch (error) {
          console.error('Failed to capture photo:', error);
          set(
            {
              isCapturingPhoto: false,
              showLensAnimation: false,
            },
            false,
            'capturePhoto/error'
          );
        }
      },

      setCapturedPhoto: (photo: Blob | null) => {
        set({ capturedPhoto: photo }, false, 'setCapturedPhoto');
      },

      setSelectedAITemplate: (templateId: string | null) => {
        set({ selectedAITemplate: templateId }, false, 'setSelectedAITemplate');
      },

      setShowLensAnimation: (show: boolean) => {
        set({ showLensAnimation: show }, false, 'setShowLensAnimation');
      },
    }),
    {
      name: 'aquarium-app-store-v2',
    }
  )
);
