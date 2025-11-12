# 3D Models Integration Guide

## Overview

The Aquarium WebAR project features a flexible 3D model system that allows you to add interactive marine life models to your AR experience. This guide covers everything from adding your first model to managing an entire gallery of creatures.

## System Architecture

### Model Registry System

The application uses a centralized registry (`src/utils/modelMatcher.ts`) that maps 3D model files to gallery creatures. The system supports two primary workflows:

1. **Attaching Models to Existing Creatures** - Add 3D models to pre-defined creatures in the gallery
2. **Creating New Creatures from Models** - Generate entirely new gallery entries from your model files

### Key Components

| Component | Purpose |
|-----------|---------|
| `MODEL_REGISTRY` | Central configuration for all 3D models |
| `modelMatcher.ts` | Model registration and validation logic |
| `CreatureModel.tsx` | 3D rendering and animation controller |
| `galleryData.ts` | Base creature definitions |

## Adding 3D Models

### Step 1: Prepare Your Model File

**Supported Formats:**
- **GLB** (recommended) - Binary format with embedded textures
- **GLTF** - JSON format requiring external `.bin` and texture files

**Requirements:**
- File size: Under 10MB recommended
- Polygon count: Under 100K triangles for optimal performance
- Textures: Embedded or included in same directory
- Animations (optional): Named following convention `{type}_swim`, `{type}_spawn`, `{type}_special`

**Model Optimization:**
```bash
# Recommended specs
Vertices: < 50,000
Triangles: < 100,000
Textures: 2048x2048 max resolution
Format: GLB with embedded textures
```

### Step 2: Add Model File to Project

Place your model file in the `/public/models/` directory:

```
/public/models/
├── tuna fish-fish.glb
├── Zebrasoma Xanthurum-fish.glb
├── Koi fish-fish.glb
└── your-new-model.glb
```

### Step 3: Register the Model

Open `src/utils/modelMatcher.ts` and add an entry to the `MODEL_REGISTRY` array:

#### Option A: Attach to Existing Creature

Use this when you want to add a 3D model to a creature that already exists in the gallery (shark, dolphin, turtle, etc.):

```typescript
{
  fileName: 'shark-animated.glb',
  creatureId: 'shark',          // Links to existing creature
  category: 'fish',
  modelPath: '/models/shark-animated.glb',
  approved: true                 // Set to false to require approval
}
```

#### Option B: Create New Creature

Use this when introducing a completely new species not in the default gallery:

```typescript
{
  fileName: 'blue-whale.glb',
  creatureName: 'Blue Whale',    // Creates new gallery entry
  category: 'mammals',
  modelPath: '/models/blue-whale.glb',
  approved: true
}
```

### Step 4: Test Your Model

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Test Model Loading:**
   ```
   http://localhost:3000/ar?creature=model-blue-whale
   ```

3. **Verify in Gallery:**
   ```
   http://localhost:3000/gallery
   ```
   Navigate to the appropriate category and look for the green "3D" badge.

4. **Test AR Experience:**
   Click the creature card to launch the AR view.

## Model Registry Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `fileName` | string | Exact filename in `/public/models/` |
| `category` | string | Gallery category: `fish`, `mammals`, `shellfish`, `mollusks`, `jellyfish`, `reptiles`, `baltic`, `custom` |
| `modelPath` | string | Full path from public directory (e.g., `/models/file.glb`) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `creatureId` | string | ID of existing creature to attach model to |
| `creatureName` | string | Name for new creature (creates new gallery entry) |
| `approved` | boolean | If `false`, model requires approval in dashboard before appearing in gallery |

### Validation Rules

- **Either** `creatureId` **or** `creatureName` must be provided (not both)
- `creatureId` must match an existing creature's ID in `galleryData.ts`
- `creatureName` will automatically generate a URL-safe ID
- `modelPath` must point to an accessible file in `/public/models/`

## Gallery Integration

### How Models Appear in Gallery

**With 3D Model:**
```
┌─────────────────────┐
│   [Model Preview]   │
│                     │
│   Clown Fish        │
│   #ClownFish #3D    │
│   [3D Badge]        │ ← Green badge indicates 3D model available
└─────────────────────┘
```

