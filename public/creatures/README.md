# Creatures Folder Structure

Each creature should have its own folder with the following structure:

```
/public/creatures/
  └── your-creature-name/
      ├── icon/
      │   └── icon.png (or icon.jpg, icon.svg)
      └── 3d/
          └── model.glb (or model.gltf)
```

## Example Structure

```
/public/creatures/
  ├── demo-jellyfish/          (Example - you can delete this)
  │   ├── icon/
  │   │   └── icon.png
  │   └── 3d/
  │       └── model.glb
  │
  └── my-shark/                (Your custom creature)
      ├── icon/
      │   └── icon.png
      └── 3d/
          └── model.glb
```

## How It Works

1. **Create a folder** with your creature name (e.g., `beautiful-seahorse`)
2. **Add icon**: Place an image in the `icon/` subfolder
   - Supported: `icon.png`, `icon.jpg`, `icon.jpeg`, `icon.svg`
3. **Add 3D model**: Place your model in the `3d/` subfolder
   - Supported: `model.glb`, `model.gltf`
4. **Automatic detection**: Gallery will automatically find and display your creature!

## File Naming

- Icon files must be named: `icon.png`, `icon.jpg`, `icon.jpeg`, or `icon.svg`
- 3D model files must be named: `model.glb` or `model.gltf`

## Folder Naming

- Use lowercase with hyphens: `my-creature-name`
- Avoid spaces and special characters
- Examples: `blue-whale`, `red-octopus`, `striped-fish`

## What Happens

- Creatures in this folder will appear in the Gallery
- Clicking on them loads the 3D model in AR
- The icon is displayed on the gallery card
- If files are missing, default placeholders are used (app won't crash!)

## Important Notes

- **Existing creatures from the code still work!** This is additive only.
- Your custom creatures will appear alongside built-in ones
- No need to modify any code - just add folders!
