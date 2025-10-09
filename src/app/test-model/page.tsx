'use client';

import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

function Model() {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Starting to load model...');
    const loader = new GLTFLoader();

    loader.load(
      '/models/tuna%20fish-fish.glb',
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
  }, []);

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

export default function TestModelPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={5} />
        <directionalLight position={[10, 10, 5]} intensity={5} />
        <pointLight position={[-10, -10, -10]} intensity={2} />

        <Model />

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
        <h1 style={{ margin: '0 0 10px 0' }}>3D Model Test</h1>
        <p style={{ margin: '5px 0' }}>🟡 Yellow cube = Loading (6MB file)</p>
        <p style={{ margin: '5px 0' }}>🔴 Red cube = Error</p>
        <p style={{ margin: '5px 0' }}>🐟 Fish model = Success!</p>
        <p style={{ margin: '15px 0 5px 0', fontWeight: 'bold' }}>Open console (F12) to see loading progress</p>
      </div>
    </div>
  );
}
