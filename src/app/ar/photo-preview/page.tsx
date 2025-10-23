'use client';

import { PhotoPreviewPanel } from '@/components/ui/PhotoPreviewPanel';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { photoService } from '@/services/PhotoCaptureService';

export default function PhotoPreviewPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for photo to be captured and saved
    const checkPhoto = async () => {
      // Initialize restoration from localStorage
      await photoService.blob.initRestore();
      await photoService.blob.waitForRestoration();

      // Poll for photo with timeout (max 3 seconds)
      const maxAttempts = 30; // 30 attempts * 100ms = 3 seconds
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (photoService.blob.hasBlob()) {
          // Photo is ready!
          setIsChecking(false);
          return;
        }

        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      // If still no photo after 3 seconds, redirect back
      console.warn('Photo not found after timeout, redirecting...');
      router.push('/ar');
    };

    checkPhoto();
  }, [router]);

  const handleClose = () => {
    // Clean up photo and go back to AR
    photoService.reset();
    router.push('/ar');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center space-y-6 px-4">
          {/* Animated Camera Icon */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative text-8xl animate-bounce">📸</div>
          </div>

          {/* Loading Text */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Loading Photo
            </h2>
            <p className="text-slate-300 text-lg">Preparing your AR capture...</p>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return <PhotoPreviewPanel onClose={handleClose} />;
}
