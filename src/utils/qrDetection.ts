import jsQR from 'jsqr';
import { getCreatureByMarkerId } from './creatures';
import type { SeaCreature } from '@/types';

export interface QRDetectionResult {
  detected: boolean;
  data?: string;
  creature?: SeaCreature;
  confidence?: number;
}

export const initializeQRDetection = (
  videoElement: HTMLVideoElement | null,
  onDetection: (result: QRDetectionResult) => void
): (() => void) => {
  // Safety check for null video element
  if (!videoElement) {
    console.warn('Video element is null, QR detection not initialized');
    return () => {};
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let animationFrameId: number;
  let lastDetectionTime = 0;
  const detectionCooldown = 500; // Reduced cooldown for better responsiveness

  if (!context) {
    console.error('Failed to get canvas context for QR detection');
    return () => {};
  }

  const scanForQR = () => {
    try {
      if (videoElement &&
          videoElement.readyState === videoElement.HAVE_ENOUGH_DATA &&
          videoElement.videoWidth > 0 &&
          videoElement.videoHeight > 0) {

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Try to detect QR code with multiple inversion attempts for better detection
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (qrCode && qrCode.data) {
          const now = Date.now();

          if (now - lastDetectionTime > detectionCooldown) {
            lastDetectionTime = now;
            console.log('QR Code detected:', qrCode.data);
            const result = processQRCode(qrCode.data);
            if (result.detected) {
              onDetection(result);
            }
          }
        }
      }
    } catch (error) {
      console.error('QR scanning error:', error);
    }

    animationFrameId = requestAnimationFrame(scanForQR);
  };

  // Wait for video to be ready before starting detection
  const startDetection = () => {
    if (!videoElement) return;

    if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
      scanForQR();
    } else {
      videoElement.addEventListener('loadeddata', scanForQR, { once: true });
    }
  };

  startDetection();

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
};

export const processQRCode = (qrData: string): QRDetectionResult => {
  console.log('Processing QR data:', qrData);

  // Try JSON format first (aquarium-creature type)
  try {
    const data = JSON.parse(qrData);
    console.log('Parsed JSON data:', data);

    if (data.type === 'aquarium-creature' && data.markerId) {
      const creature = getCreatureByMarkerId(data.markerId);
      console.log('Found creature for markerId:', data.markerId, creature);

      if (creature) {
        return {
          detected: true,
          data: qrData,
          creature,
          confidence: 1.0,
        };
      }
    }
  } catch (error) {
    // Not JSON, try direct string matching
    console.log('QR data is not JSON, trying direct matching:', qrData);
  }

  // Try direct marker ID matching
  const directCreature = getCreatureByMarkerId(qrData);
  console.log('Direct creature lookup result:', directCreature);

  if (directCreature) {
    return {
      detected: true,
      data: qrData,
      creature: directCreature,
      confidence: 0.8,
    };
  }

  // Try URL parsing for direct AR links (e.g., https://aquarium-web-ar.vercel.app/ar?creature=shark)
  try {
    // Check if it's a full URL or relative URL
    if (qrData.includes('creature=') || qrData.includes('/ar')) {
      let url: URL;

      // If it's a full URL (starts with http/https), use it directly
      if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
        console.log('Detected full URL QR code:', qrData);
        // Redirect to the URL directly
        window.location.href = qrData;

        // Still return a result for logging purposes
        return {
          detected: true,
          data: qrData,
          confidence: 1.0,
        };
      } else {
        // Relative URL, parse it
        url = new URL(qrData, window.location.origin);
      }

      const creatureId = url.searchParams.get('creature');

      if (creatureId) {
        console.log('Found creature ID from URL:', creatureId);
        const creature = getCreatureByMarkerId(creatureId);

        if (creature) {
          return {
            detected: true,
            data: qrData,
            creature,
            confidence: 0.9,
          };
        }
      }
    }
  } catch (urlError) {
    console.log('URL parsing failed:', urlError);
  }

  console.log('No creature found for QR data:', qrData);
  return {
    detected: false,
    data: qrData,
    confidence: 0.0,
  };
};

export const generateQRCodeData = (markerId: string): string => {
  return JSON.stringify({
    type: 'aquarium-creature',
    markerId,
    timestamp: Date.now(),
    version: '1.0',
  });
};

export const validateAquariumQR = (qrData: string): boolean => {
  try {
    const data = JSON.parse(qrData);
    return data.type === 'aquarium-creature' && typeof data.markerId === 'string';
  } catch {
    return typeof qrData === 'string' && qrData.length > 0;
  }
};

export const createCameraStream = async (): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    return stream;
  } catch (error) {
    console.error('Failed to access camera:', error);
    throw new Error('Camera access denied or not available');
  }
};

export const stopCameraStream = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};