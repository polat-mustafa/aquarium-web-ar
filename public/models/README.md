# 3D Models Folder

This folder contains 3D models for AR creatures in the Aquarium app.

## How to Add 3D Models

1. **File Format**: Upload your 3D models in `.glb` or `.gltf` format
2. **Naming Convention**: Name your file matching the creature ID from the gallery
   - Example: `shark.glb`, `angelfish.glb`, `dolphin.glb`
3. **File Location**: Place files directly in `/public/models/` folder

## Supported Creature IDs

The following creature IDs are available in the gallery:

### Fish
- `shark` - Great White Shark
- `angelfish` - Angelfish
- `tuna` - Bluefin Tuna

### Marine Mammals
- `whale` - Humpback Whale
- `dolphin` - Bottlenose Dolphin
- `seal` - Harbor Seal

### Shellfish
- `crab` - Red Crab
- `lobster` - European Lobster
- `shrimp` - Giant Shrimp

### Mollusks
- `octopus` - Giant Pacific Octopus
- `squid` - Giant Squid

### Jellyfish
- `jellyfish` - Moon Jellyfish
- `medusa` - Blue Blubber

### Sea Reptiles
- `turtle` - Green Sea Turtle
- `sea-snake` - Sea Snake

### Baltic Species
- `herring` - Baltic Herring
- `cod` - Baltic Cod
- `flounder` - European Flounder
- `baltic-seal` - Baltic Grey Seal

## Automatic Integration

Once you upload a 3D model:
1. The gallery will automatically detect it
2. A green "3D" badge will appear on the creature card
3. Clicking the creature will load your 3D model in AR
4. If no model exists, a 📦 placeholder icon will be shown

## Model Requirements

- **Format**: GLB (recommended) or GLTF
- **Size**: Keep under 5MB for optimal mobile performance
- **Optimization**: Use compressed textures and simplified geometry
- **Scale**: Models will be auto-scaled to fit AR viewport
- **Orientation**: Y-up is recommended

## ⚠️ IMPORTANT: GLTF vs GLB

**Always prefer GLB format!**

- **GLB** = Single binary file (✅ Recommended)
  - Contains everything: geometry, textures, materials
  - Just works - drag and drop

- **GLTF** = Multiple files (⚠️ Requires .bin file)
  - Needs: `.gltf` (JSON) + `.bin` (binary data) + texture files
  - If `.bin` file is missing, the model **will not load**
  - You'll see "3D Preview Unavailable" error

### Current Issue: Koi Fish Model

The current `Koi fish - fish.gltf` file is **broken** because it's missing `scene.bin`.

**How to fix:**
1. Download a complete Koi fish model in GLB format from:
   - [Animated Koi Fish (Sketchfab)](https://sketchfab.com/3d-models/animated-low-poly-koi-fish-65fc24a235f64bf3b4951c0111d0e4d4)
   - Or search Sketchfab for "koi fish" and filter by "Downloadable"

2. Save as: `public/models/Koi fish - fish.glb`

3. Delete the old GLTF file:
   ```bash
   rm "public/models/Koi fish - fish.gltf"
   ```

4. Update `src/utils/modelMatcher.ts`:
   - Change `fileName: 'Koi fish - fish.gltf'` to `'Koi fish - fish.glb'`
   - Change `approved: false` to `approved: true`

5. Refresh the dashboard - Koi fish will now work!

## Example Structure

```
/public/models/
  ├── shark.glb          ✅ Will show in gallery with 3D badge
  ├── angelfish.glb      ✅ Will show in gallery with 3D badge
  ├── dolphin.glb        ✅ Will show in gallery with 3D badge
  └── README.md          (this file)
```

Any creature without a model file will display the default emoji icon with a 📦 placeholder indicator.
