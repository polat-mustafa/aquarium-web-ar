/**
 * Feature Detection Utilities for Depth Sensing
 */

export interface FeatureSupport {
  supported: boolean;
  reason?: string;
  recommendation?: string;
}

export interface DeviceCapabilities {
  mediapipe: FeatureSupport;
  webxr: FeatureSupport;
  tensorflow: FeatureSupport;
}

/**
 * Check if MediaPipe is supported
 */
export async function checkMediaPipeSupport(): Promise<FeatureSupport> {
  try {
    // Check if we can import MediaPipe
    const mediaTest = await import('@mediapipe/hands');

    return {
      supported: true,
    };
  } catch (error) {
    return {
      supported: false,
      reason: 'MediaPipe libraries not available',
      recommendation: 'Install MediaPipe dependencies'
    };
  }
}

/**
 * Check if WebXR depth sensing is supported
 * More permissive detection for Samsung and ARCore devices
 */
export async function checkWebXRSupport(): Promise<FeatureSupport> {
  // Check basic WebXR support
  if (!('xr' in navigator)) {
    return {
      supported: false,
      reason: 'WebXR not available in this browser',
      recommendation: 'Use Chrome or Edge on Android, or Quest Browser on Meta Quest'
    };
  }

  const xr = (navigator as any).xr;

  if (!xr || !xr.isSessionSupported) {
    return {
      supported: false,
      reason: 'WebXR API not initialized',
      recommendation: 'Use an AR-capable browser on Quest 3 or ARCore device'
    };
  }

  try {
    // Check if immersive-ar is supported
    const isARSupported = await xr.isSessionSupported('immersive-ar');

    if (!isARSupported) {
      // For Samsung and other Android devices, be more permissive
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('android') || userAgent.includes('samsung')) {
        console.log('⚠️ WebXR check failed, but Android device detected - allowing WebXR attempt');
        return {
          supported: true,
          reason: 'Android/Samsung device detected - WebXR may work',
          recommendation: 'WebXR enabled for ARCore-capable Android devices'
        };
      }

      return {
        supported: false,
        reason: 'Immersive AR not supported',
        recommendation: 'Requires Meta Quest 3/3S or Android device with ARCore'
      };
    }

    return {
      supported: true,
      reason: 'WebXR AR available',
      recommendation: 'WebXR depth sensing enabled'
    };
  } catch (error) {
    // Even if check fails, allow on Android/Samsung devices
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android') || userAgent.includes('samsung')) {
      console.log('⚠️ WebXR error but Android detected - allowing attempt');
      return {
        supported: true,
        reason: 'Android device - WebXR enabled for testing',
        recommendation: 'Try enabling WebXR - should work on ARCore devices'
      };
    }

    return {
      supported: false,
      reason: 'WebXR session check failed',
      recommendation: 'Use Quest 3, Quest 3S, or ARCore-enabled Android device'
    };
  }
}

/**
 * Check if TensorFlow.js is supported
 */
export async function checkTensorFlowSupport(): Promise<FeatureSupport> {
  try {
    // Check if TensorFlow.js can be loaded
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();

    // Check WebGL support (required for TF.js)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return {
        supported: false,
        reason: 'WebGL not supported',
        recommendation: 'Use a device with WebGL support'
      };
    }

    return {
      supported: true,
    };
  } catch (error) {
    return {
      supported: false,
      reason: 'TensorFlow.js not available or initialization failed',
      recommendation: 'Use a modern browser with WebGL support'
    };
  }
}

/**
 * Check all depth sensing capabilities
 */
export async function checkAllCapabilities(): Promise<DeviceCapabilities> {
  const [mediapipe, webxr, tensorflow] = await Promise.all([
    checkMediaPipeSupport(),
    checkWebXRSupport(),
    checkTensorFlowSupport()
  ]);

  return {
    mediapipe,
    webxr,
    tensorflow
  };
}

/**
 * Get device type
 */
export function getDeviceType(): 'desktop' | 'mobile' | 'quest' | 'unknown' {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('quest')) {
    return 'quest';
  }

  if (/android|iphone|ipad|ipod/.test(userAgent)) {
    return 'mobile';
  }

  if (/windows|mac|linux/.test(userAgent)) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Get recommended depth sensing mode for this device
 */
export async function getRecommendedMode(): Promise<'mediapipe' | 'webxr' | 'tensorflow' | 'none'> {
  const deviceType = getDeviceType();
  const capabilities = await checkAllCapabilities();

  // Quest devices should try WebXR first
  if (deviceType === 'quest' && capabilities.webxr.supported) {
    return 'webxr';
  }

  // MediaPipe is best for most devices
  if (capabilities.mediapipe.supported) {
    return 'mediapipe';
  }

  // TensorFlow as fallback
  if (capabilities.tensorflow.supported) {
    return 'tensorflow';
  }

  return 'none';
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(mode: 'mediapipe' | 'webxr' | 'tensorflow', error: Error): string {
  const deviceType = getDeviceType();

  if (mode === 'webxr') {
    if (deviceType === 'desktop') {
      return 'WebXR Depth Sensing requires an AR headset like Meta Quest 3 or an ARCore-enabled Android device. Try using MediaPipe Hands instead, which works on all devices.';
    }
    if (deviceType === 'mobile') {
      return 'Your mobile device may not support WebXR depth sensing. ARCore-enabled Android devices with Chrome support this feature. Try MediaPipe Hands instead.';
    }
    return 'WebXR depth sensing not available on this device. Requires Quest 3, Quest 3S, or ARCore device. Try MediaPipe Hands instead.';
  }

  if (mode === 'mediapipe') {
    return 'MediaPipe initialization failed. Please check camera permissions and try again.';
  }

  if (mode === 'tensorflow') {
    return 'TensorFlow.js depth estimation requires WebGL. Your device may not support it. Try MediaPipe Hands instead.';
  }

  return error.message;
}
