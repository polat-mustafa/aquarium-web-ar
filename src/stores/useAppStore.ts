import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppStore, SeaCreature, AnimationState } from '@/types';

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
          },
          false,
          'reset'
        );
      },
    }),
    {
      name: 'aquarium-app-store-v2',
    }
  )
);
