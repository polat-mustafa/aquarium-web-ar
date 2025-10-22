# 🐠 How to Add 3D Models to Gallery and AR

## Quick Guide - 3 Easy Steps!

### Step 1: Add Your Model File

Place your `.glb` or `.gltf` file in `/public/models/`:
```
/public/models/your-creature-name.glb
```

**Supported Formats:**
- ✅ `.glb` (preferred - single file with everything embedded)
- ✅ `.gltf` (requires external .bin and texture files)

### Step 2: Register in Model Registry

Open `/src/utils/modelMatcher.ts` and add to `MODEL_REGISTRY` array:

```typescript
export const MODEL_REGISTRY: ModelDefinition[] = [
  // Add your new model here:
  {
    fileName: 'Koi fish - fish.gltf',
    creatureName: 'Koi Fish',         // Display name in gallery
    category: 'fish',                  // Which category to show in
    modelPath: '/models/Koi fish - fish.gltf'
  },
];
```

**Valid Categories:**
- `fish` - Fish
- `mammals` - Marine Mammals
- `shellfish` - Shellfish
- `mollusks` - Mollusks
- `jellyfish` - Jellyfish
- `reptiles` - Sea Reptiles
- `baltic` - Baltic Species

### Step 3: View in Dashboard

1. Save the file
2. Refresh your browser at `http://localhost:3000/gallery`
3. Navigate to the category you specified (e.g., "Fish")
4. Your creature will appear with a green **3D** badge!
5. Click it to view in AR! 🎉

---

## What Happens Automatically

✨ **Gallery Card**: Creature appears in the specified category
✨ **3D Badge**: Green "3D" badge shows on the creature card
✨ **Icon**: Uses category emoji as placeholder (🐟 for fish)
✨ **Hashtags**: Auto-generated (#KoiFish #3DModel #Aquarium #WebAR)
✨ **AR Page**: Clicking the creature loads the 3D model in AR view

---

## Your Current Models

### ✅ Active Models (showing in gallery):

1. **Tuna Fish** (`tuna fish-fish.glb`)
   - Category: Fish 🐟
   - Attached to existing "Tuna" creature
   - AR URL: `http://localhost:3000/ar?creature=tuna`

2. **Zebrasoma Xanthurum** (`Zebrasoma Xanthurum-fish.glb`)
   - Category: Fish 🐟
   - Attached to existing "Zebrasoma" creature
   - AR URL: `http://localhost:3000/ar?creature=zebrasoma`

3. **Koi Fish** (`Koi fish - fish.gltf`) ✨ *Just enabled!*
   - Category: Fish 🐟
   - Creates NEW creature in gallery
   - AR URL: `http://localhost:3000/ar?creature=model-koi-fish`

---

## Two Ways to Add Models

### Option 1: Create a NEW Creature (Recommended for new species)

**When to use:** You want to add a completely new sea creature to the gallery

**Example - Adding Koi Fish:**
```typescript
{
  fileName: 'Koi fish - fish.gltf',
  creatureName: 'Koi Fish',      // Creates NEW creature
  category: 'fish',
  modelPath: '/models/Koi fish - fish.gltf'
}
```

**Result:** A new "Koi Fish" card appears in the Fish category with 3D badge

### Option 2: Attach to EXISTING Creature (Use existing gallery entries)

**When to use:** You have a 3D model for creatures already in the gallery (like Shark, Dolphin, etc.)

**Example - Adding 3D model to existing Tuna:**
```typescript
{
  fileName: 'tuna fish-fish.glb',
  creatureId: 'tuna',            // Attaches to existing "tuna"
  category: 'fish',
  modelPath: '/models/tuna fish-fish.glb'
}
```

**Result:** The existing "Tuna" card now shows 3D badge and loads your model

---

## Troubleshooting

### Model not showing in gallery?

1. **Check registration:**
   - Open `/src/utils/modelMatcher.ts`
   - Verify your model is in the `MODEL_REGISTRY` array
   - Make sure it's NOT commented out with `//`

2. **Check file exists:**
   - File must be in `/public/models/` folder
   - Path in `modelPath` must match actual filename exactly

3. **Refresh browser:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear cache if needed

4. **Check browser console** (Press F12):
```
✅ Created model creature: { id: 'model-koi-fish', name: 'Koi Fish', hasModel: true }
✅ Attached model to Tuna: /models/tuna fish-fish.glb
```

### Model showing but not loading in AR?

1. **Check file format:**
   - `.glb` files work best (single file)
   - `.gltf` files need accompanying `.bin` and texture files

2. **Check file size:**
   - Large files (>10MB) may take time to load
   - Optimize models for web use

3. **Check browser console for errors:**
```
❌ Error loading model: /models/Koi fish - fish.gltf
   - Check if .bin file exists
   - Check if textures are included
```

### Common Issues:

**Issue: "Model not found"**
- Solution: Check `modelPath` matches exact filename including spaces and case

**Issue: "GLTF model not loading"**
- Solution: GLTF format requires external files (.bin, textures). Use GLB instead or ensure all files are present.

**Issue: "3D badge not showing"**
- Solution: Model must be registered with either `creatureName` or `creatureId` in MODEL_REGISTRY

---

## Complete Example: Adding a New Model

Let's walk through adding a **Blue Whale** model step by step:

### Step 1: Get Your Model File
- Download or create `blue-whale.glb`
- Place it in: `C:\Users\stary\Desktop\aquarium\public\models\blue-whale.glb`

### Step 2: Register in modelMatcher.ts
Open `C:\Users\stary\Desktop\aquarium\src\utils\modelMatcher.ts`:

```typescript
export const MODEL_REGISTRY: ModelDefinition[] = [
  // ... existing models ...

  // Add your Blue Whale
  {
    fileName: 'blue-whale.glb',
    creatureName: 'Blue Whale',
    category: 'mammals',
    modelPath: '/models/blue-whale.glb'
  },
];
```

### Step 3: Test It!
1. Save the file
2. Go to `http://localhost:3000/gallery`
3. Click on "Marine Mammals" category
4. You'll see "Blue Whale" with a green 3D badge
5. Click it to view in AR!

---

## Quick Reference

### File Locations:
- **Models folder:** `/public/models/`
- **Registry file:** `/src/utils/modelMatcher.ts`
- **Gallery page:** `http://localhost:3000/gallery`

### Categories:
| Category | Gallery Section |
|----------|----------------|
| `fish` | Fish |
| `mammals` | Marine Mammals |
| `shellfish` | Shellfish |
| `mollusks` | Mollusks |
| `jellyfish` | Jellyfish |
| `reptiles` | Sea Reptiles |
| `baltic` | Baltic Species |

### Existing Creatures (for attaching models):
`shark`, `angelfish`, `tuna`, `zebrasoma`, `whale`, `dolphin`, `seal`, `crab`, `lobster`, `shrimp`, `octopus`, `squid`, `jellyfish`, `medusa`, `turtle`, `sea-snake`, `herring`, `cod`, `flounder`, `baltic-seal`

---

## Next Steps

Your **Koi Fish** model is now enabled! 🎉

**To test:**
1. Run `npm run dev` if not already running
2. Open `http://localhost:3000/gallery`
3. Click "Fish" category
4. Find "Koi Fish" with the 3D badge
5. Click to view in AR!

**To add more models:**
1. Add `.glb` file to `/public/models/`
2. Register in `/src/utils/modelMatcher.ts`
3. Refresh browser
4. Done!
