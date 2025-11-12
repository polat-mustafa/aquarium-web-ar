'use client';

import React, { useState, useEffect, useRef } from 'react';
import { videoService } from '@/services/VideoRecordingService';
import { useSettings } from '@/contexts/SettingsContext';

interface RecordButtonProps {
  maxDuration?: number;
  onRecordingComplete?: (blob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  className?: string;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  maxDuration = 15,
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  className = '',
}) => {
  const { t } = useSettings();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Initialize recording manager
  useEffect(() => {
    const init = async () => {
      try {
        videoElementRef.current = document.querySelector('video');
        if (videoElementRef.current) {
          await videoService.recording.initialize(videoElementRef.current);

          // Setup callbacks
          videoService.recording.onData((blob) => {
            console.log('✅ Recording complete, blob size:', blob.size);
            videoService.blob.store(blob);
            onRecordingComplete?.(blob);
            setIsRecording(false);
          });

          videoService.recording.onError((error) => {
            console.error('❌ Recording error:', error);
            setIsRecording(false);
          });

          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize recording:', error);
      }
    };

    init();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onRecordingComplete]);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime >= maxDuration) {
            return maxDuration;
          }
          return newTime;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, maxDuration]);

  // Auto-stop at max duration
  useEffect(() => {
    if (isRecording && recordingTime >= maxDuration) {
      handleStop();
    }
  }, [recordingTime, maxDuration, isRecording]);

  const handleStart = async () => {
    if (!isInitialized || disabled) return;

    try {
      await videoService.recording.start();
      setIsRecording(true);
      onRecordingStart?.();
      console.log('🎬 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      // Show user-friendly error message
      alert('Unable to start recording. Please ensure camera access is enabled.');
    }
  };

  const handleStop = () => {
    try {
      videoService.recording.stop();
      setIsRecording(false);
      onRecordingStop?.();
      console.log('⏹️ Recording stopped');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleToggle = () => {
    if (isRecording) {
      handleStop();
    } else {
      handleStart();
    }
  };

  const formatTime = (time: number): string => {
    return `${time.toFixed(1)}s`;
  };

  const progressPercent = (recordingTime / maxDuration) * 100;

  return (
    <div className={`
      flex flex-col items-center gap-4
      relative
      ${className}
    `}>
      {/* Recording indicator - shown when recording */}
      {isRecording && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-xl px-2 py-1 rounded-full border border-red-400/50 shadow-lg">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            <span className="text-white text-[10px] font-bold tracking-wide">
              REC
            </span>
            <span className="text-white/90 text-[10px] font-semibold">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Compact Progress bar */}
          <div className="w-16 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Record button */}
      <div className="relative">
        {/* Main button */}
        <button
          onClick={handleToggle}
          disabled={disabled || !isInitialized}
          className={`
            relative rounded-full
            flex items-center justify-center
            transition-all duration-300 ease-out
            focus:outline-none
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isRecording ? 'w-12 h-12' : 'w-14 h-14'}
            ${
              isRecording
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                : 'bg-white shadow-lg'
            }
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {/* Inner shape */}
          <div
            className={`
              transition-all duration-300
              ${
                isRecording
                  ? 'w-3.5 h-3.5 bg-white rounded-sm'
                  : 'w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full'
              }
            `}
          />
        </button>
      </div>

      {/* Status text */}
      {!isRecording && (
        <p className="text-white/70 text-xs font-medium">
          {disabled ? t.cameraNotReady : t.tapToRecord}
        </p>
      )}
    </div>
  );
};
