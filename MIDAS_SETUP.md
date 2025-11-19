# MiDaS Depth Estimation Setup (Optional Feature)

This project includes support for MiDaS TFLite depth estimation, but it requires manual setup due to compatibility issues with the alpha TFLite library.

## ⚠️ Important Note

TFLite is currently in alpha (v0.0.1-alpha.10) and has build compatibility issues with Next.js. This is an **optional feature** that requires manual installation.

## What is MiDaS?

MiDaS (Mixed Data Sampling) is a neural network for monocular depth estimation. It predicts depth maps from single images, providing real-world depth information without specialized hardware.

## Setup Instructions

### 1. Install TFLite Library

```bash
npm install @tensorflow/tfjs-tflite@0.0.1-alpha.10 --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**
The TFLite alpha version requires TensorFlow.js 4.9.0, but this project uses 4.22.0. Using `--legacy-peer-deps` allows the installation despite version mismatch.

### 2. Download the MiDaS TFLite Model

You need to place the `midas.tflite` model file in the `/public/models/` directory.

**Options to get the model:**

#### Option A: Convert from ONNX/PyTorch (Recommended)
1. Download MiDaS from: https://github.com/isl-org/MiDaS
2. Convert to TFLite using TensorFlow Model Optimization toolkit
3. Place the resulting `midas.tflite` in `/public/models/`

#### Option B: Use Pre-converted Model
1. Find a pre-converted MiDaS TFLite model online
2. Ensure it's compatible with input size 256x256
3. Rename to `midas.tflite`
4. Place in `/public/models/`

### 3. Model Requirements

- **Input Size**: 256x256 pixels
- **Format**: TFLite
- **Location**: `/public/models/midas.tflite`

### 4. File Structure

```
aquarium/
├── public/
│   └── models/
│       ├── midas.tflite          # ← Place model here
│       ├── shark.glb
│       └── [other 3D models...]
└── src/
    └── utils/
        └── depthSensing.ts       # MiDaS implementation
```

## How to Use

### In Test Page

1. Go to `/ar/test-newscene?creature=tuna`
2. Click the depth sensing mode selector
3. Choose **"MiDaS"** mode
4. The system will:
   - Load the TFLite model from `/public/models/midas.tflite`
   - Process camera frames at ~2 FPS (MiDaS is computationally expensive)
   - Generate depth maps showing distance to objects
   - Detect obstacles within 2 meters
   - Make fish react to real-world objects

### Features

- **Real Depth Maps**: Full 256x256 depth estimation
- **Obstacle Detection**: Detects objects within 2 meters
- **Grid-based Analysis**: Divides scene into 8x8 grid for obstacle zones
- **Automatic Cleanup**: Properly disposes tensors to prevent memory leaks

## Performance Notes

- **Processing Speed**: ~2 FPS (500ms per frame)
- **Memory Usage**: Higher than hand tracking (model + depth maps)
- **Best For**: Desktop/high-end mobile devices
- **Fallback**: Use MediaPipe or TensorFlow hand tracking on lower-end devices

## API Integration

The MiDaS sensor integrates seamlessly with the existing depth sensing system:

```typescript
import { DepthSensingManager } from '@/utils/depthSensing';

const manager = new DepthSensingManager();

// Initialize MiDaS mode
await manager.setMode(
  'midas',
  videoElement,
  (obstacles) => {
    // Handle detected obstacles
    console.log('Obstacles:', obstacles);
  },
  (depthMap) => {
    // Optional: Access raw depth map
    console.log('Depth map:', depthMap.shape);
  }
);
```

## Troubleshooting

### "MiDaS initialization failed"
- Ensure `midas.tflite` exists in `/public/models/`
- Check browser console for specific error
- Verify WebGL is enabled in browser

### "Model not loading"
- Check file path is exactly `/public/models/midas.tflite`
- Verify file is valid TFLite format
- Try clearing browser cache

### Performance Issues
- MiDaS is computationally expensive
- Try MediaPipe or TensorFlow modes on slower devices
- Ensure GPU acceleration is available

## Comparison with Other Modes

| Mode | Detects | Depth Quality | Speed | Device Support |
|------|---------|---------------|-------|----------------|
| **MiDaS** | All objects | ⭐⭐⭐⭐⭐ Full depth map | ~2 FPS | High-end |
| **MediaPipe** | Hands | ⭐⭐⭐⭐ Metric 3D | ~30 FPS | All devices |
| **TensorFlow** | Hands | ⭐⭐⭐⭐ Metric 3D | ~15 FPS | Most devices |
| **WebXR** | Surfaces | ⭐⭐⭐⭐⭐ Real depth | ~60 FPS | AR headsets |

## Learn More

- [MiDaS GitHub](https://github.com/isl-org/MiDaS)
- [TensorFlow Lite](https://www.tensorflow.org/lite)
- [Depth Estimation Guide](./DEPTH_SENSING_GUIDE.md)