**Without 3D Model:**
```
┌─────────────────────┐
│   [Emoji/Icon]      │
│                     │
│   Angelfish         │
│   #Angelfish #Fish  │
│                     │ ← No badge, will show placeholder in AR
└─────────────────────┘
```

### Gallery Loading Flow

```
1. Load base creatures from galleryData.ts
   ↓
2. Attach approved models to existing creatures
   ↓
3. Create new creatures from approved models
   ↓
4. Apply icon resolution (custom → default → emoji)
   ↓
5. Display in categorized gallery
```

## AR Rendering Behavior

### Model Loading

When a user selects a creature with a 3D model:

1. AR camera initializes
2. `CreatureModel` component loads GLB file via Three.js `GLTFLoader`
3. Model is scaled and positioned based on configuration
4. Animations are discovered and played (if available)
5. Real-time interaction enabled (rotation, collision detection)

### Fallback for Missing Models

If `modelPath` is undefined or the file fails to load:

1. `IconFallback` component renders instead
2. Displays a colored sphere representing the creature type
3. Applies procedural floating animation
4. User experience continues without 3D model

### Animation System

The renderer checks for these animation names in the GLB file:

```typescript
// Animation naming convention
{type}_swim    // Idle/swimming animation
{type}_spawn   // Entrance animation
{type}_special // Special action (tap/interaction)
```

If animations aren't found, the system falls back to procedural motion.

## Model Approval Workflow

### Approval System Purpose

The approval system allows you to review 3D models before they become visible to users. This is useful for:

- Quality control for user-submitted models
- Testing models before public release
- Gradual rollout of new content

### Setting Approval Status

**Immediate Approval (Static):**
```typescript
{
  fileName: 'trusted-model.glb',
  creatureName: 'Trusted Fish',
  category: 'fish',
  modelPath: '/models/trusted-model.glb',
  approved: true  // Appears in gallery immediately
}
```

**Require Dashboard Approval:**
```typescript
{
  fileName: 'review-model.glb',
  creatureName: 'New Fish',
  category: 'fish',
  modelPath: '/models/review-model.glb',
  approved: false  // Must be approved in dashboard first
}
```

### Dashboard Approval Process

1. Navigate to `/dashboard` and authenticate
2. Click "Pending Approvals" tab
3. Review 3D preview, statistics, and quality checks
4. Test in AR view
5. Select final category
6. Click "Approve & Add to Gallery"
7. Approval saved to `localStorage` (`model_approvals` key)
8. Model immediately appears in gallery

For detailed approval workflow, see `MODEL_MANAGEMENT_GUIDE.md`.

## Examples

### Example 1: Adding Model to Existing Shark

```typescript
// In MODEL_REGISTRY
{
  fileName: 'great-white-3d.glb',
  creatureId: 'shark',
  category: 'fish',
  modelPath: '/models/great-white-3d.glb',
  approved: true
}
```

**Result:**
- Existing "Shark" entry in gallery gets 3D badge
- Clicking shark loads your 3D model in AR
- All existing metadata (name, hashtags, facts) preserved

### Example 2: Creating New Manta Ray

```typescript
// In MODEL_REGISTRY
{
  fileName: 'manta-ray.glb',
  creatureName: 'Manta Ray',
  category: 'fish',
  modelPath: '/models/manta-ray.glb',
  approved: true
}
```

**Result:**
- New "Manta Ray" entry created in Fish category
- Automatically gets ID: `model-manta-ray`
- Appears with 3D badge and generated hashtags
- Ready to view in AR

### Example 3: Pending Approval for User Upload

```typescript
// In MODEL_REGISTRY
{
  fileName: 'community-octopus.glb',
  creatureName: 'Giant Pacific Octopus',
  category: 'mollusks',
  modelPath: '/models/community-octopus.glb',
  approved: false  // Requires review
}
```

**Result:**
- Model appears in Dashboard → Pending Approvals
- NOT visible in public gallery until approved
- Admin can test, adjust category, then approve
- After approval, appears in Mollusks category

## Troubleshooting

### Model Not Appearing in Gallery

**Checklist:**
- [ ] File exists in `/public/models/` directory
- [ ] Filename in `MODEL_REGISTRY` matches exactly (case-sensitive)
- [ ] `approved` is set to `true` or model has been approved in dashboard
- [ ] Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Check browser console for errors

