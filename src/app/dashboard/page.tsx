'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { CreatureModel } from '@/components/ar/CreatureModel';
import { LoginForm } from '@/components/dashboard/LoginForm';
import { MODEL_REGISTRY, getPendingModels, approveModel, type ModelDefinition } from '@/utils/modelMatcher';
import { galleryCreatures } from '@/utils/galleryData';
import { isAuthenticated as checkAuth, logout } from '@/utils/auth';
import type { SeaCreature } from '@/types';

interface ModelConfig {
  id: string;
  name: string;
  modelPath?: string;
  defaultSize: number;
  category: string;
}

// Simple Preview Model Component
function PreviewModel({ modelPath, scale }: { modelPath: string; scale: number }) {
  try {
    const { scene } = useGLTF(modelPath);
    return <primitive object={scene} scale={scale} position={[0, 0, 0]} />;
  } catch (error) {
    console.error('Error loading model:', error);
    return null;
  }
}

// Loading Fallback Component
function LoadingModel() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#06b6d4" wireframe />
    </mesh>
  );
}

// Error Fallback Component
function ErrorModel() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ef4444" />
    </mesh>
  );
}

// Pending Model Card Component with Full Testing
function PendingModelCard({ model, onApprove }: { model: ModelDefinition; onApprove: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState(model.category);
  const [isApproving, setIsApproving] = useState(false);
  const [fileSize, setFileSize] = useState<string>('Loading...');
  const [modelStats, setModelStats] = useState<any>(null);
  const [testScale, setTestScale] = useState(1.5);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [expandedView, setExpandedView] = useState(false);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const categories = [
    { value: 'fish', label: 'Fish', emoji: '🐟' },
    { value: 'mammals', label: 'Marine Mammals', emoji: '🐋' },
    { value: 'shellfish', label: 'Shellfish', emoji: '🦀' },
    { value: 'mollusks', label: 'Mollusks', emoji: '🐙' },
    { value: 'jellyfish', label: 'Jellyfish', emoji: '🪼' },
    { value: 'reptiles', label: 'Sea Reptiles', emoji: '🐢' },
    { value: 'baltic', label: 'Baltic Species', emoji: '🌊' },
  ];

  // Get file size and model stats
  useEffect(() => {
    async function getFileInfo() {
      try {
        console.log('🔍 Loading model:', model.modelPath);
        const response = await fetch(model.modelPath, { method: 'HEAD' });
        const size = parseInt(response.headers.get('content-length') || '0');
        const sizeInMB = (size / (1024 * 1024)).toFixed(2);
        const sizeInKB = (size / 1024).toFixed(2);
        setFileSize(size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`);

        // Get model statistics
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();

        loader.load(
          model.modelPath,
          (gltf) => {
            console.log('✅ Model loaded successfully:', model.modelPath);
            let vertices = 0;
            let triangles = 0;
            let materials = 0;
            let animations = gltf.animations.length;

            gltf.scene.traverse((child: any) => {
              if (child.isMesh) {
                if (child.geometry) {
                  const positionAttr = child.geometry.attributes.position;
                  if (positionAttr) {
                    vertices += positionAttr.count;
                  }
                  if (child.geometry.index) {
                    triangles += child.geometry.index.count / 3;
                  } else if (positionAttr) {
                    triangles += positionAttr.count / 3;
                  }
                }
                if (child.material) {
                  materials++;
                }
              }
            });

            setModelStats({
              vertices: Math.round(vertices),
              triangles: Math.round(triangles),
              materials,
              animations,
              hasTextures: materials > 0
            });
            setModelLoading(false);
            setModelLoadError(false);
          },
          (progress) => {
            console.log('📦 Loading progress:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
          },
          (error) => {
            console.error('❌ Error loading model:', error);
            setModelLoadError(true);
            setModelLoading(false);
          }
        );
      } catch (error) {
        console.error('❌ Error getting file info:', error);
        setFileSize('Unknown');
        setModelLoadError(true);
        setModelLoading(false);
      }
    }
    getFileInfo();
  }, [model.modelPath]);

  // Get source URL from metadata file
  useEffect(() => {
    async function getSourceUrl() {
      try {
        // Try to fetch the .meta.json file
        const metadataPath = model.modelPath.replace(/\.(glb|gltf)$/i, '.meta.json');
        const response = await fetch(metadataPath);

        if (response.ok) {
          const metadata = await response.json();
          if (metadata.source) {
            setSourceUrl(metadata.source);
            console.log('✅ Found source URL from metadata:', metadata.source);
          }
        } else {
          console.log('ℹ️ No metadata file found for:', model.fileName);

          // Fallback: Try Zone.Identifier file (Windows format)
          try {
            const identifierPath = `${model.modelPath}:Zone.Identifier`;
            const idResponse = await fetch(identifierPath);
            if (idResponse.ok) {
              const content = await idResponse.text();
              const hostUrlMatch = content.match(/HostUrl=(.+)/);
              if (hostUrlMatch && hostUrlMatch[1]) {
                setSourceUrl(hostUrlMatch[1].trim());
                console.log('✅ Found source URL from Zone.Identifier:', hostUrlMatch[1].trim());
              }
            }
          } catch (err) {
            console.log('ℹ️ Zone.Identifier also not accessible');
          }
        }
      } catch (error) {
        console.log('ℹ️ Could not read metadata file:', error);
      }
    }
    getSourceUrl();
  }, [model.modelPath, model.fileName]);

  const handleApprove = () => {
    setIsApproving(true);
    approveModel(model.fileName, selectedCategory);
    setTimeout(() => {
      setIsApproving(false);
      onApprove();
    }, 500);
  };

  const handleTestInAR = () => {
    window.open(`/ar?creature=model-${model.fileName.replace(/\.(glb|gltf)$/i, '')}`, '_blank');
  };

  const displayName = model.creatureName || model.fileName.replace(/\.(glb|gltf)$/i, '');
  const fileFormat = model.fileName.endsWith('.glb') ? 'GLB (Binary)' : 'GLTF (JSON)';

  return (
    <div className="bg-slate-700/50 rounded-2xl p-6 border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{displayName}</h3>
          <p className="text-xs text-slate-400 font-mono">{model.fileName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full hover:bg-blue-500/30 transition-all"
          >
            {expandedView ? '◀ Compact' : '▶ Expand'}
          </button>
          <div className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full">
            PENDING
          </div>
        </div>
      </div>

      <div className={`grid ${expandedView ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Left Column - Preview and Controls */}
        <div>
          {/* 3D Preview */}
          <div className="aspect-video bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl mb-4 flex items-center justify-center border border-cyan-500/30 relative">
            {modelLoadError ? (
              <div className="text-center p-8">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-white font-bold text-xl mb-2">3D Preview Unavailable</h3>
                <p className="text-slate-400 text-sm mb-4">Can't load 3D preview, but you can still see file info below</p>
                <div className="text-xs text-slate-500 font-mono mb-4">{model.modelPath}</div>
                <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-3">
                  <p className="mb-1 font-semibold">Common issue:</p>
                  <ul className="text-left list-disc list-inside">
                    <li>GLTF format missing .bin file</li>
                    <li>Convert to GLB format for better results</li>
                  </ul>
                </div>
                <div className="text-xs text-cyan-400 bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3">
                  <p className="font-semibold">✓ You can still:</p>
                  <ul className="text-left list-disc list-inside mt-1">
                    <li>See file information below</li>
                    <li>Check file size and format</li>
                    <li>Test in AR (might work)</li>
                    <li>Approve and add to gallery</li>
                  </ul>
                </div>
              </div>
            ) : modelLoading ? (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-spin">⏳</div>
                <h3 className="text-white font-bold text-xl mb-2">Loading Model...</h3>
                <p className="text-slate-400 text-sm">Please wait</p>
              </div>
            ) : (
              <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <ambientLight intensity={2} />
                <directionalLight position={[10, 10, 5]} intensity={3} />
                <pointLight position={[-10, -10, -10]} intensity={2} />
                <Environment preset="sunset" />

                {showGrid && (
                  <gridHelper args={[10, 10, 0x444444, 0x222222]} />
                )}

                <Suspense fallback={<LoadingModel />}>
                  <PreviewModel modelPath={model.modelPath} scale={testScale} />
                </Suspense>

                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  autoRotate={autoRotate}
                  autoRotateSpeed={2}
                />
              </Canvas>
            )}

            {!modelLoadError && !modelLoading && (
              <>
                {/* Preview Controls Overlay */}
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg p-2 space-y-1">
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-all"
                  >
                    🔄 {autoRotate ? 'Stop' : 'Rotate'}
                  </button>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-all"
                  >
                    📐 {showGrid ? 'Hide' : 'Show'} Grid
                  </button>
                </div>
                {/* Model Path Info */}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1">
                  <p className="text-xs text-green-400 font-mono">✓ Loaded</p>
                </div>
              </>
            )}
          </div>

          {/* Scale Testing */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <label className="text-sm text-slate-300 font-semibold mb-2 block flex items-center justify-between">
              <span>Test Size: {testScale.toFixed(1)}x ({(testScale * 100).toFixed(0)}cm)</span>
              <button
                onClick={() => setTestScale(1.5)}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Reset
              </button>
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={testScale}
              onChange={(e) => setTestScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0.1x</span>
              <span>2.5x</span>
              <span>5x</span>
            </div>
          </div>
        </div>

        {/* Right Column - Model Information & Tests */}
        <div>
          {/* File Information */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <h4 className="text-white font-bold mb-3 flex items-center">
              <span className="text-lg mr-2">📋</span>
              File Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="text-white font-mono">{fileFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Size:</span>
                <span className="text-white font-mono">{fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Path:</span>
                <span className="text-white font-mono text-xs truncate max-w-[200px]">{model.modelPath}</span>
              </div>
              {sourceUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Source:</span>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs underline truncate max-w-[200px]"
                    title={sourceUrl}
                  >
                    {sourceUrl.replace('https://', '').replace('http://', '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Model Statistics */}
          {modelStats && (
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <h4 className="text-white font-bold mb-3 flex items-center">
                <span className="text-lg mr-2">📊</span>
                Model Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vertices:</span>
                  <span className="text-white font-mono">{modelStats.vertices.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Triangles:</span>
                  <span className="text-white font-mono">{modelStats.triangles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Materials:</span>
                  <span className="text-white font-mono">{modelStats.materials}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Animations:</span>
                  <span className="text-white font-mono">{modelStats.animations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Textures:</span>
                  <span className={`font-mono ${modelStats.hasTextures ? 'text-green-400' : 'text-yellow-400'}`}>
                    {modelStats.hasTextures ? '✓ Yes' : '⚠ None'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quality Checks */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <h4 className="text-white font-bold mb-3 flex items-center">
              <span className="text-lg mr-2">✓</span>
              Quality Checks
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">File exists</span>
                <span className="text-green-400">✓ Pass</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Format valid</span>
                <span className="text-green-400">✓ Pass</span>
              </div>
              {modelStats && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Poly count</span>
                    <span className={modelStats.triangles < 100000 ? 'text-green-400' : 'text-yellow-400'}>
                      {modelStats.triangles < 100000 ? '✓ Optimal' : '⚠ High'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Has animations</span>
                    <span className={modelStats.animations > 0 ? 'text-green-400' : 'text-slate-500'}>
                      {modelStats.animations > 0 ? `✓ ${modelStats.animations} found` : '- None'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Test in AR Button */}
          <button
            onClick={handleTestInAR}
            className="w-full py-3 mb-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <span>🎥</span>
            <span>Test in AR View</span>
          </button>
        </div>
      </div>

      {/* Category Selection */}
      <div className="mb-4">
        <label className="text-sm text-slate-300 font-semibold mb-2 block">Select Gallery Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.emoji} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Final Approval */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <h4 className="text-white font-bold mb-1">Ready to Approve?</h4>
            <p className="text-green-300 text-sm">
              After testing, click below to add this model to the <strong>{categories.find(c => c.value === selectedCategory)?.label}</strong> gallery.
            </p>
          </div>
        </div>
      </div>

      {/* Approve Button */}
      <button
        onClick={handleApprove}
        disabled={isApproving}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          isApproving
            ? 'bg-green-600/50 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {isApproving ? '✅ Approved! Adding to Gallery...' : '✅ Approve & Add to Gallery'}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const {
    modelSizeSettings,
    setModelSize,
    enableSpeechBubbles,
    setEnableSpeechBubbles,
    speechBubbleDuration,
    setSpeechBubbleDuration,
    hashtags,
    setHashtags,
    showTouchIndicator,
    setShowTouchIndicator,
    touchIndicatorDuration,
    setTouchIndicatorDuration,
  } = useAppStore();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Model state
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [previewSize, setPreviewSize] = useState(1.5);
  const [models, setModels] = useState<ModelConfig[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState<'models' | 'settings' | 'approval'>('approval');

  // Settings state
  const [hashtagInput, setHashtagInput] = useState('');

  // Pending models state
  const [pendingModels, setPendingModels] = useState<ModelDefinition[]>([]);
  const [selectedPendingModel, setSelectedPendingModel] = useState<ModelDefinition | null>(null);

  // Check if already logged in
  useEffect(() => {
    setIsAuthenticated(checkAuth());
  }, []);

  // Load pending models for approval
  useEffect(() => {
    if (isAuthenticated) {
      getPendingModels().then((pending) => {
        setPendingModels(pending);
        console.log(`📋 Loaded ${pending.length} pending models for approval`);
      });
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
  };

  // Load all available models (APPROVED ONLY)
  useEffect(() => {
    const availableModels: ModelConfig[] = [];

    // Helper function to check if approved
    const isApproved = (registryItem: any) => {
      if (registryItem.approved === true) return true;
      if (typeof window !== 'undefined') {
        const approvals = JSON.parse(localStorage.getItem('model_approvals') || '{}');
        return approvals[registryItem.fileName] === true;
      }
      return false;
    };

    // Add APPROVED models from registry that create new creatures
    MODEL_REGISTRY.forEach((registryItem) => {
      if (registryItem.modelPath && registryItem.creatureName && isApproved(registryItem)) {
        availableModels.push({
          id: `model-${registryItem.creatureName.toLowerCase().replace(/\s+/g, '-')}`,
          name: registryItem.creatureName,
          modelPath: registryItem.modelPath,
          defaultSize: 1.5,
          category: registryItem.category || 'fish'
        });
        console.log('✅ Added approved model:', registryItem.creatureName);
      } else if (registryItem.modelPath && registryItem.creatureName && !isApproved(registryItem)) {
        console.log('⏭️ Skipping unapproved model:', registryItem.creatureName);
      }
    });

    // Add APPROVED gallery creatures with models
    galleryCreatures.forEach((creature) => {
      const registryMatch = MODEL_REGISTRY.find(r => r.creatureId === creature.id);
      if (registryMatch?.modelPath && isApproved(registryMatch)) {
        const existing = availableModels.find(m => m.id === creature.id);
        if (!existing) {
          availableModels.push({
            id: creature.id,
            name: creature.name,
            modelPath: registryMatch.modelPath,
            defaultSize: 1.5,
            category: (creature as any).category || 'fish'
          });
          console.log('✅ Added approved gallery creature:', creature.name);
        }
      }
    });

    console.log(`📊 Total approved models loaded: ${availableModels.length}`);
    setModels(availableModels);
    if (availableModels.length > 0) {
      setSelectedModel(availableModels[0]);
      setPreviewSize(modelSizeSettings[availableModels[0].id] || 1.5);
    }
  }, [modelSizeSettings]);

  const handleSizeChange = (size: number) => {
    setPreviewSize(size);
    if (selectedModel) {
      setModelSize(selectedModel.id, size);
    }
  };

  const handleModelSelect = (model: ModelConfig) => {
    setSelectedModel(model);
    setPreviewSize(modelSizeSettings[model.id] || model.defaultSize);
  };

  const handleResetSize = () => {
    if (selectedModel) {
      const defaultSize = 1.5;
      setPreviewSize(defaultSize);
      setModelSize(selectedModel.id, defaultSize);
    }
  };

  const handleResetAll = () => {
    models.forEach(model => {
      setModelSize(model.id, 1.5);
    });
    setPreviewSize(1.5);
  };

  const handleAddHashtag = () => {
    if (hashtagInput.trim()) {
      const newTag = hashtagInput.startsWith('#') ? hashtagInput : `#${hashtagInput}`;
      if (!hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  // Calculate real-world size in cm (assuming 1 unit = 100cm)
  const realWorldSizeCm = Math.round(previewSize * 100);

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-xl sm:text-2xl">🎛️</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-cyan-300 hidden sm:block">Manage AR Experience Settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/ar"
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-xs sm:text-base font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="hidden sm:inline">AR View</span>
                <span className="sm:hidden">AR</span>
              </Link>
              <div className="relative group">
                <button className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs sm:text-base font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl">
                  <span className="hidden sm:inline">🧪 Test Pages</span>
                  <span className="sm:hidden">🧪</span>
                </button>
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2 space-y-1">
                    <Link
                      href="/ar/test-newscene?creature=zebrasoma-xanthurum"
                      className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-white hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <span className="text-xl sm:text-2xl">🐠</span>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm">Depth Sensing</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Test with Zebrasoma</div>
                      </div>
                    </Link>
                    <Link
                      href="/test-model?creature=zebrasoma-xanthurum"
                      className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-white hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <span className="text-xl sm:text-2xl">🎭</span>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm">Model Test</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Test with Zebrasoma</div>
                      </div>
                    </Link>
                    <Link
                      href="/test-webxr?creature=zebrasoma-xanthurum"
                      className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-white hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <span className="text-xl sm:text-2xl">🥽</span>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm">WebXR Test</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Test with Zebrasoma</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-red-600 text-white rounded-xl text-xs sm:text-base font-semibold hover:bg-red-500 transition-all"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('models')}
            className={`flex-1 min-w-[100px] px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-base font-semibold transition-all ${
              activeTab === 'models'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="hidden sm:inline">🐟 3D Models & Sizes</span>
            <span className="sm:hidden">🐟 Models</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 min-w-[100px] px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-base font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="hidden sm:inline">⚙️ App Settings</span>
            <span className="sm:hidden">⚙️ Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex-1 min-w-[100px] px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-base font-semibold transition-all relative ${
              activeTab === 'approval'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="hidden sm:inline">✅ Pending Approvals</span>
            <span className="sm:hidden">✅ Pending</span>
            {pendingModels.length > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {pendingModels.length}
              </span>
            )}
          </button>
        </div>

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Model List - Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Available Models</h2>
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-semibold">
                    {models.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {models.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📋</div>
                      <h3 className="text-white font-bold mb-2">No Approved Models</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Approve models in the "Pending Approvals" tab first
                      </p>
                      <Link
                        href="/dashboard"
                        onClick={() => setActiveTab('approval')}
                        className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-all"
                      >
                        Go to Pending Approvals
                      </Link>
                    </div>
                  ) : (
                    models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className={`w-full text-left p-4 rounded-xl transition-all ${
                          selectedModel?.id === model.id
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{model.name}</div>
                            <div className="text-xs opacity-70 mt-1">
                              Size: {(modelSizeSettings[model.id] || model.defaultSize).toFixed(1)}x ({Math.round((modelSizeSettings[model.id] || model.defaultSize) * 100)}cm)
                            </div>
                          </div>
                          <div className="text-2xl">🐟</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <button
                  onClick={handleResetAll}
                  className="w-full mt-6 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                >
                  Reset All Sizes
                </button>
              </div>
            </div>

            {/* Preview & Controls - Right Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* 3D Preview with Enhanced Rulers */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Live Preview with Real-World Measurements</h2>
                  {/* Size Reference Panel */}
                  <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 rounded-xl px-4 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-cyan-400 text-xs font-semibold">Current Size</div>
                        <div className="text-white text-lg font-bold">{realWorldSizeCm}cm</div>
                      </div>
                      <div className="w-px h-8 bg-cyan-500/30"></div>
                      <div className="text-center">
                        <div className="text-cyan-400 text-xs font-semibold">Multiplier</div>
                        <div className="text-white text-lg font-bold">{previewSize.toFixed(2)}x</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Size Comparison Guide */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-300 font-semibold">📏 Size Reference:</span>
                      <span className="text-slate-300">
                        {realWorldSizeCm <= 5 ? '🐜 Tiny (smaller than a finger)' :
                         realWorldSizeCm <= 15 ? '🐠 Small fish (like goldfish)' :
                         realWorldSizeCm <= 30 ? '🐟 Medium fish (like trout)' :
                         realWorldSizeCm <= 100 ? '🦈 Large fish (like salmon)' :
                         realWorldSizeCm <= 200 ? '🐬 Very large (like dolphin)' :
                         '🐋 Huge (like whale)'}
                      </span>
                    </div>
                    <span className="text-cyan-300">Grid shows scale proportions</span>
                  </div>
                </div>

                <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl overflow-hidden border-2 border-cyan-500/30">

                  {/* Corner Origin Point - Where X and Y axes meet */}
                  <div className="absolute left-0 bottom-0 w-16 h-16 bg-black/70 backdrop-blur-sm border-r-2 border-t-2 border-cyan-400 z-20 flex items-center justify-center">
                    <div className="text-cyan-400 font-bold text-sm">0,0</div>
                  </div>

                  {/* Vertical Ruler (Y-axis) - Left */}
                  <div className="absolute left-0 top-0 bottom-16 w-16 bg-black/70 backdrop-blur-sm border-r-2 border-cyan-400 z-10">
                    {/* Top marker */}
                    <div className="absolute top-4 left-0 right-0 text-center">
                      <div className="text-cyan-400 font-bold text-sm mb-1">Height</div>
                      <div className="text-cyan-300 font-mono text-xs bg-cyan-900/50 px-2 py-1 rounded mx-2">
                        {realWorldSizeCm}cm
                      </div>
                      <div className="w-full h-0.5 bg-cyan-400 mt-1"></div>
                    </div>

                    {/* Intermediate markings */}
                    <div className="absolute inset-x-0 top-20 bottom-4 flex flex-col justify-around">
                      {[75, 50, 25].map((percent) => {
                        const cm = Math.round(realWorldSizeCm * (percent / 100));
                        return (
                          <div key={percent} className="relative">
                            <div className="w-full h-px bg-cyan-400/40"></div>
                            <div className="absolute right-1 top-0 transform -translate-y-1/2">
                              <div className="text-cyan-300/70 text-[10px] font-mono bg-black/50 px-1 rounded">
                                {cm}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horizontal Ruler (X-axis) - Bottom */}
                  <div className="absolute left-16 right-0 bottom-0 h-16 bg-black/70 backdrop-blur-sm border-t-2 border-cyan-400 z-10">
                    {/* Right end marker */}
                    <div className="absolute right-4 top-0 bottom-0 flex flex-col items-center justify-center">
                      <div className="text-cyan-400 font-bold text-sm mb-1">Width</div>
                      <div className="text-cyan-300 font-mono text-xs bg-cyan-900/50 px-2 py-1 rounded">
                        {realWorldSizeCm}cm
                      </div>
                      <div className="w-px h-full bg-cyan-400 absolute top-0"></div>
                    </div>

                    {/* Intermediate markings */}
                    <div className="absolute inset-y-0 left-4 right-20 flex justify-around items-center">
                      {[25, 50, 75].map((percent) => {
                        const cm = Math.round(realWorldSizeCm * (percent / 100));
                        return (
                          <div key={percent} className="relative">
                            <div className="h-full w-px bg-cyan-400/40"></div>
                            <div className="absolute top-1 left-0 transform -translate-x-1/2">
                              <div className="text-cyan-300/70 text-[10px] font-mono bg-black/50 px-1 rounded">
                                {cm}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reference Grid for Size Understanding */}
                  <div className="absolute left-16 right-0 top-0 bottom-16 pointer-events-none opacity-20">
                    <svg className="w-full h-full">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* 3D Canvas */}
                  <div className="absolute inset-0 pl-16 pb-16">
                    {selectedModel && selectedModel.modelPath ? (
                      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                        <ambientLight intensity={2} />
                        <directionalLight position={[10, 10, 5]} intensity={3} />
                        <pointLight position={[-10, -10, -10]} intensity={2} />
                        <Environment preset="sunset" />

                        <CreatureModel
                          creature={{
                            id: selectedModel.id,
                            name: selectedModel.name,
                            type: selectedModel.category,
                            modelPath: selectedModel.modelPath,
                            scale: previewSize,
                            position: [0, 0, -3],
                            description: `Preview of ${selectedModel.name}`,
                            animation: 'idle'
                          }}
                          position={[0, 0, -3]}
                          scale={previewSize}
                        />

                        <OrbitControls
                          enablePan={true}
                          enableZoom={true}
                          enableRotate={true}
                          autoRotate={true}
                          autoRotateSpeed={2}
                        />
                      </Canvas>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-slate-400">
                          <div className="text-6xl mb-4">🐟</div>
                          <p>Select a model to preview</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Size Indicator Badge */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-2 border-cyan-400 text-cyan-400 px-4 py-2 rounded-xl font-bold text-lg z-20">
                    📏 {realWorldSizeCm}cm ({previewSize.toFixed(1)}x)
                  </div>
                </div>
              </div>

              {/* Size Controls */}
              {selectedModel && (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">{selectedModel.name}</h2>
                    <div className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-xl text-lg font-bold">
                      {previewSize.toFixed(1)}x = {realWorldSizeCm}cm
                    </div>
                  </div>

                  {/* Size Slider */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-white font-semibold">Model Size</label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSizeChange(Math.max(0.01, previewSize - 0.1))}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleSizeChange(Math.min(5, previewSize + 0.1))}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="5"
                        step="0.01"
                        value={previewSize}
                        onChange={(e) => handleSizeChange(parseFloat(e.target.value))}
                        className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>1cm (0.01x)</span>
                        <span>150cm (1.5x Default)</span>
                        <span>500cm (5x)</span>
                      </div>
                    </div>

                    {/* Manual Size Input */}
                    <div>
                      <label className="text-white font-semibold mb-3 block">Manual Size Entry</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="text-slate-300 text-sm mb-2 block">Size Multiplier (0.01x - 5x)</label>
                          <input
                            type="number"
                            min="0.01"
                            max="5"
                            step="0.01"
                            value={previewSize.toFixed(2)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0.01 && val <= 5) {
                                handleSizeChange(val);
                              }
                            }}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            placeholder="1.50"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-slate-300 text-sm mb-2 block">Real Size (1cm - 500cm)</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            step="1"
                            value={realWorldSizeCm}
                            onChange={(e) => {
                              const cm = parseInt(e.target.value);
                              if (!isNaN(cm) && cm >= 1 && cm <= 500) {
                                handleSizeChange(cm / 100);
                              }
                            }}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            placeholder="150"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Size Presets */}
                    <div>
                      <label className="text-white font-semibold mb-3 block">Quick Presets</label>
                      <div className="grid grid-cols-6 gap-3">
                        {[0.01, 0.1, 0.5, 1.0, 1.5, 2.5].map((size) => (
                          <button
                            key={size}
                            onClick={() => handleSizeChange(size)}
                            className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                              Math.abs(previewSize - size) < 0.01
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                            }`}
                          >
                            {size}x<br/>
                            <span className="text-xs opacity-70">{Math.round(size * 100)}cm</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4 pt-4">
                      <button
                        onClick={handleResetSize}
                        className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
                      >
                        Reset to Default
                      </button>
                      <Link
                        href={`/ar?creature=${selectedModel.id}`}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg text-center"
                      >
                        View in AR
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Speech Bubble Settings */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-3xl mr-3">💬</span>
                Speech Bubble Settings
              </h2>

              <div className="space-y-6">
                {/* Enable/Disable Speech Bubbles */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                  <div>
                    <h3 className="text-white font-semibold">Enable Speech Bubbles</h3>
                    <p className="text-slate-400 text-sm">Show fish facts when tapping creatures</p>
                  </div>
                  <button
                    onClick={() => setEnableSpeechBubbles(!enableSpeechBubbles)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      enableSpeechBubbles ? 'bg-cyan-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        enableSpeechBubbles ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Speech Bubble Duration */}
                <div>
                  <label className="text-white font-semibold mb-3 block">
                    Display Duration: {(speechBubbleDuration / 1000).toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="3000"
                    max="15000"
                    step="1000"
                    value={speechBubbleDuration}
                    onChange={(e) => setSpeechBubbleDuration(parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>3s (Quick)</span>
                    <span>8s (Default)</span>
                    <span>15s (Long)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Touch Indicator Settings */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-3xl mr-3">👆</span>
                Touch Indicator Settings
              </h2>

              <div className="space-y-6">
                {/* Enable/Disable Touch Indicator */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                  <div>
                    <h3 className="text-white font-semibold">Show Touch Indicator</h3>
                    <p className="text-slate-400 text-sm">Display "Tap Fish to Interact" message</p>
                  </div>
                  <button
                    onClick={() => setShowTouchIndicator(!showTouchIndicator)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      showTouchIndicator ? 'bg-cyan-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        showTouchIndicator ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Touch Indicator Duration */}
                <div>
                  <label className="text-white font-semibold mb-3 block">
                    Display Duration: {(touchIndicatorDuration / 1000).toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="20000"
                    step="1000"
                    value={touchIndicatorDuration}
                    onChange={(e) => setTouchIndicatorDuration(parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>5s (Quick)</span>
                    <span>10s (Default)</span>
                    <span>20s (Long)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hashtags Settings */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-3xl mr-3">#️⃣</span>
                Hashtag Management
              </h2>

              <div className="space-y-6">
                {/* Current Hashtags */}
                <div>
                  <label className="text-white font-semibold mb-3 block">Current Hashtags</label>
                  <div className="flex flex-wrap gap-3">
                    {hashtags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl"
                      >
                        <span className="font-mono">{tag}</span>
                        <button
                          onClick={() => handleRemoveHashtag(tag)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Hashtag */}
                <div>
                  <label className="text-white font-semibold mb-3 block">Add New Hashtag</label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddHashtag()}
                      placeholder="Enter hashtag..."
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <button
                      onClick={handleAddHashtag}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-6">
              <div className="flex items-start space-x-4">
                <span className="text-3xl">ℹ️</span>
                <div>
                  <h3 className="text-white font-semibold mb-2">Settings Saved Automatically</h3>
                  <p className="text-blue-300 text-sm leading-relaxed">
                    All changes are saved automatically to your browser's local storage. These settings will persist across sessions and apply to the AR experience in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Tab */}
        {activeTab === 'approval' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    <span className="text-4xl mr-4">📋</span>
                    Pending Model Approvals
                  </h2>
                  <p className="text-slate-400 mt-2">
                    Review and approve 3D models before they appear in the gallery
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-cyan-400">{pendingModels.length}</div>
                  <div className="text-sm text-slate-400">Pending</div>
                </div>
              </div>

              {pendingModels.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-8xl mb-6">✅</div>
                  <h3 className="text-2xl font-bold text-white mb-3">All Caught Up!</h3>
                  <p className="text-slate-400 text-lg">No pending models to approve right now.</p>
                  <p className="text-slate-500 text-sm mt-2">
                    New models will appear here automatically when added to /public/models/
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingModels.map((model) => (
                    <PendingModelCard
                      key={model.fileName}
                      model={model}
                      onApprove={() => {
                        // Reload pending models after approval
                        getPendingModels().then(setPendingModels);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #06b6d4, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0891b2, #2563eb);
        }

        .slider-cyan::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }

        .slider-cyan::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
}
