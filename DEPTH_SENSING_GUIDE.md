# Depth Sensing & Real-World Interaction Guide

## Overview

The Aquarium WebAR project implements depth sensing and real-world object detection to enable 3D creatures to interact naturally with their physical environment. This guide covers the implementation, usage, and future roadmap for depth sensing features.

## What is Depth Sensing?

Depth sensing allows AR applications to understand the 3D structure of the real world. In the Aquarium project, this enables:

- **Collision Detection** - Fish detect and avoid real-world obstacles
- **Natural Behavior** - Creatures react to user hands and objects
- **Immersive Interaction** - Enhanced realism through environmental awareness
- **Boundary Detection** - Understanding room geometry and surfaces

## Current Implementation

### MediaPipe Hands (Active)

**Status:** ✅ **Fully Implemented and Working**

MediaPipe Hands provides real-time hand tracking without specialized hardware, making it the most accessible depth sensing solution for the Aquarium project.

#### Features

| Feature | Description |
|---------|-------------|
| **Multi-Hand Detection** | Tracks up to 2 hands simultaneously |
| **21 Landmarks** | Detailed hand pose information |
| **Real-Time Performance** | 30+ FPS on modern devices |
| **Cross-Platform** | Works on desktop and mobile |
| **No Special Hardware** | Uses standard camera feed |

#### How It Works

```
Camera Feed → MediaPipe Processing → Hand Landmarks → Bounding Boxes →
Obstacle Zones → Collision Detection → Fish Avoidance Behavior
```

**Step-by-Step Process:**

1. **Video Processing:** MediaPipe analyzes each camera frame
2. **Hand Detection:** Identifies hand positions and poses
3. **Landmark Extraction:** 21 points per hand mapped in 3D space
4. **Zone Creation:** Bounding boxes generated around detected hands
5. **3D Mapping:** Zones converted to Three.js world coordinates
6. **Collision Check:** Fish positions tested against zones
7. **Avoidance Behavior:** Fish swim away when approaching obstacles

#### Technical Implementation

**Initialization** (`src/utils/depthSensing.ts`):

```typescript
const sensor = new MediaPipeDepthSensor();
await sensor.initialize(videoElement, (zones) => {
  // Obstacle zones received
  updateCreatureObstacles(zones);
});
```

**Obstacle Zone Structure:**

```typescript
interface ObstacleZone {
  id: string;              // Unique identifier (e.g., "hand-0")
  x: number;               // Normalized position 0-1
  y: number;               // Normalized position 0-1
  width: number;           // Normalized width 0-1
  height: number;          // Normalized height 0-1
  type: 'hand' | 'person' | 'object';
  confidence?: number;     // Detection confidence 0-1
  depth?: number;          // Estimated depth in meters
}
```

**Collision Detection** (`CreatureModel.tsx`):

```typescript
if (enableCollisionDetection && obstacleZones.length > 0) {
  const creaturePos = groupRef.current.position;
  const collision = checkCollision(creaturePos, obstacleZones);

  if (collision) {
    const avoidanceVector = calculateAvoidanceVector(
      creaturePos,
      collision
    );
    // Apply avoidance movement
  }
}
```

#### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome (Desktop) | ✅ Full | Recommended |
| Chrome (Android) | ✅ Full | Excellent performance |
| Edge | ✅ Full | Same as Chrome |
| Safari (iOS) | ✅ Full | iOS 14.3+ |
| Safari (macOS) | ✅ Full | Works well |
| Firefox | ✅ Full | May require permissions |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Frame Rate | 30-60 FPS |
| Latency | <50ms |
| CPU Usage | Low-Medium |
| Memory | ~50MB |
| Battery Impact | Moderate |

#### Testing

**Test Page:** `/ar/test-newscene?creature=tuna`

This dedicated test environment provides:
- Real-time obstacle visualization
- Performance metrics
- Debug information
- Control panel for settings

See "Test Environment" section below for details.

## Planned Implementations

### WebXR Depth Sensing (Future)

**Status:** 🚧 **Planned for Future Release**

