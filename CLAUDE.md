# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

### Development
```bash
npm run dev          # Start development server at http://localhost:3000
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Mobile Testing with ngrok
```bash
npm install -g ngrok
ngrok http 3000      # Creates HTTPS tunnel for mobile device testing
```

### Testing AR Creatures
Direct creature access URLs (bypass QR scanning):
```
http://localhost:3000/ar?creature=shark-1
http://localhost:3000/ar?creature=dolphin-1
http://localhost:3000/ar?creature=turtle-1
http://localhost:3000/ar/test-newscene?creature=tuna  # Depth sensing test page
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **3D Rendering**: Three.js via React Three Fiber (@react-three/fiber, @react-three/drei)
- **State Management**: Zustand with localStorage persistence
- **AR Features**: Camera-based AR with WebXR support and depth sensing (MediaPipe)
- **Video Recording**: Custom service using MediaRecorder API with canvas compositing
- **AI Integration**: Replicate API for image/video generation (optional)

### Critical State Management Pattern

**IMPORTANT**: The app uses Zustand with very specific re-render optimization patterns:

```typescript
//  CORRECT: Select only what you need
const activeCreature = useAppStore(state => state.activeCreature);

// L WRONG: Never select currentAnimation in ARViewer - causes Canvas unmounting
const { activeCreature, currentAnimation } = useAppStore();
```

**Why**: Animation state changes frequently. Selecting `currentAnimation` in components with `<Canvas>` causes unnecessary re-renders that unmount and remount the entire Three.js scene, breaking the AR experience.

**Canvas Initialization Rule**:
- `isARInitialized` flag prevents re-initialization
- Canvas should NEVER unmount during active AR session
- See `src/stores/useAppStore.ts:61-64` for critical initialization guard

### 3D Model System

The project uses a **dual-source model system**:

1. **Static Creatures** (`src/utils/creatures.ts`):
   - Pre-defined creatures (shark, dolphin, turtle, etc.)
   - Manually configured with animations, scale, position

2. **Dynamic Model Registry** (`src/utils/modelMatcher.ts`):
   - Auto-scans `/public/models/` for `.glb`/`.gltf` files
   - Naming convention: `{name}-{category}.glb` (e.g., "clown fish-fish.glb")
   - Valid categories: fish, mammals, shellfish, mollusks, jellyfish, reptiles, baltic, custom
   - Creates gallery entries automatically with 3D badges

**Adding New 3D Models**:
1. Place model file in `/public/models/`
2. Add entry to `MODEL_REGISTRY` in `src/utils/modelMatcher.ts`:
```typescript
{
  fileName: 'blue-whale.glb',
  creatureName: 'Blue Whale',  // Creates new creature
  category: 'mammals',
  modelPath: '/models/blue-whale.glb'
}
```
3. Model appears in gallery with green "3D" badge
4. Reference: See `HOW_TO_ADD_3D_MODELS.md`

### Video Recording Architecture

**CRITICAL**: Custom implementation using canvas compositing (not html2canvas):

**Why Manual Canvas Drawing**:
- 70% smaller bundle size
- Captures AR overlay elements (speech bubbles, bubble effects)
- Better performance on mobile devices
- Recording happens in `VideoRecordingService.ts`

**Recording Flow**:
1. Initialize with video element (`photoService.capture.initialize(videoElement)`)
2. Create offscreen canvas for compositing
3. Composite: Video feed � AR canvas (WebGL) � UI overlays
4. Capture frames using `requestAnimationFrame`
5. Feed to MediaRecorder with best available codec (VP9 > VP8 > H264)

**Implementation**: `src/services/VideoRecordingService.ts`

### Depth Sensing & Real-World Interaction

**Current Implementation**: MediaPipe Hands (hand detection + collision avoidance)

**How It Works**:
1. MediaPipe detects hand landmarks in real-time
2. Creates obstacle zones (bounding boxes)
3. AR creatures detect collisions with zones
4. Fish swim away when approaching hands

**Testing**: Use `/ar/test-newscene?creature=tuna` for interactive testing

**Planned**: WebXR Depth Sensing (Quest 3, ARCore devices) and TensorFlow.js depth estimation

**Reference**: See `DEPTH_SENSING_GUIDE.md` for complete implementation details

### Multi-Language Support

Internationalization system in `src/i18n/translations.ts`:
- Supported languages: EN, TR, PL
- User preference stored in localStorage
- Fish facts available in all languages (`src/utils/fishFacts.ts`)
- Language controlled via Zustand store (`setPreferredLanguage`)

## Key Files & Directories

### Core Application Files
- `src/app/ar/page.tsx` - Main AR experience page (production)
- `src/app/ar/test-newscene/page.tsx` - Depth sensing test environment
- `src/app/gallery/page.tsx` - Creature gallery with category filters
- `src/app/dashboard/page.tsx` - Admin settings (password protected)

### State & Data
- `src/stores/useAppStore.ts` - Global Zustand store with localStorage persistence
- `src/types/index.ts` - TypeScript definitions for creatures, AR markers, app state
- `src/utils/creatures.ts` - Static creature configurations
- `src/utils/modelMatcher.ts` - Dynamic model registry (add models here)

### AR Components
- `src/components/ar/ARViewer.tsx` - Canvas wrapper, camera setup, lighting
- `src/components/ar/CreatureModel.tsx` - 3D model loader, animations, collision detection
- `src/components/ar/ARScene.tsx` - Three.js scene configuration

### Services
- `src/services/VideoRecordingService.ts` - Video recording with canvas compositing
- `src/services/PhotoCaptureService.ts` - Photo capture with overlays
- `src/services/ReplicateVideoService.ts` - AI video generation (optional)

