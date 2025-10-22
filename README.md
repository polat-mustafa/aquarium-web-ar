# 🌊 Aquarium WebAR Experience

A production-ready WebAR application for the Aquarium, built with entirely free and open-source technologies. This application allows visitors to interact with marine life in augmented reality, record magical moments, and share them on social media.

![Aquarium WebAR](https://img.shields.io/badge/Status-Production%20Ready-green) ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.1-black) ![License](https://img.shields.io/badge/License-FOSS-brightgreen)

## ✨ Features

- **🔍 QR Code Detection**: Instant creature spawning via QR code scanning
- **📱 No App Required**: Works directly in mobile browsers
- **🎥 Video Recording**: Capture AR experience with overlays (speech bubbles, effects)
- **🔎 Pinch-to-Zoom**: Zoom 3D models from 0.5x to 3x in fullscreen mode
- **💬 Interactive Speech Bubbles**: Fun cloud-style speech bubbles with educational fish facts
- **✨ Visual Effects**: Tap screen for bubble animations captured in recordings
- **🐠 Interactive Creatures**: 3D animated sea creatures with realistic behaviors
- **♿ Accessibility**: Full screen reader support and keyboard navigation
- **🌐 Responsive Design**: Optimized for all mobile devices
- **🚀 High Performance**: 70% smaller bundle, efficient canvas rendering

## 🏗️ Technology Stack

### Core Technologies (100% FOSS)
- **Frontend Framework**: Next.js 15.1 with TypeScript
- **AR Library**: AR.js with Three.js + React Three Fiber
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **QR Detection**: jsQR
- **3D Rendering**: Three.js with @react-three/fiber and @react-three/drei

### Development Tools
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Build Tool**: Next.js built-in Turbopack
- **Type Checking**: TypeScript strict mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone &lt;repository-url&gt;
   cd aquariumm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_AQUARIUM_NAME="Aquarium"
   NEXT_PUBLIC_AQUARIUM_HASHTAG="#Aquarium"
   NEXT_PUBLIC_AQUARIUM_HANDLE="@aquarium"
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Allow camera permissions when prompted
   - Test with direct creature URLs (see testing section below)

## 📱 User Journey

1. **Discovery**: Visitor finds QR code near aquarium exhibit
2. **Activation**: Scan QR code with phone browser
3. **Permission**: Allow camera access
4. **Experience**: AR creature appears with realistic animations
5. **Interaction**: Tap creature for special animations
6. **Recording**: Capture 15-second video
7. **Sharing**: Download and share on social media

## 🐠 Available Sea Creatures

| Creature | Type | Animations | Special Features |
|----------|------|------------|------------------|
| 🦈 Great White Shark | `shark` | Entrance, Swimming, Attack | Predator behaviors |
| 🐬 Bottlenose Dolphin | `dolphin` | Entrance, Swimming, Jump | Playful interactions |
| 🐢 Sea Turtle | `turtle` | Entrance, Swimming, Surface | Slow, graceful movements |
| 🐙 Giant Pacific Octopus | `octopus` | Entrance, Floating, Color Change | Camouflage effects |
| 🪼 Moon Jellyfish | `jellyfish` | Entrance, Pulsing, Glow | Bioluminescent effects |
| 🐋 Humpback Whale | `whale` | Entrance, Swimming, Song | Massive scale, whale sounds |

## 🗂️ Project Structure

```
aquariumm/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── ar/                 # AR experience page
│   │   ├── gallery/            # Creature gallery
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── ar/                 # AR-specific components
│   │   │   ├── ARViewer.tsx    # Main AR scene
│   │   │   ├── ARScene.tsx     # AR scene wrapper
│   │   │   └── CreatureModel.tsx # 3D creature renderer
│   │   ├── ui/                 # UI components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── RecordButton.tsx
│   │   │   └── SharePanel.tsx
│   │   └── video/              # Video components
│   ├── hooks/                  # Custom React hooks
│   │   └── useAccessibility.ts # Accessibility features
│   ├── stores/                 # State management
│   │   └── useAppStore.ts      # Main Zustand store
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts            # Core type definitions
│   └── utils/                  # Utility functions
│       ├── creatures.ts        # Creature configurations
│       └── qrDetection.ts      # QR code detection
├── public/
│   ├── models/                 # 3D model files (.glb)
│   └── markers/                # QR code markers
├── .env.local                  # Environment variables
├── .eslintrc.json             # ESLint configuration
├── .prettierrc                # Prettier configuration
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind CSS config
└── tsconfig.json              # TypeScript config
```

## 🧪 Testing

### Development Testing

**Direct Creature Access:**
```
# Test individual creatures
http://localhost:3000/ar?creature=shark-1
http://localhost:3000/ar?creature=dolphin-1
http://localhost:3000/ar?creature=turtle-1
http://localhost:3000/ar?creature=octopus-1
http://localhost:3000/ar?creature=jellyfish-1
http://localhost:3000/ar?creature=whale-1
```

**QR Code Testing:**
Generate QR codes with this JSON format:
```json
{
  "type": "aquarium-creature",
  "markerId": "shark-marker",
  "version": "1.0"
}
```

### Production Testing

Use ngrok for mobile testing:
```bash
# Install ngrok
npm install -g ngrok

# Authenticate (replace with your token)
ngrok authtoken YOUR_AUTH_TOKEN

# Start tunnel
ngrok http 3000

# Use the https URL for mobile testing
```

## 🎮 Adding New Sea Creatures

### 1. Create 3D Model
- Format: GLTF/GLB optimized for web
- Size: Maximum 2MB
- Animations: `{type}_spawn`, `{type}_swim`, `{type}_special`
- Place in: `public/models/{creature}.glb`

### 2. Add Creature Configuration
Edit `src/utils/creatures.ts`:
```typescript
{
  id: 'newcreature-1',
  name: 'New Creature',
  type: 'newcreature',
  modelPath: '/models/newcreature.glb',
  scale: 0.8,
  position: [0, -0.5, -1],
  animations: ['entrance', 'idle', 'specialAction'],
  description: 'Description of the new creature...',
}
```

### 3. Create Marker
Add to `arMarkers` array:
```typescript
{
  id: 'newcreature-marker',
  imagePath: '/markers/newcreature-marker.png',
  creatureId: 'newcreature-1',
  size: 0.15,
}
```

### 4. Generate QR Code
Create QR code with:
```json
{
  "type": "aquarium-creature",
  "markerId": "newcreature-marker",
  "version": "1.0"
}
```

## ⚡ Performance Optimization

### 3D Models
- Use Draco compression for geometry
- Optimize textures (WebP, KTX2)
- Limit polygon count (&lt; 10k triangles)
- Combine materials where possible

### Code Splitting
- Lazy load AR components
- Dynamic imports for heavy libraries
- Optimize bundle size with tree shaking

### Caching Strategy
- Service worker for offline support
- Cache 3D models and textures
- Optimize image formats

## ♿ Accessibility Features

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and live regions
- Alternative text for all interactive elements

### Keyboard Navigation
- Tab order optimization
- Focus management
- Keyboard shortcuts for main actions

### Visual Accessibility
- High contrast mode support
- Reduced motion preferences
- Scalable text and UI elements

### Motor Accessibility
- Large touch targets (44px minimum)
- Gesture alternatives
- Voice control compatibility

## 🔧 Configuration

### Environment Variables
```env
# Site configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_AQUARIUM_NAME="Your Aquarium Name"
NEXT_PUBLIC_AQUARIUM_HASHTAG="#YourHashtag"
NEXT_PUBLIC_AQUARIUM_HANDLE="@yourhandle"

# Optional: Analytics and monitoring
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
```

### AR Scene Configuration
Edit `src/utils/creatures.ts` for scene settings:
- Lighting intensity
- Fog settings
- Background colors
- Animation speeds

## 🚀 Deployment

### Build Production Version
```bash
npm run build
npm run start
```

### Static Export (Optional)
```bash
npm run build
npm run export
```

### Deployment Platforms
- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **GitHub Pages**: Free hosting option
- **Self-hosted**: Docker container available

## 🐛 Troubleshooting

### Common Issues

**Camera Permission Denied:**
- Ensure HTTPS in production
- Check browser permissions
- Test on different devices

**3D Models Not Loading:**
- Verify file paths in `creatures.ts`
- Check model file sizes (&lt; 2MB)
- Ensure GLTF/GLB format

**QR Code Not Detected:**
- Verify QR code JSON format
- Check lighting conditions
- Test with multiple QR generators

**Performance Issues:**
- Reduce model complexity
- Lower texture resolution
- Enable hardware acceleration

### Browser Support
- **Chrome**: Full support (recommended)
- **Safari**: iOS 11.3+ required for WebRTC
- **Firefox**: Limited AR.js support
- **Edge**: Good support on Windows

## 📄 License

This project is built entirely with Free and Open Source Software (FOSS). All components are available under permissive licenses allowing commercial use.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Add JSDoc comments for all functions
- Write accessible code (WCAG 2.1 AA)
- Test on mobile devices

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review browser compatibility

## 🙏 Acknowledgments

- **Three.js**: 3D graphics rendering
- **AR.js**: WebAR capabilities
- **Next.js**: React framework
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management
- **React Three Fiber**: React Three.js integration

## 📋 Version History

### v1.1 (Current)
**Enhanced Recording & Interaction**
- ✨ Pinch-to-zoom for 3D models (0.5x - 3x range)
- 🎨 Video recording with overlay capture (speech bubbles, bubble effects)
- 📦 70% bundle size reduction (manual canvas drawing vs html2canvas)
- 🎯 Visual zoom indicator showing percentage
- 🧹 Cleaner videos (removed instructional text from recordings)
- ⚡ Better performance with native canvas rendering

### v1.0
**Initial Stable Release**
- 🎥 Video recording with AR model capture
- 💬 Cloud-style speech bubbles with fish facts
- ✨ Bubble tap effects
- 🌐 Multi-language support (EN, TR, PL)
- 📱 Fullscreen AR mode
- 🎨 Professional UI with gradient design
- 🐠 3D animated fish models (Tuna, Zebrasoma)

---

**Built with ❤️ for marine conservation and education**

*Last updated: January 2025*
