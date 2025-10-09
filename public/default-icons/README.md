# Default Icons Folder

This folder contains default icon images for all sea creatures in the gallery.

## How It Works

1. **Default Icons**: Place default icon images here named by creature ID (e.g., `shark.png`, `dolphin.png`)
2. **Custom Override**: If a custom icon exists at `/creatures/{creature-id}/icon/icon.*`, it will be used instead
3. **Fallback**: If neither custom nor default icon exists, an emoji will be displayed

## Supported Formats
- PNG (recommended)
- JPG/JPEG
- SVG
- WebP

## Naming Convention
Icons should be named exactly as the creature ID:
- `shark.png` for creature ID "shark"
- `angelfish.png` for creature ID "angelfish"
- `octopus.png` for creature ID "octopus"

## Recommended Specifications
- **Size**: 256x256px or 512x512px
- **Format**: PNG with transparency
- **Background**: Transparent or ocean-themed
- **Style**: Flat, modern, professional

## Example Structure
```
/public/default-icons/
  ├── shark.png
  ├── angelfish.png
  ├── dolphin.png
  ├── whale.png
  ├── octopus.png
  └── ...
```

## Priority Order
1. **Custom Icon**: `/creatures/{creature-id}/icon/icon.*` (highest priority)
2. **Default Icon**: `/default-icons/{creature-id}.png` (medium priority)
3. **Emoji Fallback**: Displayed if no icon found (lowest priority)