### Utilities
- `src/utils/qrDetection.ts` - QR code scanning with jsQR
- `src/utils/depthSensing.ts` - Depth sensing utilities (MediaPipe, WebXR)
- `src/utils/featureDetection.ts` - WebXR feature detection
- `src/utils/iconResolver.ts` - Resolves creature icons (emoji/image fallback)

## Environment Variables

Required in `.env.local` (copy from `.env.example`):

```env
# Optional - AI Features (Replicate)
REPLICATE_API_TOKEN=your_token_here  # For AI video/image generation
```

**CRITICAL**: Never use `NEXT_PUBLIC_` prefix for API tokens - keeps them server-side only.

## Common Development Patterns

### Adding a New Creature (Without 3D Model)

Edit `src/utils/galleryData.ts`:
```typescript
{
  id: 'manta-ray',
  name: 'Manta Ray',
  emoji: '>�',
  category: 'fish',
  hashtags: ['#MantaRay', '#OceanGiant'],
  hasModel: false  // Will show "Coming Soon" in gallery
}
```

### Adding UI Overlay to Video Recording

Update `src/services/VideoRecordingService.ts`:
```typescript
private overlayData: OverlayData = {
  bubbles: [...],
  speechBubble: { text, x, y },
  yourNewOverlay: { ... }  // Add here
};

// Then draw in drawFrame method
private drawFrame() {
  // Draw video, AR canvas
  this.drawYourNewOverlay();  // Add drawing logic
}
```

### Handling AR Initialization

Always check initialization state before AR operations:
```typescript
const { isARInitialized, hasCameraPermission } = useAppStore();

if (!isARInitialized || !hasCameraPermission) {
  // Show permission prompt or loading state
  return;
}
```

### Three.js Performance Optimization

**Static Constants Pattern** (prevents object recreation):
```typescript
//  CORRECT: Static, never changes
const CAMERA_SETTINGS = {
  position: [0, 0, 5] as const,
  fov: 60,
} as const;

// L WRONG: Creates new object on every render
<Camera position={[0, 0, 5]} />
```

**Used throughout**: ARViewer.tsx, ARScene.tsx for lights, fog, camera settings

## Browser Compatibility & Testing

### Required Features
- WebRTC (camera access)
- WebGL 2.0 (Three.js)
- MediaRecorder API (video recording)
- HTTPS in production (camera permissions)

### Browser Support
- Chrome/Edge: Full support (recommended)
- Safari iOS 11.3+: Good support (WebRTC available)
- Firefox: Limited AR.js support
- Quest Browser: WebXR depth sensing available

### Mobile Testing Workflow
1. Start dev server: `npm run dev`
2. Create tunnel: `ngrok http 3000`
3. Use HTTPS URL on mobile device
4. Test camera permissions and AR experience

## Next.js Configuration

**Important Settings** (`next.config.ts`):
- `ignoreDuringBuilds: true` for ESLint/TypeScript (fast builds during development)
- `allowedDevOrigins` includes ngrok domains for mobile testing
- Custom webpack watch options reduce HMR aggressiveness

## Troubleshooting

### White Screen on AR Page
**Cause**: `isLoading` state blocking render or Canvas unmounting
**Fix**: Check `useAppStore` initial state - must start with `isLoading: false`

### 3D Model Not Loading
1. Verify file exists in `/public/models/`
2. Check `MODEL_REGISTRY` in `modelMatcher.ts`
3. Ensure path matches exactly (case-sensitive)
4. Check browser console for GLTF loading errors
5. GLB format preferred over GLTF (single file vs multiple)

### Video Recording Showing Black Screen
**Cause**: Video element not ready or AR canvas not initialized
**Fix**: Ensure `videoElement.videoWidth > 0` before calling `initialize()`

### MediaPipe Not Detecting Hands
1. Check camera permissions granted
2. Ensure good lighting conditions
3. Check browser console for CDN loading errors
4. Try reducing `modelComplexity` option

### Canvas Keeps Unmounting
**Cause**: Component re-rendering due to state selection in parent
**Fix**: Only select non-changing state in components with `<Canvas>`. Never select `currentAnimation` in ARViewer.

## Testing Strategy

### Manual Testing URLs
```
/ar?creature=shark-1              # Test specific creature
/ar/test-newscene?creature=tuna   # Test depth sensing
/gallery                          # Test model registry
/dashboard                        # Test admin settings (password: check auth.ts)
```

### QR Code Testing
Generate QR with this JSON:
```json
{
  "type": "aquarium-creature",
  "markerId": "shark-marker",
  "version": "1.0"
}
```

## Additional Documentation

The repository contains several specialized guides for specific features:
- `HOW_TO_ADD_3D_MODELS.md` - Step-by-step guide for adding new 3D models
- `DEPTH_SENSING_GUIDE.md` - Complete depth sensing implementation details
- `VIDEO_ANIMATION_GUIDE.md` - AI video generation using Replicate
- `MODEL_APPROVAL_SYSTEM.md` - Admin approval workflow for user-submitted models
- `VERCEL_SETUP.md` - Deployment configuration for Vercel
- `ICON_SETUP_GUIDE.md` - Icon and emoji configuration for creatures

Refer to these guides for detailed implementation instructions on specific features.

## Common Gotchas

1. **Never modify `isARInitialized` without checking existing state** - causes Canvas remounting
2. **Always use static const for Three.js props** - prevents unnecessary object creation
3. **Don't use `NEXT_PUBLIC_` for secrets** - makes them client-side accessible
4. **GLTF files need external .bin/.texture files** - use GLB format instead
5. **Camera permissions require HTTPS in production** - use ngrok for mobile testing
6. **Model registry changes require hard refresh** - Ctrl+Shift+R or Cmd+Shift+R
