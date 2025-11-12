# 🌊 Aquarium WebAR Experience

A production-ready WebAR application built with entirely free and open-source technologies. This application allows visitors to interact with marine life in augmented reality, record magical moments, and share them on social media.

![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.5-black) ![License](https://img.shields.io/badge/License-FOSS-brightgreen) ![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

## ✨ Features

### Core AR Experience
- **🔍 QR Code Detection** - Instant creature spawning via QR code scanning
- **📱 No App Required** - Works directly in mobile browsers (PWA-ready)
- **🐠 Interactive 3D Creatures** - Animated sea creatures with realistic behaviors
- **✋ Hand Detection** - Real-time interaction using MediaPipe
- **🎯 Collision Avoidance** - Fish swim away from detected obstacles
- **♿ Accessibility** - Full screen reader support and keyboard navigation

### Media Capture
- **🎥 Video Recording** - Capture 15-second AR experiences with overlays
- **📸 Photo Capture** - High-quality snapshots with AR elements
- **🎨 AI Transformations** - Apply artistic styles (Simpson, Pixar, Anime)
- **💬 Speech Bubbles** - Educational fish facts in cloud-style bubbles
- **✨ Visual Effects** - Tap screen for bubble animations
- **🔎 Pinch-to-Zoom** - Zoom 3D models from 0.5x to 3x

### Content Management
- **3D Model System** - Flexible model registry with approval workflow
- **Icon Management** - Three-tier icon system (custom → default → emoji)
- **Multi-Language** - Support for English, Turkish, and Polish
- **Dashboard** - Admin panel for model approval and settings

## 🏗️ Technology Stack

### Core Technologies (100% FOSS)
- **Frontend Framework:** [Next.js 15](https://nextjs.org/) with TypeScript
- **AR/3D Rendering:** [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) with localStorage persistence
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Hand Tracking:** [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- **QR Detection:** [jsQR](https://github.com/cozmo/jsQR)

### Additional Libraries
- **Three.js Helpers:** @react-three/drei for lights, controls, loaders
- **Animation:** Three.js AnimationMixer for GLTF animations
- **Video Recording:** MediaRecorder API with canvas compositing
- **AI Integration:** Replicate API (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with WebRTC support
- HTTPS in production (for camera permissions)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd aquariumm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Mobile Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Create HTTPS tunnel (required for camera access)
ngrok http 3000

# Access via ngrok HTTPS URL on mobile device
```

## 📱 User Journey

1. **Discovery** - Visitor scans QR code near aquarium exhibit or accesses gallery directly
2. **Selection** - Choose a creature from the categorized gallery
3. **Permission** - Grant camera access (one-time)
4. **AR Experience** - 3D creature appears with realistic animations and hand-interaction
5. **Interaction** - Tap creature for special animations, move hands to watch fish avoid
6. **Recording** - Capture 15-second video with AR overlays
7. **Transformation** - Apply AI artistic styles (optional)
8. **Sharing** - Download and share on social media with auto-generated hashtags

## 🐠 Available Sea Creatures

The project includes 18+ default creatures across 7 categories:

| Category | Examples | 3D Models |
|----------|----------|-----------|
| 🐟 Fish | Shark, Tuna, Angelfish, Clownfish, Zebrasoma | 3 models |
| 🐋 Marine Mammals | Dolphin, Whale, Seal | Coming soon |
| 🦀 Shellfish | Crab, Lobster, Shrimp | Coming soon |
| 🐙 Mollusks | Octopus, Squid | Coming soon |
| 🪼 Jellyfish | Moon Jelly, Medusa | Coming soon |
| 🐢 Sea Reptiles | Sea Turtle, Sea Snake | Coming soon |
| 🌊 Baltic Species | Herring, Cod, Flounder, Baltic Seal | Coming soon |

### Current 3D Models
- ✅ Tuna Fish (593 KB, animated)
- ✅ Zebrasoma Xanthurum (593 KB, animated)
- ✅ Koi Fish (4.8 MB, static)

## 🗂️ Project Structure

```
aquariumm/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── ar/                  # AR experience routes
│   │   │   ├── page.tsx         # Main AR page
│   │   │   ├── test-newscene/   # Depth sensing test environment
│   │   │   └── photo-preview/   # Photo transformation UI
│   │   ├── gallery/             # Creature gallery
│   │   ├── dashboard/           # Admin dashboard
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── ar/                  # AR-specific components
│   │   │   ├── ARViewer.tsx     # Canvas wrapper & camera
│   │   │   ├── ARScene.tsx      # Three.js scene configuration
│   │   │   └── CreatureModel.tsx # 3D model renderer
│   │   └── ui/                  # UI components
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # Business logic services
│   │   ├── VideoRecordingService.ts
│   │   ├── PhotoCaptureService.ts
│   │   └── ReplicateVideoService.ts
│   ├── stores/                  # State management
│   │   └── useAppStore.ts       # Zustand store
│   ├── types/                   # TypeScript definitions
│   ├── utils/                   # Utility functions
│   │   ├── creatures.ts         # Static creature definitions
│   │   ├── modelMatcher.ts      # 3D model registry
│   │   ├── galleryData.ts       # Gallery data
│   │   ├── depthSensing.ts      # MediaPipe integration
│   │   └── qrDetection.ts       # QR code scanning
│   └── i18n/                    # Internationalization
│       └── translations.ts      # Language files
├── public/
│   ├── models/                  # 3D model files (.glb)
│   ├── default-icons/           # Default creature icons
│   └── creatures/               # Custom creature folders
├── docs/                        # Documentation (see below)
└── package.json
```

## 📚 Documentation

Comprehensive guides are available in the repository:

| Guide | Description |
|-------|-------------|
| **CLAUDE.md** | Instructions for Claude Code AI assistant |
| **3D_MODELS_GUIDE.md** | Adding and managing 3D models |
| **MODEL_MANAGEMENT_GUIDE.md** | Model approval workflow and testing |
| **DEPTH_SENSING_GUIDE.md** | Hand tracking and depth sensing implementation |
| **ICON_SETUP_GUIDE.md** | Icon configuration and customization |
| **AI_TRANSFORMATION_GUIDE.md** | AI photo transformation features |
| **VIDEO_ANIMATION_GUIDE.md** | Video recording and AI generation |
| **VERCEL_SETUP.md** | Deployment on Vercel |

## 🎮 Testing

### Direct Creature Access
Bypass QR scanning for development:

```
http://localhost:3000/ar?creature=shark-1
http://localhost:3000/ar?creature=tuna
http://localhost:3000/ar?creature=model-koi-fish
```

### Depth Sensing Test Environment

```
http://localhost:3000/ar/test-newscene?creature=tuna
```

Features:
- Real-time hand detection visualization
- Performance metrics (FPS, latency)
- Collision detection testing
- Debug controls and settings

### QR Code Testing

Generate QR codes with this JSON format:

```json
{
  "type": "aquarium-creature",
  "markerId": "shark-marker",
  "version": "1.0"
}
```

## 🎨 Adding New Content

### Adding a 3D Model

1. **Prepare Model**
   - Format: GLB (recommended) or GLTF
   - Size: Under 10MB
   - Polygons: Under 100K triangles

2. **Add to Project**
   ```bash
   # Copy model to public directory
   cp your-model.glb public/models/
   ```

3. **Register Model**
   Edit `src/utils/modelMatcher.ts`:
   ```typescript
   {
     fileName: 'your-model.glb',
     creatureName: 'Your Creature',
     category: 'fish',
     modelPath: '/models/your-model.glb',
     approved: false  // Review in dashboard first
   }
   ```

4. **Approve in Dashboard**
   - Navigate to `/dashboard`
   - Click "Pending Approvals"
   - Review 3D preview and statistics
   - Test in AR
   - Approve and select category

See **3D_MODELS_GUIDE.md** for complete instructions.

### Adding Custom Icons

1. Create icon (256x256px PNG recommended)
2. Add to `/public/default-icons/{creature-id}.png`
3. Or override specific creature: `/public/creatures/{id}/icon/icon.png`

See **ICON_SETUP_GUIDE.md** for details.

## ⚙️ Configuration

### Environment Variables

Create `.env.local` file:

```env
# Optional - AI Features (Replicate)
REPLICATE_API_TOKEN=your_token_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_AQUARIUM_NAME="Aquarium"
NEXT_PUBLIC_AQUARIUM_HASHTAG="#Aquarium"
NEXT_PUBLIC_AQUARIUM_HANDLE="@aquarium"
```

**Security Note:** Never use `NEXT_PUBLIC_` prefix for API tokens - keeps them server-side only.

### Dashboard Settings

Access `/dashboard` to configure:

- **3D Model Sizes** - Adjust scale for each creature
- **Speech Bubbles** - Enable/disable and set duration
- **Hashtags** - Customize social media hashtags
- **Touch Indicators** - Configure user guidance
- **Pending Approvals** - Review and approve new models

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Other Platforms

The project is a standard Next.js application and can be deployed to:
- **Netlify** - Static site hosting
- **GitHub Pages** - Free hosting option (requires static export)
- **Docker** - Self-hosted container deployment

See **VERCEL_SETUP.md** for detailed deployment instructions.

## 🔧 Troubleshooting

### Common Issues

**Camera Permission Denied:**
- Ensure HTTPS in production (HTTP only works on localhost)
- Check browser permissions in settings
- Try different browser

**3D Model Not Loading:**
- Verify file exists in `/public/models/`
- Check `MODEL_REGISTRY` configuration
- Ensure file is GLB format (or complete GLTF with .bin)
- Check browser console for errors
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

**QR Code Not Detected:**
- Verify QR code JSON format
- Ensure good lighting conditions
- Hold QR code steady at arm's length
- Try different QR code generator

**Performance Issues:**
- Reduce 3D model polygon count (<100K triangles)
- Lower texture resolution (2048x2048 max)
- Close other browser tabs
- Enable hardware acceleration in browser

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome (Desktop & Mobile) | ✅ Full | Recommended |
| Edge | ✅ Full | Same engine as Chrome |
| Safari (iOS 14.3+) | ✅ Full | Requires HTTPS |
| Safari (macOS) | ✅ Full | Works well |
| Firefox | ⚠️ Limited | Some AR.js limitations |

## ⚡ Performance Optimization

### 3D Models
- Use Draco compression for geometry
- Optimize textures (WebP, KTX2 formats)
- Limit polygon count (<10k triangles ideal)
- Combine materials where possible
- Use GLB format (single file, faster loading)

### Code Splitting
- Lazy load AR components
- Dynamic imports for heavy libraries
- Optimize bundle size with tree shaking

### Caching Strategy
- Service worker for offline support (PWA)
- Cache 3D models and textures
- Optimize image formats (WebP preferred)

## ♿ Accessibility

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and live regions
- Alternative text for all interactive elements

### Keyboard Navigation
- Tab order optimization
- Focus management
- Keyboard shortcuts for main actions

### Motor Accessibility
- Large touch targets (44px minimum)
- Gesture alternatives
- Voice control compatibility

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Add JSDoc comments for all exported functions
- Write accessible code (WCAG 2.1 AA)
- Test on mobile devices before PR

## 📄 License

This project is built entirely with Free and Open Source Software (FOSS). All components are available under permissive licenses allowing commercial use.

## 🙏 Acknowledgments

- **Three.js** - 3D graphics rendering
- **React Three Fiber** - React Three.js integration
- **Next.js** - React framework
- **MediaPipe** - Hand tracking and gesture recognition
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **jsQR** - QR code detection

## 📋 Version History

### v1.2.0 (Current) - Professional AR & Depth Sensing
- ✅ LiDAR-style scanning animation
- ✅ MediaPipe hand detection with collision avoidance
- ✅ Environment scanning with progress indicator
- ✅ WebXR feature detection
- ✅ Test environment for depth sensing experiments
- ✅ Professional documentation overhaul

### v1.1 - Enhanced Recording & Interaction
- ✅ Pinch-to-zoom for 3D models (0.5x - 3x range)
- ✅ Video recording with overlay capture (speech bubbles, effects)
- ✅ 70% bundle size reduction (manual canvas vs html2canvas)
- ✅ Visual zoom indicator showing percentage
- ✅ Cleaner videos (removed instructional text from recordings)

### v1.0 - Initial Stable Release
- ✅ Video recording with AR model capture
- ✅ Cloud-style speech bubbles with fish facts
- ✅ Bubble tap effects
- ✅ Multi-language support (EN, TR, PL)
- ✅ Fullscreen AR mode
- ✅ Professional UI with gradient design
- ✅ 3D animated fish models

## 📞 Support

- **Issues:** Report bugs and feature requests in GitHub Issues
- **Documentation:** See guides in repository root
- **Browser Compatibility:** Check "Troubleshooting" section above

---

**Built with ❤️ for marine conservation and education**

*Last Updated: January 2025*
*Version: 1.2.0*
