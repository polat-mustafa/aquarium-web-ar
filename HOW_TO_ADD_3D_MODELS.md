# 🐠 How to Add 3D Models to Gallery

## Quick Guide

### Step 1: Name Your Model File

Use this format: `{creature-name}-{category}.glb`

**Examples:**
- ✅ `clown fish-fish.glb` → "Clown Fish" in Fish category
- ✅ `blue whale-mammals.glb` → "Blue Whale" in Mammals category
- ✅ `red crab-shellfish.glb` → "Red Crab" in Shellfish category

**Valid Categories:**
- `fish` - Fish
- `mammals` - Marine Mammals
- `shellfish` - Shellfish
- `mollusks` - Mollusks
- `jellyfish` - Jellyfish
- `reptiles` - Sea Reptiles
- `baltic` - Baltic Species
- `custom` - Custom Creatures

### Step 2: Add Model to Folder

Place your `.glb` or `.gltf` file in:
```
/public/models/{creature-name}-{category}.glb
```

**Example:**
```bash
# Your files are already here:
/public/models/clown fish-fish.glb
/public/models/Zebrasoma Xanthurum-fish.glb
```

### Step 3: Register the Model

Open `/src/utils/modelScanner.ts` and add your filename to the array:

```typescript
export const KNOWN_MODEL_FILES = [
  'clown fish-fish.glb',
  'Zebrasoma Xanthurum-fish.glb',
  // Add your new models here 👇
  'blue whale-mammals.glb',
  'red crab-shellfish.glb',
];
```

### Step 4: Refresh Browser

The model will automatically appear in the correct category in the gallery! 🎉

---

## What Happens Automatically

✨ **Creature Name**: Formatted from filename ("clown fish" → "Clown Fish")
✨ **Category**: Assigned from filename suffix ("fish" → Fish gallery)
✨ **Icon**: Uses category emoji as placeholder (🐟 for fish)
✨ **Hashtags**: Auto-generated (#ClownFish #3DModel #Aquarium)
✨ **3D Badge**: Green "3D" badge shown on creature card

---

## Current Models

You've already added:

1. **Clown Fish** (`clown fish-fish.glb`)
   - Category: Fish 🐟
   - Size: 8.4 MB

2. **Zebrasoma Xanthurum** (`Zebrasoma Xanthurum-fish.glb`)
   - Category: Fish 🐟
   - Size: 607 KB

---

## Naming Tips

✅ **Good Names:**
- `clown fish-fish.glb`
- `Blue Whale-mammals.glb`
- `octopus vulgaris-mollusks.glb`

❌ **Bad Names:**
- `clownfish.glb` (missing category)
- `fish-clown.glb` (category in wrong place)
- `clown-fish-ocean.glb` (invalid category "ocean")

---

## Troubleshooting

**Model not showing?**
1. Check filename format: `{name}-{category}.glb`
2. Verify category is valid (see list above)
3. Make sure it's added to `KNOWN_MODEL_FILES` array
4. Refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
5. Check browser console for errors

**Check browser console:**
```
✅ Loaded model: Clown Fish (fish)
✅ Loaded model: Zebrasoma Xanthurum (fish)
✅ Loaded 2 model creatures from /public/models/
```
