# 🎯 Model Approval System - Complete Guide

## Overview

The new approval workflow allows you to review 3D models before they appear in the gallery. Models are first uploaded to the `/public/models/` folder, then you review and approve them in the dashboard before they become visible to users.

## How It Works

### 1. Upload Model → 2. Dashboard Review → 3. Approve → 4. Gallery

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐       ┌─────────────┐
│  Upload     │       │  Dashboard   │       │  Approve &   │       │  Gallery    │
│  Model to   │  -->  │  Shows       │  -->  │  Select      │  -->  │  Shows      │
│  /models/   │       │  Pending     │       │  Category    │       │  Approved   │
└─────────────┘       └──────────────┘       └──────────────┘       └─────────────┘
```

## Step-by-Step Workflow

### Step 1: Add Your 3D Model

1. Place your `.glb` or `.gltf` file in:
   ```
   /public/models/your-model-name.glb
   ```

2. Register it in `/src/utils/modelMatcher.ts`:
   ```typescript
   export const MODEL_REGISTRY: ModelDefinition[] = [
     // Existing approved models...

     // Your new model (not approved yet)
     {
       fileName: 'blue-whale.glb',
       creatureName: 'Blue Whale',
       category: 'mammals',
       modelPath: '/models/blue-whale.glb',
       approved: false  // ⏳ Pending approval
     },
   ];
   ```

### Step 2: Review in Dashboard

1. Open the dashboard:
   ```
   http://localhost:3000/dashboard
   ```

2. Login (if required)

3. Click the **"✅ Pending Approvals"** tab
   - You'll see a notification badge showing the number of pending models

4. Your model appears as a card with:
   - 3D preview (rotating)
   - Model name and filename
   - Category dropdown selector
   - "Approve & Add to Gallery" button

### Step 3: Approve the Model

1. **Review the 3D preview** - Verify the model looks correct

2. **Select the category** - Choose which gallery page it should appear on:
   - 🐟 Fish
   - 🐋 Marine Mammals
   - 🦀 Shellfish
   - 🐙 Mollusks
   - 🪼 Jellyfish
   - 🐢 Sea Reptiles
   - 🌊 Baltic Species

3. **Click "Approve & Add to Gallery"**
   - Model is approved and saved in localStorage
   - Disappears from pending list
   - Immediately appears in the selected gallery category!

### Step 4: View in Gallery

1. Go to the gallery:
   ```
   http://localhost:3000/gallery
   ```

2. Navigate to the category you selected

3. Your model now appears with a green **3D** badge

4. Click it to view in AR!

---

## Current Model Status

### ✅ Already Approved (in code):

1. **Tuna Fish** (`tuna fish-fish.glb`)
   - Shows in: Fish gallery
   - Attached to: existing "Tuna" creature
   - Status: `approved: true` in code

2. **Zebrasoma Xanthurum** (`Zebrasoma Xanthurum-fish.glb`)
   - Shows in: Fish gallery
   - Attached to: existing "Zebrasoma" creature
   - Status: `approved: true` in code

### ⏳ Pending Approval (needs review):

3. **Koi Fish** (`Koi fish - fish.gltf`)
   - Waiting in: Dashboard → Pending Approvals tab
   - Will create: NEW creature "Koi Fish"
   - Status: `approved: false` in code

---

## How Approval Status Works

### Static Approval (in code):
```typescript
{
  fileName: 'tuna fish-fish.glb',
  creatureId: 'tuna',
  category: 'fish',
  modelPath: '/models/tuna fish-fish.glb',
  approved: true  // ✅ Always approved
}
```

### Dynamic Approval (via dashboard):
```typescript
{
  fileName: 'Koi fish - fish.gltf',
  creatureName: 'Koi Fish',
  category: 'fish',
  modelPath: '/models/Koi fish - fish.gltf',
  approved: false  // ⏳ Pending - shows in dashboard
}
```

When you approve in the dashboard:
- Approval status saved in **localStorage** (`model_approvals`)
- Selected category saved in **localStorage** (`model_categories`)
- System checks both code (`approved: true`) AND localStorage
- Once approved, model appears in gallery automatically

---

## Adding New Models (Quick Reference)

### Option A: Pre-Approved (Skip Dashboard)

For models you trust immediately:

```typescript
{
  fileName: 'shark-3d.glb',
  creatureId: 'shark',
  category: 'fish',
  modelPath: '/models/shark-3d.glb',
  approved: true  // ✅ Goes straight to gallery
}
```

### Option B: Pending Approval (Review First)

For models you want to review:

```typescript
{
  fileName: 'new-creature.glb',
  creatureName: 'New Creature',
  category: 'fish',
  modelPath: '/models/new-creature.glb',
  approved: false  // ⏳ Shows in dashboard first
}
```

---

## Dashboard Features

### Pending Approvals Tab

**Shows:**
- All unapproved models
- 3D preview of each model
- Category selector dropdown
- Approve button

**Features:**
- Notification badge with pending count
- Auto-rotating 3D preview
- Real-time category selection
- One-click approval

**Empty State:**
- "All Caught Up!" message when no pending models
- Friendly reminder that new models will appear here

---

## Technical Details

### File Locations

| File | Purpose |
|------|---------|
| `/src/utils/modelMatcher.ts` | Model registry and approval functions |
| `/src/app/dashboard/page.tsx` | Dashboard with approval UI |
| `/src/app/gallery/page.tsx` | Gallery (shows approved models only) |
| `/public/models/` | 3D model files storage |

### Functions

| Function | Purpose |
|----------|---------|
| `isModelApproved(model)` | Checks if model is approved (code OR localStorage) |
| `approveModel(fileName, category)` | Approves model and saves to localStorage |
| `getPendingModels()` | Returns list of unapproved models |
| `getApprovedCategory(model)` | Gets the approved category from localStorage |

### localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `model_approvals` | `{ "filename.glb": true }` | Tracks which models are approved |
| `model_categories` | `{ "filename.glb": "fish" }` | Stores selected categories |

---

## Example Workflow

### Adding a Dolphin Model:

1. **Upload file:**
   ```bash
   # Copy to:
   /public/models/dolphin-animated.glb
   ```

2. **Register in code:**
   ```typescript
   {
     fileName: 'dolphin-animated.glb',
     creatureId: 'dolphin',  // Attach to existing dolphin
     category: 'mammals',
     modelPath: '/models/dolphin-animated.glb',
     approved: false  // Needs approval
   }
   ```

3. **Go to dashboard:**
   - Open `http://localhost:3000/dashboard`
   - Click "Pending Approvals" tab
   - See "Dolphin" card with 3D preview

