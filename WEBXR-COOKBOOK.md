# WebXR Cookbook - Professional Implementation Guide

## Overview

WebXR Device API provides access to Virtual Reality (VR) and Augmented Reality (AR) devices on the web. This guide covers best practices for implementing WebXR in web applications.

## Key Concepts

### XR Session Types

1. **`inline`** - Non-immersive session rendered in page
2. **`immersive-vr`** - Full VR experience with headset
3. **`immersive-ar`** - AR experience with camera passthrough

### Reference Spaces

- **`viewer`** - For inline sessions, origin at viewer
- **`local`** - Origin at initial position, doesn't account for floor
- **`local-floor`** - Origin at floor level, for VR room-scale
- **`bounded-floor`** - Floor-level with boundaries (room-scale VR)

## WebXR Application Lifecycle

### 1. Check WebXR Support

```javascript
// Check if WebXR is available
if (!navigator.xr) {
  console.log('WebXR not supported');
  return;
}

// Check session support
navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
  if (supported) {
    // Enable AR button
  }
});
```

### 2. Request XR Session

```javascript
// For AR (Samsung ARCore, Quest 3)
navigator.xr.requestSession('immersive-ar', {
  optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'hit-test']
}).then(onSessionStarted);

// For VR
navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['hand-tracking']
}).then(onSessionStarted);
```

### 3. Setup WebGL Layer

```javascript
function onSessionStarted(session) {
  // Create WebGL context
  let gl = canvas.getContext('webgl', { xrCompatible: true });

  // Create XR layer
  let glLayer = new XRWebGLLayer(session, gl);
  session.updateRenderState({ baseLayer: glLayer });

  // Request reference space
  session.requestReferenceSpace('local').then((refSpace) => {
    xrRefSpace = refSpace;
    session.requestAnimationFrame(onXRFrame);
  });
}
```

### 4. Render Loop

```javascript
function onXRFrame(time, frame) {
  let session = frame.session;
  let pose = frame.getViewerPose(xrRefSpace);

  session.requestAnimationFrame(onXRFrame);

  if (pose) {
    let glLayer = session.renderState.baseLayer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

    for (let view of pose.views) {
      let viewport = glLayer.getViewport(view);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

      // Render scene with view.projectionMatrix and view.transform
      renderScene(view.projectionMatrix, view.transform);
    }
  }
}
```

## AR-Specific Implementation

### Immersive AR Session

```javascript
// AR sessions should NOT have opaque backgrounds
function onSessionStarted(session) {
  session.addEventListener('end', onSessionEnded);

  // Don't render skybox in AR mode
  if (session.mode === 'immersive-ar') {
    skybox.visible = false;
  }

  let gl = createWebGLContext({ xrCompatible: true });
  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

  // AR uses 'local' not 'local-floor'
  session.requestReferenceSpace('local').then((refSpace) => {
    xrRefSpace = refSpace;

    // Handle reference space reset (important for AR)
    refSpace.addEventListener('reset', (evt) => {
      if (evt.transform) {
        xrRefSpace = xrRefSpace.getOffsetReferenceSpace(evt.transform);
      }
    });

    session.requestAnimationFrame(onXRFrame);
  });
}
```

### Hit Testing (Surface Detection)

```javascript
// Request session with hit-test feature
navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['hit-test']
}).then(async (session) => {
  await onSessionStarted(session);

  // Create hit test source
  let referenceSpace = await session.requestReferenceSpace('viewer');
  let hitTestSource = await session.requestHitTestSource({ space: referenceSpace });

  // In frame loop
  function onXRFrame(time, frame) {
    if (hitTestSource) {
      let hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        let hit = hitTestResults[0];
        let pose = hit.getPose(xrRefSpace);

        // Place object at hit position
        object.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        );
      }
    }
  }
});
```

## Hand Tracking

```javascript
// Request session with hand tracking
navigator.xr.requestSession('immersive-vr', {
  optionalFeatures: ['hand-tracking']
}).then(onSessionStarted);

function onXRFrame(time, frame) {
  for (let inputSource of session.inputSources) {
    if (inputSource.hand) {
      // Get hand joints
      let indexTip = inputSource.hand.get('index-finger-tip');
      let jointPose = frame.getJointPose(indexTip, xrRefSpace);

      if (jointPose) {
        // Use joint position
        console.log(jointPose.transform.position);
      }
    }
  }
}
```

## Best Practices

### 1. Always Check Compatibility

```javascript
if (!navigator.xr) {
  showError('WebXR not supported');
  return;
}

navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
  if (!supported) {
    showError('AR not supported on this device');
    return;
  }
});
```

### 2. Use Optional Features Wisely

