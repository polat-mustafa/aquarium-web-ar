# Implementation Example - Test-NewScene Integration

## Quick Integration Guide

This guide shows how to integrate the new professional scanning interface and screenshot effects into the test-newscene page.

---

## 📦 New Components Available

### 1. Professional3DScanInterface

**Location:** `src/components/ar/Professional3DScanInterface.tsx`

**Props:**
```typescript
interface Professional3DScanInterfaceProps {
  isScanning?: boolean;           // Show scanning state
  progress?: number;               // Progress 0-100
  creatureName?: string;           // Name to display
  onComplete?: () => void;         // Callback when complete
  showGrid?: boolean;              // Show background grid
}
```

**Example:**
```tsx
<Professional3DScanInterface
  isScanning={showEnvironmentScan && !environmentScanComplete}
  progress={scanProgress}
  creatureName={activeCreature?.name || 'Aquatic Species'}
  onComplete={() => setEnvironmentScanComplete(true)}
  showGrid={true}
/>
```

### 2. ScreenshotCaptureEffect

**Location:** `src/components/ar/ScreenshotCaptureEffect.tsx`

**Props:**
```typescript
interface ScreenshotCaptureEffectProps {
  isActive?: boolean;              // Trigger capture
  duration?: number;               // Animation duration (ms)
  onComplete?: () => void;         // When effect done
}
```

**Example:**
```tsx
<ScreenshotCaptureEffect
  isActive={isCapturingPhoto}
  duration={800}
  onComplete={() => {
    console.log('Capture complete');
    // Navigate to photo preview
  }}
/>
```

---

## 🔧 Integration Steps

### Step 1: Import Components

Add to top of `src/app/ar/test-newscene/page.tsx`:

```typescript
import { Professional3DScanInterface } from '@/components/ar/Professional3DScanInterface';
import { ScreenshotCaptureEffect } from '@/components/ar/ScreenshotCaptureEffect';
```

### Step 2: Add State Variables

Add to your state declarations:

```typescript
// SCANNING STATES
const [scanProgress, setScanProgress] = useState(0);
const [showEnvironmentScan, setShowEnvironmentScan] = useState(true);
const [environmentScanComplete, setEnvironmentScanComplete] = useState(false);
```

### Step 3: Add Scan Progress Logic

Add effect to update progress:

```typescript
useEffect(() => {
  if (!showEnvironmentScan || environmentScanComplete) return;

  const interval = setInterval(() => {
    setScanProgress((prev) => {
      if (prev >= 100) {
        setEnvironmentScanComplete(true);
        return 100;
      }
      return prev + 2;
    });
  }, 100);

  return () => clearInterval(interval);
}, [showEnvironmentScan, environmentScanComplete]);
```

### Step 4: Add Components to JSX

Add to your return statement:

```tsx
return (
  <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 relative">
    {/* Existing code */}

    {/* SCANNING INTERFACE - Shows while scanning */}
    {showEnvironmentScan && !environmentScanComplete && (
      <Professional3DScanInterface
        isScanning={true}
        progress={scanProgress}
        creatureName={activeCreature?.name || 'Aquatic Species'}
        onComplete={() => setEnvironmentScanComplete(true)}
        showGrid={true}
      />
    )}

    {/* SCREENSHOT EFFECT - Shows during photo capture */}
    <ScreenshotCaptureEffect
      isActive={isCapturingPhoto}
      duration={800}
      onComplete={() => {
        // Navigate to photo preview or handle completion
      }}
    />

    {/* Rest of your existing UI */}
  </div>
);
```

---

## 🎨 Customization Options

### Change Scan Ring Colors

In `Professional3DScanInterface.tsx`, find the ring divs:

```tsx
// Change from cyan/blue to your colors
style={{
  borderImage: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #0284c7) 1',
  // Try:
  // Purple: linear-gradient(135deg, #a78bfa, #8b5cf6, #7c3aed)
  // Green: linear-gradient(135deg, #4ade80, #22c55e, #16a34a)
  // Pink: linear-gradient(135deg, #f43f5e, #e11d48, #be123c)
}}
```

### Change Progress Update Speed

In your state update effect:

```typescript
// Slower
return prev + 1;  // ~5 seconds to 100%

// Faster
return prev + 5;  // ~1 second to 100%
```

### Change Capture Effect Duration

When calling component:

```tsx
<ScreenshotCaptureEffect
  isActive={isCapturingPhoto}
  duration={600}  // Change duration in milliseconds
  onComplete={...}
/>
```

---

## 📊 Complete Integration Example

Here's a minimal working example:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Professional3DScanInterface } from '@/components/ar/Professional3DScanInterface';
import { ScreenshotCaptureEffect } from '@/components/ar/ScreenshotCaptureEffect';
import { ARViewer } from '@/components/ar/ARViewer';