### Model Not Loading in AR

**Common Issues:**

1. **File Not Found (404)**
   - Verify `modelPath` is correct
   - Check for typos in filename
   - Ensure file is in `/public/models/` not `/src/`

2. **GLTF Missing Dependencies**
   - GLTF files need `.bin` file in same directory
   - Textures must be present or embedded
   - **Solution:** Convert to GLB format (everything embedded)

3. **Model Appears Black/White**
   - Textures are missing or not embedded
   - **Solution:** Re-export with "embedded textures" option

4. **Poor Performance/Lag**
   - Model has too many polygons (>100K triangles)
   - **Solution:** Optimize model in 3D software (decimate modifier)

### Conversion: GLTF to GLB

**Using Online Tool:**
1. Visit https://gltf.pmnd.rs/
2. Upload your GLTF file
3. Export as GLB
4. Download and replace original file

**Using Blender:**
1. File → Import → glTF 2.0
2. File → Export → glTF 2.0
3. Select "glTF Binary (.glb)" format
4. Check "Remember Export Settings"
5. Export

## Best Practices

### File Organization

```
/public/models/
├── fish/
│   ├── tuna-fish.glb
│   ├── clown-fish.glb
│   └── angelfish.glb
├── mammals/
│   ├── dolphin.glb
│   └── whale.glb
└── mollusks/
    └── octopus.glb
```

### Naming Conventions

- Use descriptive, lowercase names
- Separate words with hyphens: `blue-whale.glb`
- Include category suffix if helpful: `tuna-fish.glb`
- Avoid special characters except hyphens and underscores

### Model Optimization Workflow

1. **Model Creation** - Design in 3D software
2. **Optimization** - Reduce polygons, optimize textures
3. **Export** - GLB format with embedded textures
4. **Validation** - Load in viewer, check size
5. **Integration** - Add to registry, test in AR
6. **Performance Test** - Verify smooth rendering on mobile

### Category Guidelines

| Category | Examples | Emoji |
|----------|----------|-------|
| `fish` | Tuna, Clownfish, Shark | 🐟 |
| `mammals` | Dolphin, Whale, Seal | 🐋 |
| `shellfish` | Crab, Lobster, Shrimp | 🦀 |
| `mollusks` | Octopus, Squid | 🐙 |
| `jellyfish` | Moon Jelly, Box Jelly | 🪼 |
| `reptiles` | Sea Turtle, Sea Snake | 🐢 |
| `baltic` | Baltic-specific species | 🌊 |
| `custom` | Special/fantasy creatures | ⭐ |

## Advanced Topics

### Dynamic Model Loading

Models are loaded asynchronously and validated before display:

```typescript
// From modelMatcher.ts
async function checkModelExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
```

### Custom Animation Mapping

To use custom animation names, modify `CreatureModel.tsx`:

```typescript
// Find animations in loaded GLB
const animationClips = gltf.animations;
const customSwim = animationClips.find(clip =>
  clip.name === 'YourCustomSwimAnimation'
);
```

### Scale Normalization

The system automatically normalizes model sizes for consistent display:

```typescript
// Models are scaled to fit within a standard bounding box
// User-configurable per-model in dashboard
const normalizedScale = calculateScaleNormalization(model);
```

## Summary

The 3D model system provides a powerful, flexible way to enhance your AR aquarium experience:

✅ **Simple Integration** - Add models by updating one registry file
✅ **Dual Workflow** - Attach to existing creatures or create new ones
✅ **Quality Control** - Optional approval workflow
✅ **Automatic Optimization** - Scale normalization and error handling
✅ **Format Flexibility** - Supports GLB and GLTF formats
✅ **Performance Monitoring** - Built-in validation and logging

For more information on specific workflows:
- **Model Approval & Testing:** See `MODEL_MANAGEMENT_GUIDE.md`
- **Depth Sensing & Interactions:** See `DEPTH_SENSING_GUIDE.md`
- **Icon Configuration:** See `ICON_SETUP_GUIDE.md`

---

**Last Updated:** January 2025
**Current Version:** 1.2.0