WebXR Depth Sensing will provide true depth maps for more accurate environmental understanding.

#### Target Features

| Feature | Capability |
|---------|------------|
| **Real Depth Values** | Actual distance measurements in meters |
| **Depth Resolution** | 5-meter range with high precision |
| **Occlusion Support** | Virtual objects hidden behind real ones |
| **Surface Detection** | Floor, walls, and furniture recognition |
| **Hardware Acceleration** | Native device depth sensors |

#### Browser Support

| Platform | Support | Hardware Required |
|----------|---------|-------------------|
| Meta Quest 3/3S | ✅ Available | Built-in depth sensors |
| ARCore Devices | ✅ Available | TOF or stereo cameras |
| Chrome (Android) | 🚧 In Development | ARCore-enabled devices |
| iOS/Safari | ❌ Not Available | No WebXR depth support |

#### Why Not Yet Implemented

1. **Limited Availability** - Very few devices support WebXR depth sensing (2025)
2. **Browser Support** - Still emerging specification
3. **User Base** - Most users don't have compatible hardware
4. **Development Priority** - MediaPipe provides good results for current needs

#### Planned Implementation Approach

```typescript
// Feature detection
const supportsDepthSensing = await checkWebXRDepthSupport();

if (supportsDepthSensing) {
  // Request XR session with depth sensing
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['depth-sensing'],
    depthSensing: {
      usagePreference: ['cpu-optimized', 'gpu-optimized'],
      dataFormatPreference: ['luminance-alpha', 'float32']
    }
  });

  // Access depth information each frame
  session.requestAnimationFrame((time, frame) => {
    const depthInfo = frame.getDepthInformation(view);
    processDepthData(depthInfo);
  });
}
```

#### Implementation Roadmap

- [ ] Add WebXR capability detection (`src/utils/featureDetection.ts`)
- [ ] Implement depth sensing initialization
- [ ] Create depth data processor
- [ ] Add automatic fallback to MediaPipe
- [ ] Test on Quest 3 and ARCore devices
- [ ] Optimize for performance

### TensorFlow.js Depth Estimation (Research)

**Status:** 📋 **Research Phase**

TensorFlow.js with depth estimation models (like MiDaS) could provide depth information from a single camera.

#### Potential Benefits

- **No Special Hardware** - Works with any camera
- **Monocular Depth** - Estimates depth from single frame
- **Background Detection** - Identifies walls, floors, objects
- **Universal Compatibility** - Runs on all modern browsers

#### Challenges

| Challenge | Impact |
|-----------|--------|
| **Performance** | 10-20 FPS (vs 30-60 FPS for MediaPipe) |
| **Model Size** | 50-200MB download |
| **CPU/GPU Usage** | High computational cost |
| **Accuracy** | Relative depth, not absolute measurements |
| **Latency** | Higher processing delay |

#### Why Not Prioritized

1. **Performance Trade-off** - Too slow for real-time fish animation
2. **User Experience** - Large model download before use
3. **Battery Impact** - Heavy computational load on mobile
4. **MediaPipe Success** - Current solution works well

#### Potential Use Cases

Rather than real-time creature interaction, TensorFlow.js depth could be used for:

- **Photo Mode** - Enhanced static captures with depth effects
- **Scene Analysis** - One-time room scanning on launch
- **Background Blur** - Portrait mode effects for recordings
- **Static Objects** - Detecting furniture positions

## Test Environment

### Accessing the Test Page

Navigate to the depth sensing test environment:

```
http://localhost:3000/ar/test-newscene?creature=tuna
```

**URL Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `creature` | `tuna`, `shark`, `dolphin`, etc. | Select creature to test |

### Test Page Features

#### 1. Control Panel

**Depth Sensing Mode:**
- Toggle between detection modes
- Currently supports: MediaPipe, None
- Future: WebXR, TensorFlow options

**Settings:**
- Enable/disable collision detection
- Adjust avoidance sensitivity
- Toggle debug visualization

#### 2. Visual Debug Overlay

