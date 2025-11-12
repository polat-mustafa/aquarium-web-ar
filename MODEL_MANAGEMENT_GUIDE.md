# Model Management & Approval System

## Overview

The Model Management system provides administrators with comprehensive tools to review, test, and approve 3D models before they appear in the public gallery. This guide covers the complete workflow from model upload through approval and publication.

## System Architecture

### Approval Flow

```
Model Upload → Dashboard Review → Quality Testing → Approval → Gallery Publication
     ↓              ↓                   ↓              ↓              ↓
/public/models/  Preview +         AR + Scale     localStorage   Live Gallery
                 Stats             Testing          Storage
```

### Storage Mechanism

| Storage Type | Purpose | Data Stored |
|--------------|---------|-------------|
| **Static** (Code) | Pre-approved models | `approved: true` in `MODEL_REGISTRY` |
| **Dynamic** (localStorage) | Runtime approvals | `model_approvals` and `model_categories` keys |
| **Combined** | Final determination | Checks both sources |

## Dashboard Access

### Authentication

Navigate to the dashboard and authenticate:

```
http://localhost:3000/dashboard
```

**Default Credentials:** Check `src/utils/auth.ts` or environment variables.

### Dashboard Sections

| Section | Purpose |
|---------|---------|
| **3D Models & Sizes** | Manage approved models, adjust scale |
| **⏳ Pending Approvals** | Review and approve new models |
| **Settings** | Configure hashtags, speech bubbles, indicators |

## Pending Approvals Workflow

### Step 1: Access Pending Models

1. Open dashboard: `http://localhost:3000/dashboard`
2. Click the **"⏳ Pending Approvals"** tab
3. Badge indicator shows number of pending models

**If No Pending Models:**
```
┌────────────────────────────────┐
│   All Caught Up! 🎉           │
│                                │
│   No models awaiting approval │
│   New models will appear here │
└────────────────────────────────┘
```

### Step 2: Review Model Information

Each pending model displays comprehensive information:

#### File Information 📋

| Property | Description | Good Values | Warning Values |
|----------|-------------|-------------|----------------|
| **Format** | GLB (Binary) or GLTF (JSON) | GLB | GLTF (requires .bin) |
| **File Size** | Total file size | <5MB | >10MB |
| **File Path** | Location in project | `/models/filename.glb` | Path errors |

#### Model Statistics 📊

| Metric | Description | Optimal | High | Critical |
|--------|-------------|---------|------|----------|
| **Vertices** | Number of points | <30K | 30K-50K | >50K |
| **Triangles** | Polygon count | <50K | 50K-100K | >100K |
| **Materials** | Material count | 1-3 | 4-6 | >6 |
| **Animations** | Animation clips | 1+ | - | - |
| **Textures** | Texture presence | ✓ Yes | - None | - |

#### Quality Checks ✓

Automated validation:
- ✅ File exists and is accessible
- ✅ Valid format (GLB/GLTF)
- ✅ Poly count analysis (optimal/high warning)
- ✅ Animation detection
- ✅ Texture validation

### Step 3: Interactive Testing

#### 3D Preview

**Controls:**
- **Mouse Drag:** Rotate model 360°
- **Mouse Wheel:** Zoom in/out
- **Auto-Rotate Toggle:** Start/stop rotation
- **Grid Toggle:** Show/hide reference grid

**Visual Inspection Checklist:**
- [ ] Model is complete (no missing parts)
- [ ] Textures load correctly
- [ ] Colors are appropriate
- [ ] Orientation is correct
- [ ] Scale appears reasonable

#### Size Testing

**Scale Adjustment:**
- Slider range: 0.1x to 5.0x (10cm to 500cm)
- Real-time preview updates
- Default: 1.5x (150cm)
- Reset button returns to default

**Testing Different Sizes:**
```
0.5x (50cm)   → Tiny, detailed viewing
1.0x (100cm)  → Natural size
1.5x (150cm)  → Default showcase size
2.5x (250cm)  → Large, impressive display
5.0x (500cm)  → Maximum size
```

**Best Practice:** Test at 1x, 1.5x, and 2.5x to find optimal size for your use case.

#### AR Testing

**Launch AR View:**
1. Click "🎥 Test in AR View" button
2. New tab opens with full AR experience
3. Allow camera permissions (if prompted)
4. Point camera to test environment

**What to Test:**
- [ ] Model loads without errors
- [ ] Camera overlay functions properly
- [ ] Animations play (if model has animations)
- [ ] Size is appropriate in AR context
- [ ] Performance is smooth (no lag/stuttering)
- [ ] Lighting appears natural
- [ ] Model responds to interactions

**Close AR tab when testing is complete.**

### Step 4: Category Selection

Choose the gallery category where this model will appear:

| Category | Icon | Examples |
|----------|------|----------|
| Fish | 🐟 | Tuna, Clownfish, Shark, Angelfish |
| Marine Mammals | 🐋 | Dolphin, Whale, Seal, Otter |
| Shellfish | 🦀 | Crab, Lobster, Shrimp, Oyster |
| Mollusks | 🐙 | Octopus, Squid, Cuttlefish |
| Jellyfish | 🪼 | Moon Jelly, Box Jelly, Lion's Mane |
| Sea Reptiles | 🐢 | Sea Turtle, Sea Snake, Marine Iguana |
| Baltic Species | 🌊 | Baltic-specific marine life |

**Note:** Category selection here overrides the original category set in `MODEL_REGISTRY`.

### Step 5: Approval Decision

#### Approve Model

**When to Approve:**
- All quality checks pass
- Visual inspection complete
- AR testing successful
- Category selection confirmed
- Size is appropriate

**Click:** "✅ Approve & Add to Gallery"

**What Happens:**
1. Approval saved to localStorage (`model_approvals`)
2. Selected category saved (`model_categories`)
3. Model disappears from Pending list
4. Model immediately appears in gallery with 3D badge
5. Console logs confirmation

#### Reject/Skip Model

**If Model Has Issues:**
1. Do not approve yet
2. Fix issues in source file or registry
3. Replace model file in `/public/models/`
4. Refresh dashboard to re-review

**To Temporarily Hide:**
Comment out entry in `MODEL_REGISTRY`:
```typescript
// {
//   fileName: 'problematic-model.glb',
//   creatureName: 'Problem Fish',
//   category: 'fish',
//   modelPath: '/models/problematic-model.glb',
//   approved: false
// },
```

## Viewing Modes

### Compact Mode (Default)

Single-column layout with all information stacked vertically.

**Best For:**
- Quick reviews
- Mobile viewing
- Space-constrained displays

### Expanded Mode

Two-column layout with preview on left and details on right.

**Toggle:** Click "▶ Expand" button
**Best For:**
- Detailed inspection
- Side-by-side comparison
- Desktop displays

**Return to compact:** Click "◀ Compact" button

## Approval States

### State 1: Pending

**Indicators:**
- Yellow "PENDING" badge
- Appears in Pending Approvals tab
- Not visible in public gallery

**Registry Code:**
```typescript
{
  approved: false  // or omitted
}
```

### State 2: Approved (Static)

**Indicators:**
- Set in code
- Always approved on load
- Immediately visible in gallery

**Registry Code:**
```typescript
{
  approved: true
}
```

### State 3: Approved (Dynamic)

**Indicators:**
- Approved via dashboard
- Stored in localStorage
- Persists across sessions

**localStorage Entry:**
```json
{
  "model_approvals": {
    "Koi fish-fish.glb": true
  }
}
```

## Testing Checklist

### Pre-Approval Review

Before approving any model, verify:

#### File Quality
- [ ] File size is reasonable (<10MB)
- [ ] Format is GLB (or complete GLTF with all dependencies)
- [ ] File path is correct in registry

#### Visual Quality
- [ ] Model visible in preview
- [ ] No missing geometry or holes
- [ ] Textures load and display correctly
- [ ] Colors are appropriate and vibrant
- [ ] Model is properly oriented

#### Technical Quality
- [ ] Triangle count under 100K (optimal)
- [ ] Has materials and textures
- [ ] Animations present (if expected)
- [ ] No console errors during load

#### Size & Scale
- [ ] Tested at multiple scale values
- [ ] Found optimal size for display
- [ ] Proportions look realistic
- [ ] Neither too large nor too small

#### AR Performance
- [ ] Opens successfully in AR view
- [ ] Loads without errors
- [ ] Camera overlay works
- [ ] Smooth rendering (no lag)
- [ ] Interactions function properly

#### Final Verification
- [ ] Correct category selected
- [ ] All tests passed
- [ ] Ready for public gallery

## Troubleshooting

### Model Preview Not Showing

**Symptoms:**
- Blank preview area
- Loading spinner never completes
- Error message displayed

**Diagnostic Steps:**

1. **Check Browser Console (F12)**
   - Look for 404 errors (file not found)
   - Look for GLTF parsing errors
   - Check for WebGL errors

2. **Verify File Exists**
   ```bash
   ls "C:\Users\stary\Desktop\aquarium\public\models\filename.glb"
   ```

3. **Common Issues:**

   **404 File Not Found:**
   - File not in `/public/models/` directory
   - Filename mismatch (check exact spelling, spaces, case)
   - Wrong file extension in registry

   **GLTF Missing Dependencies:**
   - GLTF format needs `.bin` file in same directory
   - Textures must be present
   - **Solution:** Convert to GLB format

   **Corrupted File:**
   - File didn't upload completely
   - File is damaged
   - **Solution:** Re-export from 3D software

   **WebGL Errors:**
   - Browser doesn't support WebGL
   - Graphics drivers out of date
   - **Solution:** Try different browser (Chrome recommended)

### Model Appears but Looks Wrong

**Black/White Model:**
- Textures missing or not embedded
- **Solution:** Re-export with embedded textures

**Distorted/Stretched:**
- Model not centered at origin in 3D software
- **Solution:** Center model before export

