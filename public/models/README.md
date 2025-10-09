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

## Example Structure

```
/public/models/
  ├── shark.glb          ✅ Will show in gallery with 3D badge
  ├── angelfish.glb      ✅ Will show in gallery with 3D badge
  ├── dolphin.glb        ✅ Will show in gallery with 3D badge
  └── README.md          (this file)
```

Any creature without a model file will display the default emoji icon with a 📦 placeholder indicator.