export default function TestPage() {
  // State
  const [scanProgress, setScanProgress] = useState(0);
  const [showEnvironmentScan, setShowEnvironmentScan] = useState(true);
  const [environmentScanComplete, setEnvironmentScanComplete] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Progress animation
  useEffect(() => {
    if (!showEnvironmentScan || environmentScanComplete) return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          setEnvironmentScanComplete(true);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [showEnvironmentScan, environmentScanComplete]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Scanning Interface */}
      {showEnvironmentScan && !environmentScanComplete && (
        <Professional3DScanInterface
          isScanning={true}
          progress={scanProgress}
          creatureName="Tuna"
          onComplete={() => setEnvironmentScanComplete(true)}
          showGrid={true}
        />
      )}

      {/* Screenshot Effect */}
      <ScreenshotCaptureEffect
        isActive={isCapturingPhoto}
        duration={800}
        onComplete={() => setIsCapturingPhoto(false)}
      />

      {/* AR Content (hidden during scan) */}
      {environmentScanComplete && (
        <div className="w-full h-screen relative">
          <ARViewer />

          {/* Photo Capture Button */}
          <button
            onClick={() => setIsCapturingPhoto(true)}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-full transition-all"
          >
            📸 Capture Photo
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Advanced Customization

### Custom Creature Emoji

Modify the `getCreatureEmoji` function in `Professional3DScanInterface.tsx`:

```typescript
function getCreatureEmoji(creatureName: string): string {
  const name = creatureName.toLowerCase();

  const emojiMap: Record<string, string> = {
    shark: '🦈',
    tuna: '🐟',
    dolphin: '🐬',
    whale: '🐋',
    // Add more creatures:
    'great white': '🦈',
    'blue whale': '🐋',
    'your custom': '🌟',
  };

  // ... rest of function
}
```

### Custom Color Theme

Create a variant component:

```tsx
interface ThemedInterfaceProps extends Professional3DScanInterfaceProps {
  theme?: 'cyan' | 'purple' | 'green' | 'pink';
}

export const ThemedScanInterface: React.FC<ThemedInterfaceProps> = ({
  theme = 'cyan',
  ...props
}) => {
  const colorMap = {
    cyan: {
      primary: '#06b6d4',
      secondary: '#0284c7',
      accent: '#0ea5e9',
    },
    purple: {
      primary: '#a78bfa',
      secondary: '#8b5cf6',
      accent: '#7c3aed',
    },
    // ... more themes
  };

  const colors = colorMap[theme];
  // Apply colors to components
};
```

### Custom Sound Effects

Add audio on capture:

```typescript
const playShutterSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};
```

---

## ✅ Testing the Integration

### Basic Test

```typescript
// Open test page
http://localhost:3000/ar/test-newscene?creature=tuna

// Expected:
// 1. Scanning interface appears with progress 0%
// 2. Scan rings rotate smoothly
// 3. Progress increases gradually
// 4. After ~50 seconds, interface completes
// 5. AR content appears
```

### Feature Test

```typescript
// 1. Test scanning interface
- Check rings rotate (60 FPS)
- Check progress updates
- Check scan lines animate

// 2. Test capture effect
- Click photo button
- Check flash appears
- Check scan lines animate
- Check checkmark appears
- Check effect completes

// 3. Test performance
- Open DevTools (F12)
- Check FPS (should be >55)
- Check memory (should be <75MB)
```

---

## 🚀 Performance Tips

### Monitor Performance

```typescript
// Add to component
useEffect(() => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    console.log(`Component mounted for ${endTime - startTime}ms`);
  };
}, []);
```

### Optimize Re-renders

```typescript
// Use React.memo to prevent unnecessary re-renders
const MemoScanInterface = React.memo(Professional3DScanInterface);

// Use callback to prevent function recreation
const handleComplete = useCallback(() => {
  setEnvironmentScanComplete(true);
}, []);
```

### Monitor Memory

```typescript
// Check memory usage in DevTools Performance tab
// Target: < 75MB
// Components alone: ~2-3MB
```

---

## 📝 Troubleshooting

### Scanning Interface Not Showing

```tsx
// Check 1: State is correct
console.log('showEnvironmentScan:', showEnvironmentScan);
console.log('environmentScanComplete:', environmentScanComplete);

// Check 2: Conditions are right
{showEnvironmentScan && !environmentScanComplete && (
  // ... component
)}

// Check 3: Z-index is high
{/* Component should have z-50 */}
```

### Capture Effect Not Triggering

```tsx
// Check 1: isActive is true
console.log('isCapturingPhoto:', isCapturingPhoto);

// Check 2: Button calls correct function
onClick={() => setIsCapturingPhoto(true)}

// Check 3: onComplete is called
onComplete={() => {
  console.log('Capture complete!');
  setIsCapturingPhoto(false);
}}
```

### Performance Issues

```typescript
// Check DevTools Performance tab
1. Open Performance tab
2. Click Record
3. Interact with scanning interface
4. Stop recording
5. Look for long tasks (>50ms)

// Common issues:
- Too many particles → Reduce count
- Animation interval too fast → Increase to 30-50ms
- Memory leak → Check useEffect cleanup
```

---

## 📞 Need Help?

**Reference Files:**
- `src/components/ar/Professional3DScanInterface.tsx` - Component source
- `src/components/ar/ScreenshotCaptureEffect.tsx` - Effect source
- `TEST_NEWSCENE_OPTIMIZATION.md` - Detailed optimization guide
- `WEBXR_TESTING_GUIDE.md` - WebXR specifics

**Documentation:**
- See `CLAUDE.md` for overall architecture
- See `3D_MODELS_GUIDE.md` for 3D content
- See `iOS_OPTIMIZATION_GUIDE.md` for iOS issues

---

**Last Updated:** January 2025
**Version:** 1.2.0
**Components:** 2 (Professional3DScanInterface, ScreenshotCaptureEffect)
**Status:** Production Ready ✅
