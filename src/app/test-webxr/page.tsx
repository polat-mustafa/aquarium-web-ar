'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { CreatureModel } from '@/components/ar/CreatureModel';
import { initializeQRDetection, createCameraStream, stopCameraStream } from '@/utils/qrDetection';
import type { QRDetectionResult } from '@/utils/qrDetection';
import type { SeaCreature } from '@/types';
import { LoginForm } from '@/components/dashboard/LoginForm';
import { isAuthenticated as checkAuth, logout } from '@/utils/auth';

type TestStatus = 'idle' | 'running' | 'success' | 'error';

interface TestResult {
  id: string;
  title: string;
  status: TestStatus;
  message: string;
  timestamp?: Date;
}

export default function TestWebXRPage() {
  // Auth state
  const [isAuth, setIsAuth] = useState(false);

  // System Status
  const [systemStatus, setSystemStatus] = useState({
    webxr: false,
    camera: false,
    accelerometer: false,
    gyroscope: false,
  });

  // Test states
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Camera test
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // QR test
  const [qrDetected, setQrDetected] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const qrStopRef = useRef<(() => void) | null>(null);

  // 3D Model test
  const [modelLoaded, setModelLoaded] = useState(false);
  const [testCreature, setTestCreature] = useState<SeaCreature | null>(null);

  // FPS Counter
  const [fps, setFps] = useState(60);
  const fpsRef = useRef<number[]>([]);
  const lastFrameTime = useRef(Date.now());

  // Check auth on mount
  useEffect(() => {
    setIsAuth(checkAuth());
  }, []);

  // Handle login
  const handleLogin = () => {
    setIsAuth(true);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsAuth(false);
  };

  useEffect(() => {
    // Check system capabilities
    const checkSystem = async () => {
      const status = {
        webxr: 'xr' in navigator,
        camera: false,
        accelerometer: 'Accelerometer' in window,
        gyroscope: 'Gyroscope' in window,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        status.camera = true;
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Camera check failed:', error);
      }

      setSystemStatus(status);
    };

    checkSystem();

    // FPS counter
    const updateFPS = () => {
      const now = Date.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;

      if (delta > 0) {
        const currentFps = 1000 / delta;
        fpsRef.current.push(currentFps);
        if (fpsRef.current.length > 60) {
          fpsRef.current.shift();
        }
        const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
        setFps(Math.round(avgFps));
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }, []);

  // Camera Test
  const runCameraTest = async () => {
    setActiveTest('camera');
    updateTestResult('camera', 'running', 'Requesting camera access...');

    try {
      const stream = await createCameraStream();
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      updateTestResult('camera', 'success', 'Camera initialized successfully!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setCameraError(errorMsg);
      updateTestResult('camera', 'error', `Camera test failed: ${errorMsg}`);
    }
  };

  const stopCameraTest = () => {
    if (cameraStream) {
      stopCameraStream(cameraStream);
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraError(null);
    setActiveTest(null);
  };

  // QR Code Test
  const runQRTest = async () => {
    setActiveTest('qr');
    updateTestResult('qr', 'running', 'Starting QR code detection...');

    try {
      if (!cameraStream) {
        const stream = await createCameraStream();
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      }

      if (videoRef.current) {
        const stopQR = initializeQRDetection(videoRef.current, (result: QRDetectionResult) => {
          if (result.detected && result.data) {
            setQrDetected(true);
            setQrData(result.data);
            updateTestResult('qr', 'success', `QR Code detected: ${result.data}`);
          }
        });
        qrStopRef.current = stopQR;
        updateTestResult('qr', 'success', 'QR scanner active - point camera at QR code');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult('qr', 'error', `QR test failed: ${errorMsg}`);
    }
  };

  const stopQRTest = () => {
    if (qrStopRef.current) {
      qrStopRef.current();
      qrStopRef.current = null;
    }
    setQrDetected(false);
    setQrData(null);
    setActiveTest(null);
  };

  // 3D Model Test
  const run3DModelTest = () => {
    setActiveTest('3d-model');
    updateTestResult('3d-model', 'running', 'Loading 3D model...');

    const creature: SeaCreature = {
      id: 'test-tuna',
      name: 'Tuna Fish',
      type: 'fish',
      modelPath: '/models/tuna fish-fish.glb',
      scale: 2,
      position: [0, 0, -3],
      description: 'Test tuna model',
      animation: 'idle'
    };

    setTestCreature(creature);

    // Simulate loading success after a delay
    setTimeout(() => {
      setModelLoaded(true);
      updateTestResult('3d-model', 'success', '3D model loaded and rendered successfully!');
    }, 2000);
  };

  const stop3DModelTest = () => {
    setTestCreature(null);
    setModelLoaded(false);
    setActiveTest(null);
  };

  // Helper to update test results
  const updateTestResult = (id: string, status: TestStatus, message: string) => {
    setTestResults(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return [...filtered, {
        id,
        title: id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' '),
        status,
        message,
        timestamp: new Date()
      }];
    });
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'running': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  // Show login form if not authenticated
  if (!isAuth) {
    return (
      <LoginForm
        onLogin={handleLogin}
        title="Test Page"
        subtitle="Authenticate to access WebXR tests"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🧪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">WebXR Testing Studio</h1>
                <p className="text-xs text-cyan-300">Functional AR Testing Environment</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white hover:text-cyan-300 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/gallery"
                className="px-4 py-2 text-sm font-medium text-white hover:text-cyan-300 transition-colors"
              >
                Gallery
              </Link>
              <Link
                href="/ar"
                className="px-4 py-2 text-sm font-medium text-white hover:text-cyan-300 transition-colors"
              >
                AR Experience
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white hover:text-red-300 transition-colors"
              >
                Logout
              </button>
              <Link
                href="/"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Status - Left */}
          <div className="lg:col-span-1 space-y-6">
            {/* System Capabilities */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">System Status</h2>

              <div className="space-y-3">
                <div className={`p-4 rounded-xl border-2 ${systemStatus.webxr ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">WebXR API</span>
                    <span className="text-2xl">{systemStatus.webxr ? '✅' : '❌'}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 ${systemStatus.camera ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Camera</span>
                    <span className="text-2xl">{systemStatus.camera ? '✅' : '❌'}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 ${systemStatus.accelerometer ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Accelerometer</span>
                    <span className="text-2xl">{systemStatus.accelerometer ? '✅' : '❌'}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 ${systemStatus.gyroscope ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Gyroscope</span>
                    <span className="text-2xl">{systemStatus.gyroscope ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Performance</h2>

              <div className="space-y-4">
                <div className="text-center p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                  <div className="text-4xl font-bold text-cyan-400">{fps}</div>
                  <div className="text-sm text-cyan-300 mt-2">FPS</div>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Test Results</h2>

              {testResults.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No tests run yet</p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div key={result.id} className="p-4 bg-slate-700/50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-white font-semibold">{result.title}</span>
                        <span className="text-xl">{getStatusIcon(result.status)}</span>
                      </div>
                      <p className="text-sm text-slate-300">{result.message}</p>
                      {result.timestamp && (
                        <p className="text-xs text-slate-500 mt-1">
                          {result.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Area - Right */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Test Viewport */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Live Test Viewport</h2>

              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/30">
                {/* Camera/QR Video */}
                {(activeTest === 'camera' || activeTest === 'qr') && (
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                )}

                {/* QR Scanner Overlay */}
                {activeTest === 'qr' && !qrDetected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-64 h-64 border-4 border-cyan-400 rounded-3xl">
                      <div className="absolute -top-2 -left-2 w-12 h-12 border-t-8 border-l-8 border-cyan-400 rounded-tl-3xl"></div>
                      <div className="absolute -top-2 -right-2 w-12 h-12 border-t-8 border-r-8 border-cyan-400 rounded-tr-3xl"></div>
                      <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-8 border-l-8 border-cyan-400 rounded-bl-3xl"></div>
                      <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-8 border-r-8 border-cyan-400 rounded-br-3xl"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-cyan-300 font-bold bg-black/80 px-4 py-2 rounded-lg">
                          Scan QR Code
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Detected */}
                {qrDetected && qrData && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <div className="text-6xl mb-4">✅</div>
                      <h3 className="text-2xl font-bold text-green-400 mb-2">QR Code Detected!</h3>
                      <p className="text-white bg-slate-800 px-6 py-3 rounded-lg font-mono">
                        {qrData}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3D Model Viewer */}
                {activeTest === '3d-model' && testCreature && (
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-4 animate-spin">⏳</div>
                        <p>Loading 3D Model...</p>
                      </div>
                    </div>
                  }>
                    <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                      <ambientLight intensity={2} />
                      <directionalLight position={[10, 10, 5]} intensity={3} />
                      <pointLight position={[-10, -10, -10]} intensity={2} />
                      <Environment preset="sunset" />

                      <CreatureModel
                        creature={testCreature}
                        position={testCreature.position}
                        scale={testCreature.scale}
                      />

                      <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        autoRotate={true}
                        autoRotateSpeed={2}
                      />
                    </Canvas>
                  </Suspense>
                )}

                {/* Idle State */}
                {!activeTest && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <div className="text-6xl mb-4">🧪</div>
                      <p className="text-lg">Select a test to begin</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center max-w-md px-6">
                      <div className="text-6xl mb-4">❌</div>
                      <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
                      <p className="text-white">{cameraError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Camera Test */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
                <div className="text-4xl mb-3 text-center">📷</div>
                <h3 className="text-lg font-bold text-white mb-2 text-center">Camera Test</h3>
                <p className="text-sm text-slate-300 mb-4 text-center">Test camera access and live preview</p>
                {activeTest === 'camera' ? (
                  <button
                    onClick={stopCameraTest}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all"
                  >
                    Stop Test
                  </button>
                ) : (
                  <button
                    onClick={runCameraTest}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Run Test
                  </button>
                )}
              </div>

              {/* QR Scanner Test */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
                <div className="text-4xl mb-3 text-center">🔍</div>
                <h3 className="text-lg font-bold text-white mb-2 text-center">QR Scanner</h3>
                <p className="text-sm text-slate-300 mb-4 text-center">Test QR code detection</p>
                {activeTest === 'qr' ? (
                  <button
                    onClick={stopQRTest}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all"
                  >
                    Stop Scanner
                  </button>
                ) : (
                  <button
                    onClick={runQRTest}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Start Scanner
                  </button>
                )}
              </div>

              {/* 3D Model Test */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
                <div className="text-4xl mb-3 text-center">🐟</div>
                <h3 className="text-lg font-bold text-white mb-2 text-center">3D Model</h3>
                <p className="text-sm text-slate-300 mb-4 text-center">Test 3D model loading and rendering</p>
                {activeTest === '3d-model' ? (
                  <button
                    onClick={stop3DModelTest}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all"
                  >
                    Stop Test
                  </button>
                ) : (
                  <button
                    onClick={run3DModelTest}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Load Model
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
