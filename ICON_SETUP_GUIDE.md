# 🎨 Icon Setup Guide - Aquarium WebAR

## Overview

The gallery now supports **smart icon display** with a 3-tier priority system:

1. **Custom Icons** (Highest Priority) - User-uploaded icons per creature
2. **Default Icons** (Medium Priority) - Pre-installed professional icons
3. **Emoji Fallback** (Lowest Priority) - Unicode emojis as last resort

## 📂 File Structure

```
/public/
├── default-icons/          # Default professional icons
│   ├── shark.png
│   ├── dolphin.png
│   ├── whale.png
│   └── ... (18 creatures total)
│
└── creatures/              # Custom creature overrides
    ├── shark/              # Override icons for specific creatures
    │   └── icon/
    │       └── icon.png    # Custom shark icon (overrides default)
    ├── demo-jellyfish/     # Example custom creature
    │   ├── icon/
    │   │   └── icon.png
    │   └── 3d/
    │       └── model.glb
    └── ... (add more creatures)
```

## 🚀 Quick Start

### Step 1: Add Default Icons (Recommended)

Add professional icon images to `/public/default-icons/`:

**Required file names** (must match creature IDs exactly):
- `shark.png`
- `angelfish.png`
- `tuna.png`
- `whale.png`
- `dolphin.png`
- `seal.png`
- `crab.png`
- `lobster.png`
- `shrimp.png`
- `octopus.png`
- `squid.png`
- `jellyfish.png`
- `medusa.png`
- `turtle.png`
- `sea-snake.png`
- `herring.png`
- `cod.png`
- `flounder.png`
- `baltic-seal.png`

**Specifications:**
- **Format**: PNG (with transparency recommended)
- **Size**: 256x256px or 512x512px
- **Background**: Transparent or ocean-themed
- **Style**: Flat, modern, professional

### Step 2: Override with Custom Icons (Optional)

To replace a specific creature's icon, add a custom icon:

```bash
# Create folder structure
mkdir -p /public/creatures/shark/icon

# Add your custom icon (any of these formats)
# /public/creatures/shark/icon/icon.png
# /public/creatures/shark/icon/icon.jpg
# /public/creatures/shark/icon/icon.svg
# /public/creatures/shark/icon/icon.webp
```

**The custom icon will automatically override the default icon!**

### Step 3: Add Custom Creatures

To add a completely new creature:

1. Create a folder in `/public/creatures/`:
```bash
mkdir -p /public/creatures/my-new-fish/icon
mkdir -p /public/creatures/my-new-fish/3d
```

2. Add files:
```
/public/creatures/my-new-fish/
├── icon/
│   └── icon.png       # Required: Icon image
└── 3d/
    └── model.glb      # Optional: 3D model
```

3. Register the creature in `/src/utils/creatureFolderScanner.ts`:
```typescript
export function getKnownCreatureFolders(): string[] {
  return [
    'demo-jellyfish',
    'my-new-fish',  // ← Add your folder name here
  ];
}
```

## 🎯 How It Works

### Priority System

The `CreatureIcon` component automatically checks in this order:

```
1. Check: /creatures/{creature-id}/icon/icon.* (Custom)
   ↓ If not found...

2. Check: /default-icons/{creature-id}.png (Default)
   ↓ If not found...

3. Show: Emoji fallback (🦈, 🐬, etc.)
```

### Visual Indicators

- **Custom icon badge**: Small checkmark ✓ appears on custom icons
- **3D model badge**: Green "3D" badge for creatures with models
- **Loading spinner**: Shows while icons are being resolved

## 📋 Creature ID Reference

| Creature ID | Emoji | File Name |
|------------|-------|-----------|
| shark | 🦈 | shark.png |
| angelfish | 🐠 | angelfish.png |
| tuna | 🐟 | tuna.png |
| whale | 🐋 | whale.png |
| dolphin | 🐬 | dolphin.png |
| seal | 🦭 | seal.png |
| crab | 🦀 | crab.png |
| lobster | 🦞 | lobster.png |
| shrimp | 🦐 | shrimp.png |
| octopus | 🐙 | octopus.png |
| squid | 🦑 | squid.png |
| jellyfish | 🪼 | jellyfish.png |
| medusa | 🎐 | medusa.png |
| turtle | 🐢 | turtle.png |
| sea-snake | 🐍 | sea-snake.png |
| herring | 🐟 | herring.png |
| cod | 🐠 | cod.png |
| flounder | 🐟 | flounder.png |
| baltic-seal | 🦭 | baltic-seal.png |

