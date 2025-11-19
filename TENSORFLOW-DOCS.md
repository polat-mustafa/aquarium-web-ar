# TensorFlow.js API Documentation

## Overview
TensorFlow.js enables machine learning in the browser with WebGL acceleration. This document covers the key APIs used in the Aquarium AR project.

---

## Body Segmentation API

### Installation
```bash
yarn add @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl
yarn add @tensorflow-models/body-segmentation
yarn add @mediapipe/selfie_segmentation  # For MediaPipe runtime
```

### Models Available
1. **MediaPipe Selfie Segmentation** - Best for closeup (<2m), video calls
2. **BlazePose GHUM** - Best for full body (up to 4m), fitness, yoga

### Basic Usage
```javascript
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

// Create segmenter
const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
const segmenterConfig = {
  runtime: 'mediapipe', // or 'tfjs'
  modelType: 'general' // or 'landscape'
};
const segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);

// Segment people
const video = document.getElementById('video');
const people = await segmenter.segmentPeople(video);
```

### Output Format
```javascript
[
  {
    maskValueToLabel: (maskValue) => 'person',
    mask: {
      toCanvasImageSource(): Promise<ImageBitmap>
      toImageData(): Promise<ImageData>
      toTensor(): tf.Tensor2D
      getUnderlyingType(): 'canvasimagesource' | 'imagedata' | 'tensor'
    }
  }
]
```

### Performance (FPS)
**Selfie Segmentation:**
| Device | MediaPipe | TF.js |
|--------|-----------|-------|
| MacBook Pro 2019 | 125/130 | 74/45 |
| iPhone 11 | 31/21 | 42/30 |
| Pixel 6 Pro | 35/33 | 25/23 |

---

## Hand Pose Detection API

### Installation
```bash
yarn add @tensorflow-models/hand-pose-detection
yarn add @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl
yarn add @mediapipe/hands  # For MediaPipe runtime
```

### Basic Usage
```javascript
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

// Create detector
const model = handPoseDetection.SupportedModels.MediaPipeHands;
const detectorConfig = {
  runtime: 'mediapipe',
  modelType: 'full', // or 'lite'
  maxNumHands: 2
};
const detector = await handPoseDetection.createDetector(model, detectorConfig);

// Detect hands
const hands = await detector.estimateHands(video);
```

### Output Format with 3D Coordinates
```javascript
[
  {
    score: 0.8,
    handedness: 'Right',
    keypoints: [
      {x: 105, y: 107, name: "wrist"},
      {x: 108, y: 160, name: "pinky_finger_tip"},
      // ... 21 keypoints total
    ],
    keypoints3D: [
      {x: 0.00388, y: -0.0205, z: 0.0217, name: "wrist"},
      {x: -0.025138, y: -0.0255, z: -0.0051, name: "pinky_finger_tip"},
      // ... 21 keypoints in metric scale (meters)
    ]
  }
]
```

### 3D Keypoints
- Origin: Average of first knuckles (index, middle, ring, pinky)
- Units: Meters (metric scale)
- Coordinates: {x, y, z} in real-world space

### Performance (FPS)
**HandPose GHUM (2 hands):**
| Device | MediaPipe | TF.js |
|--------|-----------|-------|
| MacBook Pro 2019 | 62/48 | 36/31 |
| iPhone 11 | 8/5 | 15/12 |
| Desktop GTX 1070 | 136/120 | 42/35 |

---

## Pose Detection API (with Depth)

### BlazePose GHUM Features
- 2D keypoints (33 landmarks)
- 3D keypoints (metric scale)
- Body segmentation mask
- Works up to 4 meters from camera

### Usage
```javascript
import * as poseDetection from '@tensorflow-models/pose-detection';

const model = poseDetection.SupportedModels.BlazePose;
const detectorConfig = {
  runtime: 'mediapipe',
  enableSegmentation: true,
  smoothSegmentation: true,
  modelType: 'full' // 'lite', 'full', or 'heavy'
};
const detector = await poseDetection.createDetector(model, detectorConfig);

const poses = await detector.estimatePoses(video);
const segmentation = poses[0]?.segmentation;
```

---

## Environment Variables

### Tensor Core Math (GPU Optimization)
```bash
# Enable Tensor Core for FP32 (default: disabled)
export TF_ENABLE_CUBLAS_TENSOR_OP_MATH_FP32=1
export TF_ENABLE_CUDNN_TENSOR_OP_MATH_FP32=1

# Disable Tensor Core for FP16 (default: enabled)
export TF_DISABLE_CUDNN_TENSOR_OP_MATH=1
export TF_DISABLE_CUBLAS_TENSOR_OP_MATH=1
```

### Performance Tuning
```bash
# Autotune threshold (stability vs speed)
export TF_AUTOTUNE_THRESHOLD=2  # Default: 1

# CUDA device connections
export CUDA_DEVICE_MAX_CONNECTIONS=12  # Default: 8

# Enable XLA (Accelerated Linear Algebra)
export TF_ENABLE_XLA=1
```

---

## Depth Estimation Techniques

### 1. Using 3D Keypoints
```javascript
// Get 3D hand position
const hands = await detector.estimateHands(video);
const hand3D = hands[0].keypoints3D;

// Calculate distance from origin
const wrist = hand3D.find(kp => kp.name === 'wrist');
const distance = Math.sqrt(wrist.x**2 + wrist.y**2 + wrist.z**2);
console.log(`Hand distance: ${distance.toFixed(2)}m`);
```