```javascript
// Don't use requiredFeatures unless absolutely necessary
navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: [], // Empty or minimal
  optionalFeatures: ['hit-test', 'dom-overlay', 'hand-tracking']
});
```

### 3. Handle Session End Properly

```javascript
session.addEventListener('end', () => {
  // Clean up resources
  gl.deleteProgram(program);
  gl.deleteBuffer(buffer);
  xrRefSpace = null;
});
```

### 4. Proper Reference Space for AR

```javascript
// AR sessions should use 'local' reference space
// VR room-scale should use 'local-floor' or 'bounded-floor'
let refSpaceType = session.mode === 'immersive-ar' ? 'local' : 'local-floor';
session.requestReferenceSpace(refSpaceType).then(onRefSpaceReady);
```

### 5. Handle Visibility Changes

```javascript
session.addEventListener('visibilitychange', (e) => {
  if (e.session.visibilityState === 'visible-blurred') {
    // Pause intensive operations
    pausePhysics();
  } else if (e.session.visibilityState === 'visible') {
    // Resume operations
    resumePhysics();
  }
});
```

## Common Issues & Solutions

### Issue: "Session not supported" on ARCore devices

**Solution**: Use empty `requiredFeatures` and put everything in `optionalFeatures`

```javascript
navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: [], // Don't require anything
  optionalFeatures: ['hit-test', 'dom-overlay']
});
```

### Issue: Hit test not working

**Solution**: Use correct reference space for hit test source

```javascript
// Use 'viewer' space for hit test source
let viewerSpace = await session.requestReferenceSpace('viewer');
let hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

// Get results using session reference space
let results = frame.getHitTestResults(hitTestSource);
let pose = results[0].getPose(xrRefSpace);
```

### Issue: Black screen in AR

**Solution**: Don't render opaque background in AR mode

```javascript
if (session.mode === 'immersive-ar') {
  // Don't clear to opaque color
  gl.clearColor(0, 0, 0, 0);
  // Don't render skybox
  skybox.visible = false;
}
```

## Device Compatibility

### Samsung ARCore (Chrome Android)
- ✅ `immersive-ar` session
- ✅ `hit-test` feature
- ✅ `local` reference space
- ❌ `bounded-floor` (not available)
- ⚠️ `hand-tracking` (device dependent)

### Meta Quest 3/3S
- ✅ `immersive-ar` session
- ✅ `immersive-vr` session
- ✅ `hand-tracking`
- ✅ `bounded-floor`
- ✅ `hit-test`

### iOS ARKit (Safari)
- ⚠️ Limited WebXR support
- ✅ AR Quick Look as alternative

## Complete AR Example

```javascript
// 1. Check support
if (!navigator.xr) {
  console.error('WebXR not available');
  return;
}

// 2. Initialize button
let xrButton = document.createElement('button');
xrButton.textContent = 'Start AR';
xrButton.onclick = startAR;
document.body.appendChild(xrButton);

// 3. Start AR function
async function startAR() {
  try {
    let session = await navigator.xr.requestSession('immersive-ar', {
      optionalFeatures: ['hit-test', 'dom-overlay']
    });

    // 4. Setup WebGL
    let canvas = document.createElement('canvas');
    let gl = canvas.getContext('webgl', { xrCompatible: true });
    let glLayer = new XRWebGLLayer(session, gl);

    await session.updateRenderState({ baseLayer: glLayer });

    // 5. Get reference space
    let refSpace = await session.requestReferenceSpace('local');

    // 6. Setup hit test
    let viewerSpace = await session.requestReferenceSpace('viewer');
    let hitTestSource = await session.requestHitTestSource({
      space: viewerSpace
    });

    // 7. Render loop
    function onXRFrame(time, frame) {
      session.requestAnimationFrame(onXRFrame);

      let pose = frame.getViewerPose(refSpace);
      if (!pose) return;

      // Get hit test results
      let hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        let hit = hitTestResults[0];
        let hitPose = hit.getPose(refSpace);
        console.log('Surface detected at:', hitPose.transform.position);
      }

      // Render
      let glLayer = session.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      for (let view of pose.views) {
        let viewport = glLayer.getViewport(view);
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
        // Render your scene here
      }
    }

    session.requestAnimationFrame(onXRFrame);

  } catch (err) {
    console.error('Failed to start AR:', err);
  }
}
```

## Resources

- [MDN WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [WebXR Samples](https://immersive-web.github.io/webxr-samples/)
- [WebXR Spec](https://www.w3.org/TR/webxr/)
- [Immersive Web Community](https://github.com/immersive-web)

## Testing

1. **Chrome Android (ARCore)**: Best for AR testing
2. **Quest Browser**: Best for VR testing
3. **WebXR Emulator**: For desktop development
4. **Real devices**: Always test on actual hardware before release
