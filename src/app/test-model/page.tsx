'use client';

import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import * as THREE from 'three';
import { MODEL_REGISTRY } from '@/utils/modelMatcher';

function Model({ modelPath }: { modelPath: string }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Starting to load model:', modelPath);
    const loader = new GLTFLoader();
    setLoading(true);
    setError(null);

    loader.load(
      modelPath,
      (gltf) => {
        console.log('✅ Model loaded successfully!', gltf);
        setModel(gltf.scene);
        setLoading(false);
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading: ${percent.toFixed(2)}%`);
      },
      (err) => {
        console.error('❌ Error loading model:', err);
        setError(err.message);
        setLoading(false);
      }
    );
  }, [modelPath]);

  if (loading) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} />
      </mesh>
    );
  }

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  if (model) {
    return <primitive object={model} scale={2} position={[0, 0, 0]} />;
  }

  return null;
}

function TestModelContent() {
  const searchParams = useSearchParams();
  const creatureParam = searchParams.get('creature');
  const [modelPath, setModelPath] = useState<string>('/models/tuna%20fish-fish.glb');
  const [creatureName, setCreatureName] = useState<string>('Tuna Fish');

  useEffect(() => {
    if (creatureParam) {
      // Find model from registry
      const modelEntry = MODEL_REGISTRY.find(
        m => m.fileName.toLowerCase().includes(creatureParam.toLowerCase()) ||
             m.creatureName?.toLowerCase().includes(creatureParam.toLowerCase())
      );

      if (modelEntry && modelEntry.modelPath) {
        setModelPath(modelEntry.modelPath);
        setCreatureName(modelEntry.creatureName || creatureParam);
        console.log('🐟 Loading creature:', modelEntry.creatureName, 'from', modelEntry.modelPath);
      }
    }
  }, [creatureParam]);

  return (
    <>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={5} />
        <directionalLight position={[10, 10, 5]} intensity={5} />
        <pointLight position={[-10, -10, -10]} intensity={2} />

        <Model modelPath={modelPath} />

        <OrbitControls />
      </Canvas>

      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '400px'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>3D Model Test: {creatureName}</h1>
        <p style={{ margin: '5px 0' }}>🟡 Yellow cube = Loading</p>
        <p style={{ margin: '5px 0' }}>🔴 Red cube = Error</p>
        <p style={{ margin: '5px 0' }}>🐟 Fish model = Success!</p>
        <p style={{ margin: '15px 0 5px 0', fontWeight: 'bold' }}>Open console (F12) to see loading progress</p>
      </div>
    </>
  );
}

export default function TestModelPage() {
  return (
    <Suspense fallback={
      <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '24px' }}>Loading...</div>
      </div>
    }>
      <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
        <TestModelContent />
      </div>
    </Suspense>
  );
}