**Too Small/Large:**
- Export scale incorrect
- **Solution:** Adjust scale slider or re-export

### Performance Issues

**Slow Rotation/Lag:**
- Too many polygons (>100K triangles)
- **Solution:** Optimize model, reduce poly count

**Browser Freezes:**
- File too large (>50MB)
- **Solution:** Optimize textures, reduce file size

### Approval Not Saving

**Model Doesn't Appear After Approval:**

1. **Hard Refresh Browser**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Check localStorage**
   ```javascript
   // In browser console
   localStorage.getItem('model_approvals')
   ```

3. **Clear Cache and Retry**
   - Clear browser cache
   - Refresh dashboard
   - Approve again

4. **Check Console for Errors**
   - Look for JavaScript errors
   - Check for localStorage quota errors

### Model Not in Gallery After Approval

**Checklist:**
- [ ] Approval was successful (check console log)
- [ ] Gallery page has been refreshed
- [ ] Correct category selected
- [ ] localStorage contains approval
- [ ] No console errors on gallery page

**Verify Approval:**
```javascript
// Browser console
const approvals = JSON.parse(localStorage.getItem('model_approvals') || '{}');
console.log(approvals);
```

## Un-Approving Models

### Remove Dynamic Approval

To un-approve a model that was approved via dashboard:

```javascript
// In browser console
const approvals = JSON.parse(localStorage.getItem('model_approvals') || '{}');
delete approvals['filename.glb'];
localStorage.setItem('model_approvals', JSON.stringify(approvals));

// Also remove category if needed
const categories = JSON.parse(localStorage.getItem('model_categories') || '{}');
delete categories['filename.glb'];
localStorage.setItem('model_categories', JSON.stringify(categories));

// Refresh page
location.reload();
```

### Change Static Approval

To un-approve a model with `approved: true` in code:

1. Open `src/utils/modelMatcher.ts`
2. Find the model entry
3. Change `approved: true` to `approved: false`
4. Save file
5. Refresh browser

## Best Practices

### For Reviewers

1. **Thorough Testing** - Don't rush, test all features
2. **Consistent Standards** - Apply same quality bar to all models
3. **Document Issues** - Note problems for model creators
4. **Test on Mobile** - Verify performance on actual devices
5. **Category Accuracy** - Ensure models are in correct categories

### For Model Creators

1. **Optimize First** - Reduce polygons before submission
2. **GLB Format** - Use GLB, not GLTF, for easier approval
3. **Embed Textures** - Include all textures in file
4. **Reasonable Size** - Keep files under 10MB
5. **Test Locally** - Load in 3D viewer before submission

### For Administrators

1. **Regular Reviews** - Check pending models frequently
2. **Quality Standards** - Document acceptable standards
3. **Backup** - Export localStorage periodically
4. **Monitor Performance** - Track gallery load times
5. **User Feedback** - Collect feedback on approved models

## Advanced Management

### Bulk Approval

To approve multiple models at once:

```javascript
// In browser console
const modelsToApprove = [
  'model1.glb',
  'model2.glb',
  'model3.glb'
];

const approvals = JSON.parse(localStorage.getItem('model_approvals') || '{}');
modelsToApprove.forEach(filename => {
  approvals[filename] = true;
});
localStorage.setItem('model_approvals', JSON.stringify(approvals));
location.reload();
```

### Export Approvals

Save approval state for backup:

```javascript
// Export to JSON
const approvals = localStorage.getItem('model_approvals');
const categories = localStorage.getItem('model_categories');
const backup = {
  approvals: JSON.parse(approvals || '{}'),
  categories: JSON.parse(categories || '{}'),
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(backup, null, 2));
// Copy output and save to file
```

### Import Approvals

Restore from backup:

```javascript
// Paste backup JSON
const backup = {
  "approvals": { /* ...your backup... */ },
  "categories": { /* ...your backup... */ }
};

localStorage.setItem('model_approvals', JSON.stringify(backup.approvals));
localStorage.setItem('model_categories', JSON.stringify(backup.categories));
location.reload();
```

## Summary

The Model Management system provides:

✅ **Comprehensive Review Tools** - Preview, statistics, quality checks
✅ **Interactive Testing** - 3D preview, scale testing, AR testing
✅ **Flexible Approval** - Static (code) or dynamic (dashboard)
✅ **Quality Assurance** - Automated validation and manual review
✅ **Category Management** - Runtime category selection
✅ **Persistent Storage** - localStorage-based approval tracking
✅ **Professional Workflow** - Systematic approval process

### Related Documentation

- **Adding Models:** See `3D_MODELS_GUIDE.md`
- **Model Optimization:** See `3D_MODELS_GUIDE.md` → Best Practices
- **Troubleshooting Models:** See `3D_MODELS_GUIDE.md` → Troubleshooting
- **Icon Configuration:** See `ICON_SETUP_GUIDE.md`

---

**Last Updated:** January 2025
**Current Version:** 1.2.0