When enabled, displays:

- **Green Boxes** - Detected obstacle zones
- **Red Warning** - Active collision detection
- **Position Data** - Creature and obstacle coordinates
- **Performance Metrics** - FPS and processing time

#### 3. Performance Monitor

Real-time metrics:

```
FPS: 58 / 60
Detection: Active
Obstacles: 2 hands detected
Latency: 32ms
```

#### 4. Interaction Testing

**Test Scenarios:**

1. **Hand Tracking**
   - Move hands in front of camera
   - Verify green bounding boxes appear
   - Check fish swims away when approaching

2. **Multi-Hand Detection**
   - Show both hands
   - Verify both are tracked
   - Test fish navigating between multiple obstacles

3. **Edge Cases**
   - Fast hand movements
   - Hands entering/leaving frame
   - Poor lighting conditions

4. **Performance Testing**
   - Monitor FPS during detection
   - Check for lag or stuttering
   - Verify smooth fish movement

### Test Workflow

**Standard Testing Procedure:**

1. **Open Test Page**
   ```
   /ar/test-newscene?creature=tuna
   ```

2. **Allow Camera Permissions**
   - Grant camera access when prompted

3. **Enable Depth Sensing**
   - Toggle "MediaPipe Hands" in control panel
   - Wait for initialization (2-3 seconds)

4. **Verify Detection**
   - Move hand in front of camera
   - Look for green detection box
   - Check console for "Hand detected" messages

5. **Test Interaction**
   - Move hand toward fish
   - Fish should swim away from hand
   - Verify smooth avoidance behavior

6. **Performance Check**
   - Monitor FPS counter
   - Should maintain >30 FPS
   - Check for console errors

7. **Edge Case Testing**
   - Test multiple hands
   - Try rapid movements
   - Test with different lighting

## Integration in Production

### Main AR Page

The depth sensing system is integrated into the main AR experience:

**File:** `src/app/ar/page.tsx`

**Key Integration Points:**

1. **Initialization:**
   ```typescript
   useEffect(() => {
     if (depthSensingEnabled) {
       initializeDepthSensing(videoRef.current);
     }
   }, [depthSensingEnabled]);
   ```

2. **Obstacle Propagation:**
   ```typescript
   <CreatureModel
     creature={activeCreature}
     obstacleZones={obstacleZones}
     enableCollisionDetection={true}
   />
   ```

3. **User Settings:**
   - Depth sensing can be toggled in dashboard settings
   - Stored in user preferences
   - Persists across sessions

### Performance Optimization

**Strategies for Smooth Performance:**

1. **Throttling** - Process every 2nd or 3rd frame for CPU savings
2. **Zone Caching** - Reuse previous zones when no hands detected
3. **Lightweight Collisions** - Simple bounding box checks
4. **Async Processing** - Depth sensing on separate thread
5. **Graceful Degradation** - Disable on performance issues

## User Experience Considerations

### When to Enable Depth Sensing

**Recommended:**
- Desktop browsers with good performance
- High-end mobile devices
- Users seeking immersive interaction
- Demo/showcase scenarios

**Not Recommended:**
- Low-end mobile devices (<4GB RAM)
- Slow network connections (model loading)
- Battery-critical situations
- Users prioritizing simplicity

### User Communication

**Loading State:**
```
🔍 Initializing hand tracking...
   This enhances fish interaction with your environment.
```

**Active State:**
```
✋ Hand tracking active
   Move your hand to interact with the fish
```

**Error State:**
```
⚠️ Hand tracking unavailable
   Continuing with basic AR experience
```

## Future Enhancements

### Short-Term (3-6 months)

- [ ] Optimize MediaPipe for mobile performance
- [ ] Add gesture recognition (wave, point, etc.)
- [ ] Implement fish feeding interaction
- [ ] Add haptic feedback on collision
- [ ] Multi-creature collision handling

### Medium-Term (6-12 months)

- [ ] WebXR depth sensing for Quest devices
- [ ] Floor/surface detection
- [ ] Virtual object placement
- [ ] Depth-based lighting effects
- [ ] Occlusion rendering