## 🖼️ Finding Icon Images

### Free Icon Resources

1. **Flaticon** - https://www.flaticon.com/
   - Search: "ocean animals", "sea creatures", "marine life"
   - Format: PNG with transparency
   - License: Free with attribution (or Premium)

2. **Icons8** - https://icons8.com/
   - Search: specific creature names
   - Format: PNG, SVG
   - License: Free with link (or Paid)

3. **Noun Project** - https://thenounproject.com/
   - Search: marine animals
   - Format: SVG, PNG
   - License: Creative Commons (or Pro)

4. **FreePik** - https://www.freepik.com/
   - Search: "flat ocean animals icons"
   - Format: PNG, SVG
   - License: Free with attribution (or Premium)

### AI-Generated Icons

Use AI tools like:
- **DALL-E** / **Midjourney**: "flat icon of [creature], transparent background, minimalist, professional"
- **Stable Diffusion**: Generate custom ocean-themed icons

### Professional Design

Hire a designer on:
- Fiverr
- Upwork
- 99designs

Request: "Set of 19 ocean creature icons, flat design, 256x256px, PNG with transparency"

## 🔧 Troubleshooting

### Icons Not Showing?

**Check the browser console:**
```
HEAD /default-icons/shark.png 404  ← File not found
HEAD /default-icons/shark.png 200  ← File found ✓
```

**Common issues:**
1. **File name mismatch**: Must be exact (e.g., `shark.png`, not `Shark.png`)
2. **Wrong location**: Must be in `/public/default-icons/` or `/public/creatures/{id}/icon/`
3. **File extension**: Check if file is `.png`, `.jpg`, etc.
4. **Cache**: Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### Custom Icon Not Overriding?

**Verify structure:**
```bash
ls -la /public/creatures/shark/icon/
# Should show: icon.png (or .jpg, .svg, .webp)
```

**Check console:**
```
HEAD /creatures/shark/icon/icon.png 200  ← Working ✓
HEAD /creatures/shark/icon/icon.png 404  ← Not found ✗
```

## 📝 Example: Complete Setup

```bash
# 1. Create default icons folder (already exists)
cd /public/default-icons

# 2. Download/create icons and save them:
# shark.png, dolphin.png, whale.png, etc.

# 3. (Optional) Override shark with custom icon
mkdir -p ../creatures/shark/icon
# Add your custom shark icon as ../creatures/shark/icon/icon.png

# 4. Refresh browser - icons should appear!
```

## 🎨 Design Tips

**Professional ocean-themed icons:**
- Use ocean colors (blues, teals, cyan)
- Keep designs simple and recognizable
- Ensure good contrast for visibility
- Use consistent style across all icons
- Add subtle gradients or shadows for depth
- Consider circular/rounded shapes for consistency

**Color palette suggestions:**
- Primary: `#06b6d4` (cyan)
- Secondary: `#3b82f6` (blue)
- Accent: `#0ea5e9` (sky blue)
- Background: Transparent or white

## 📱 Mobile Optimization

Icons are displayed at different sizes:
- **Gallery grid**: 64x64px (medium)
- **Category cards**: 48x48px (small)
- **Detail view**: 96x96px (large)

Ensure your source images are at least **256x256px** for crisp display on all screen sizes.

## 🔄 Updates

After adding new icons:
1. Icons load automatically (no code changes needed)
2. Hard refresh browser to clear cache
3. Check browser console for 404 errors
4. Verify file names match creature IDs exactly

## ✅ Checklist

Before deploying:
- [ ] All 19 default icons added to `/public/default-icons/`
- [ ] Icon file names match creature IDs exactly
- [ ] PNG format with transparency (recommended)
- [ ] Icon size is 256x256px or larger
- [ ] Icons display correctly in gallery
- [ ] No 404 errors in console
- [ ] Custom overrides work (if any)
- [ ] Icons look professional on mobile and desktop

---

## 🎉 Result

Once icons are added:
- **With default icons**: Gallery shows beautiful professional icons
- **With custom icons**: User-uploaded icons override defaults automatically
- **Without icons**: Emojis display as fallback (works immediately)

Your gallery is now production-ready with full icon support! 🌊🐠🦈