### 2. Using Segmentation Depth
```javascript
// Estimate depth from segmentation size
const mask = await people[0].mask.toImageData();
const pixels = mask.data;
let segmentedPixels = 0;

for (let i = 3; i < pixels.length; i += 4) {
  if (pixels[i] > 128) segmentedPixels++;
}

// Larger segmentation = closer to camera
const depth = 1 / Math.sqrt(segmentedPixels);
```

### 3. Using Multiple Keypoint Distances
```javascript
// Calculate average depth from multiple keypoints
const keypoints = hands[0].keypoints3D;
const depths = keypoints.map(kp =>
  Math.sqrt(kp.x**2 + kp.y**2 + kp.z**2)
);
const avgDepth = depths.reduce((a, b) => a + b) / depths.length;
```

---

## Automatic Mixed Precision (AMP)

### Enable AMP for Performance
```javascript
// Wrap optimizer with mixed precision
const opt = tf.train.adam();
const mixedPrecisionOpt = tf.train.experimental.enable_mixed_precision_graph_rewrite(opt);

// Or use environment variable
process.env.TF_ENABLE_AUTO_MIXED_PRECISION = '1';
```

### Benefits
- 2-3x faster training/inference on Tensor Core GPUs
- Reduced memory usage
- Automatic loss scaling

---

## XLA (Accelerated Linear Algebra)

### Enable XLA Compilation
```javascript
// Environment variable (recommended)
process.env.TF_XLA_FLAGS = '--tf_xla_auto_jit=1';

// Or at function level
const model = tf.function(fn, {enableXla: true});
```

### XLA Performance Tips
```bash
# Enable XLA with fusible ops only (faster compilation)
export TF_XLA_FLAGS='--tf_xla_auto_jit=fusible'

# Async compilation (non-blocking)
export TF_XLA_FLAGS='--tf_xla_async_compilation=true'

# Persistent cache (reuse compiled code)
export TF_XLA_FLAGS='--xla_gpu_persistent_cache_dir=/path/to/cache'
```

---

## Best Practices

### 1. Memory Management
```javascript
// Wrap in tidy() to auto-dispose tensors
const result = tf.tidy(() => {
  const tensor1 = tf.tensor([1, 2, 3]);
  const tensor2 = tensor1.square();
  return tensor2.dataSync();
});

// Manual disposal
const tensor = tf.tensor([1, 2, 3]);
tensor.dispose();
```

### 2. Batch Processing
```javascript
// Process multiple frames in batch for efficiency
const frames = [frame1, frame2, frame3];
const batched = tf.stack(frames);
const results = await model.predict(batched);
```

### 3. WebGL Backend Optimization
```javascript
// Set WebGL backend flags
import '@tensorflow/tfjs-backend-webgl';
tf.env().set('WEBGL_PACK', true);
tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
```

---

## Troubleshooting

### Out of Memory
```javascript
// Reduce model complexity
const config = {
  modelType: 'lite', // Instead of 'full'
  maxNumHands: 1     // Instead of 2
};

// Or dispose unused tensors
tf.engine().startScope();
// ... your code ...
tf.engine().endScope();
```

### Slow Inference
```javascript
// Use MediaPipe runtime (faster on most devices)
const config = {
  runtime: 'mediapipe', // Instead of 'tfjs'
  modelType: 'lite'     // Instead of 'full'
};
```

### WebGL Context Lost
```javascript
// Listen for context loss
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  console.warn('WebGL context lost, reinitializing...');
  await reinitializeModels();
});
```

---

## Model Quality Metrics

### Hand Pose (ASL Dataset)
| Model | 2D mAP | 3D Error (cm) |
|-------|--------|---------------|
| Lite | 79.2% | 1.4 |
| Full | 83.8% | 1.3 |

### Body Segmentation (IOU)
| Model | Conference | Yoga | HIIT |
|-------|-----------|------|------|
| BlazePose | 95.50% | 94.73% | 95.16% |
| Selfie (256) | 97.60% | 80.66% | 85.53% |

---

## References

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [Body Segmentation Blog](https://blog.tensorflow.org/2022/01/body-segmentation.html)
- [3D Hand Pose Blog](https://blog.tensorflow.org/2021/11/3d-hand-pose.html)
- [MediaPipe Solutions](https://google.github.io/mediapipe/)
- [NVIDIA TensorFlow Guide](https://docs.nvidia.com/deeplearning/frameworks/tensorflow-user-guide/)

---

## Quick Reference Card

```javascript
// INITIALIZATION
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';

// BODY SEGMENTATION
const segmenter = await bodySegmentation.createSegmenter(
  bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
  {runtime: 'mediapipe', modelType: 'general'}
);
const people = await segmenter.segmentPeople(video);

// HAND DETECTION WITH 3D
const detector = await handPoseDetection.createDetector(
  handPoseDetection.SupportedModels.MediaPipeHands,
  {runtime: 'mediapipe', modelType: 'full', maxNumHands: 2}
);
const hands = await detector.estimateHands(video);

// GET 3D DEPTH
const wrist3D = hands[0].keypoints3D.find(kp => kp.name === 'wrist');
const depth = Math.sqrt(wrist3D.x**2 + wrist3D.y**2 + wrist3D.z**2);
console.log(`Depth: ${depth.toFixed(2)}m`);
```

---

**Created:** 2025-01-19
**Last Updated:** 2025-01-19
**Version:** 1.0