### Long-Term (12+ months)

- [ ] Full room-scale AR
- [ ] Persistent object anchoring
- [ ] Multi-user shared AR experiences
- [ ] TensorFlow.js for photo effects
- [ ] AI-driven creature behavior

## Troubleshooting

### MediaPipe Not Working

**Symptoms:**
- No green boxes appearing
- Console shows initialization errors
- Fish don't react to hands

**Solutions:**

1. **Check Camera Permissions**
   - Ensure camera access granted
   - Check browser security settings

2. **Verify CDN Access**
   - MediaPipe loads from JSDelivr CDN
   - Check network/firewall settings
   - Look for CDN errors in console

3. **Update Browser**
   - Use latest Chrome/Edge version
   - Clear browser cache

4. **Check Console Errors**
   ```javascript
   // Look for these errors:
   "MediaPipe initialization failed"
   "Failed to load model"
   "Camera not accessible"
   ```

### Poor Detection Performance

**Symptoms:**
- Low FPS (<20 FPS)
- Laggy hand tracking
- Delayed fish response

**Solutions:**

1. **Improve Lighting**
   - Ensure good lighting conditions
   - Avoid backlighting

2. **Reduce Model Complexity**
   - Adjust `modelComplexity` setting
   - Try lower quality mode

3. **Close Other Tabs**
   - Free up system resources
   - Disable background processes

4. **Use Desktop Browser**
   - Better performance than mobile
   - More processing power available

### Fish Not Avoiding Hands

**Symptoms:**
- Hands detected (green boxes visible)
- Fish swim through obstacles
- No avoidance behavior

**Solutions:**

1. **Enable Collision Detection**
   - Check `enableCollisionDetection` prop
   - Verify in test-newscene page

2. **Check Obstacle Zones**
   - Console log `obstacleZones` array
   - Verify zones have proper coordinates

3. **Adjust Sensitivity**
   - May need to increase detection threshold
   - Check `checkCollision()` parameters

## API Reference

### ObstacleZone Interface

```typescript
interface ObstacleZone {
  id: string;              // Unique identifier
  x: number;               // Normalized X (0-1)
  y: number;               // Normalized Y (0-1)
  width: number;           // Normalized width (0-1)
  height: number;          // Normalized height (0-1)
  type: 'hand' | 'person' | 'object';
  confidence?: number;     // 0-1 detection confidence
  depth?: number;          // Meters from camera
}
```

### MediaPipeDepthSensor Class

```typescript
class MediaPipeDepthSensor {
  // Initialize sensor with video element
  async initialize(
    videoElement: HTMLVideoElement,
    onObstacles: (zones: ObstacleZone[]) => void
  ): Promise<void>

  // Clean up resources
  cleanup(): void
}
```

### Utility Functions

```typescript
// Check if creature collides with zone
function checkCollision(
  position: THREE.Vector3,
  zones: ObstacleZone[]
): ObstacleZone | null

// Calculate direction to avoid obstacle
function calculateAvoidanceVector(
  position: THREE.Vector3,
  obstacle: ObstacleZone
): THREE.Vector3
```

## Summary

The depth sensing system enhances the Aquarium WebAR experience with:

✅ **Real-Time Hand Tracking** - MediaPipe-powered interaction
✅ **Natural Avoidance** - Fish react to real-world obstacles
✅ **Cross-Platform** - Works on desktop and mobile
✅ **Performance Optimized** - Maintains smooth 30+ FPS
✅ **Test Environment** - Comprehensive testing tools
✅ **Future-Ready** - Architecture supports WebXR and TensorFlow.js

### Related Documentation

- **3D Model Integration:** See `3D_MODELS_GUIDE.md`
- **Feature Detection:** See `src/utils/featureDetection.ts`
- **Creature Behavior:** See `src/components/ar/CreatureModel.tsx`

---

**Last Updated:** January 2025
**Current Version:** 1.2.0
**MediaPipe Version:** 0.4.1675469240