4. **Review and approve:**
   - Watch 3D preview rotate
   - Verify it looks good
   - Select "Marine Mammals" category
   - Click "Approve & Add to Gallery"

5. **View in gallery:**
   - Go to `http://localhost:3000/gallery`
   - Click "Marine Mammals"
   - See "Dolphin" with 3D badge
   - Click to view in AR!

---

## Benefits of This System

✅ **Quality Control** - Review all models before they go live

✅ **Flexible Categorization** - Change category during approval

✅ **No Code Changes** - Approve models without editing TypeScript files

✅ **Persistent Storage** - Approvals saved in localStorage

✅ **User-Friendly** - Simple one-click approval process

✅ **Visual Preview** - See 3D model before approving

✅ **Batch Management** - See all pending models at once

---

## Troubleshooting

### Model Not Showing in Dashboard?

**Check:**
1. File exists in `/public/models/`
2. Registered in `MODEL_REGISTRY` array
3. `approved: false` (if true, it's already in gallery)
4. Hard refresh dashboard (Ctrl+Shift+R)

### Model Not Appearing in Gallery After Approval?

**Solution:**
1. Refresh gallery page (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify localStorage has the approval:
   ```javascript
   // In browser console:
   localStorage.getItem('model_approvals')
   ```

### Want to Un-Approve a Model?

**Solution:**
```javascript
// In browser console:
const approvals = JSON.parse(localStorage.getItem('model_approvals') || '{}');
delete approvals['filename.glb'];
localStorage.setItem('model_approvals', JSON.stringify(approvals));
// Then refresh the page
```

---

## Summary

Your approval system is now fully functional! 🎉

**Workflow:**
1. Add model file to `/public/models/`
2. Register with `approved: false` in `modelMatcher.ts`
3. Review in Dashboard → Pending Approvals
4. Approve with category selection
5. Model appears in gallery instantly!

**Current Status:**
- ✅ Tuna Fish - Approved (in gallery)
- ✅ Zebrasoma Xanthurum - Approved (in gallery)
- ⏳ Koi Fish - Pending (in dashboard)

Go to `http://localhost:3000/dashboard` and click "Pending Approvals" to approve the Koi Fish!
