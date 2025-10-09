import { useEffect, useState } from 'react';

interface AccessibilityFeatures {
  hasScreenReader: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  announce: (message: string) => void;
}

export const useAccessibility = (): AccessibilityFeatures => {
  const [hasScreenReader, setHasScreenReader] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(highContrastQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);

    const detectScreenReader = () => {
      const hasAriaLive = document.querySelector('[aria-live]') !== null;
      const hasScreenReaderClass = document.body.classList.contains('sr-only');
      const userAgent = navigator.userAgent.toLowerCase();
      const isScreenReaderUA = userAgent.includes('nvda') ||
                               userAgent.includes('jaws') ||
                               userAgent.includes('voiceover');

      setHasScreenReader(hasAriaLive || hasScreenReaderClass || isScreenReaderUA);
    };

    detectScreenReader();

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  const announce = (message: string) => {
    let liveRegion = document.getElementById('ar-announcements');

    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'ar-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion!.textContent = message;
    }, 100);
  };

  return {
    hasScreenReader,
    prefersReducedMotion,
    prefersHighContrast,
    announce,
  };
};