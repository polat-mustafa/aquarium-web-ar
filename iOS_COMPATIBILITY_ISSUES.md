# iOS Compatibility Analysis Report

## Executive Summary
The Aquarium WebAR application has multiple CRITICAL iOS-specific compatibility issues affecting video recording, depth sensing, and media handling.

## CRITICAL ISSUES

### 1. VIDEO CODEC INCOMPATIBILITY
**Severity: CRITICAL**
**File**: src/services/VideoRecordingService.ts (lines 78-93)

**Problem**: Only WebM codecs are tested (VP8, VP9). iOS Safari does NOT support WebM.

**Impact**: Video recording FAILS on all iOS devices.

**Root Cause**: Codec detection lacks H.264 (H264) for iOS:
- iOS uses H.264 in MP4 containers
- current code: 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'
- Missing: 'video/mp4;codecs=avc1.42E01E' (H264 for iOS)

**Fix**: Add iOS H264 codec to supported types list


### 2. CANVAS.CAPTURE STREAM NOT SUPPORTED
**Severity: CRITICAL**
**File**: src/services/VideoRecordingService.ts (line 429)

**Problem**: canvas.captureStream() is not available on iOS Safari

**Impact**: Cannot composite video + AR canvas. Video shows black screen.

**Root Cause**: iOS doesn't support canvas.captureStream() API (requires iOS 15+, still limited)

**Fix**: Implement fallback using canvas.toBlob() frame extraction


### 3. NO WEBXR ON iOS
**Severity: HIGH**
**File**: src/utils/featureDetection.ts (line 42), src/utils/depthSensing.ts (line 187)

**Problem**: navigator.xr is undefined on all iOS devices

**Impact**: Depth sensing via WebXR completely unavailable

**Fix**: Focus on MediaPipe as primary, acknowledge iOS limitation in UI


### 4. MEDIAPIPE CDN LOADING
**Severity: MEDIUM**
**File**: src/utils/depthSensing.ts (lines 54-60)

**Problem**: No timeout or fallback for CDN loading

**Code**:
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`

**Impact**: If CDN fails, whole depth sensing hangs with no error

**Fix**: Add timeout (5s) and fallback CDN


### 5. SAFE AREA OVERLAYS
**Severity: MEDIUM**
**Files**: src/services/VideoRecordingService.ts, src/services/PhotoCaptureService.ts

**Problem**: Overlay positioning ignores iOS safe area (notch, home indicator)

**Code**:
  y: window.innerHeight * 0.15  // Doesn't account for safe area

**Impact**: UI elements hidden under notch on iPhone 12+

**Fix**: Calculate safe area insets and adjust positions


### 6. PINCH ZOOM GESTURE
**Severity: MEDIUM**
**File**: src/app/ar/page.tsx (lines 331-365)

**Problem**: No touch-action CSS to prevent iOS default pinch zoom

**Impact**: Pinch gesture for AR model zoom triggers iOS viewport zoom

**Fix**: Add CSS: touchAction: 'manipulation' or 'none'


### 7. CAMERA HTTPS REQUIREMENT
**Severity**: MEDIUM
**All camera-using files**

**Problem**: iOS requires HTTPS for getUserMedia (no localhost exception)

**Impact**: Cannot test camera features without HTTPS tunnel (ngrok)

**Note**: Already documented in CLAUDE.md, but not enforced


## FILE-BY-FILE ISSUES

### src/services/VideoRecordingService.ts
- Lines 78-93: Codec list missing H.264
- Line 429: canvas.captureStream() not available on iOS
- No iOS detection or fallback

### src/services/PhotoCaptureService.ts
- Similar issues to VideoRecordingService
- Line 173-183: toBlob() uses JPEG (OK on iOS)
- Missing safe area consideration for overlays

### src/utils/depthSensing.ts
- Line 54-60: No timeout for MediaPipe CDN
- Line 187-200: WebXR unavailable on iOS (acknowledged but no fallback)
- Missing iOS-specific performance optimizations

### src/app/ar/page.tsx
- Line 331-365: Pinch zoom without touchAction CSS
- Line 519: Speech bubble y position ignores safe area
- No iOS detection or special handling

### src/components/ar/ARScene.tsx
- Line 32, 50: window.innerHeight doesn't account for safe area
- No viewport meta tag updates for iOS

### src/utils/featureDetection.ts
- Line 141-157: User agent detection exists but not used
- Error messages don't mention iOS specifically

### src/app/layout.tsx
- Line 31, 52: Viewport meta tag CORRECT (includes viewport-fit=cover)
- Header uses safe-area-inset-top CORRECT
- BUT: Footer and fixed overlays don't use safe area

### src/stores/useAppStore.ts
- Line 69-72: getUserMedia should have error handling for iOS


## TESTING REQUIREMENTS

Test on:
- iPhone 12, 13, 14, 15 (with notch)
- iPad Air (larger screen)
- iOS 15, 16, 17
- iOS Safari only (not Chrome on iOS, uses Safari engine)
- Via ngrok HTTPS tunnel (required for camera)

Test scenarios:
- [ ] Video recording codec selection
- [ ] Canvas compositing on iOS
- [ ] Safe area overlays (notch, home indicator)
- [ ] Touch gestures (pinch, tap)
- [ ] MediaPipe hand detection
- [ ] Camera permissions workflow
- [ ] QR code scanning
- [ ] Network failures (CDN timeout)


## PRIORITY FIXES

1. VIDEO CODEC: Add H.264 to getSupportedMimeType()
2. CANVAS FALLBACK: Implement frame extraction for iOS
3. SAFE AREAS: Calculate and apply insets to overlays
4. MEDIAPIPE TIMEOUT: Add 5-second CDN timeout
5. GESTURE CSS: Add touchAction CSS rules

