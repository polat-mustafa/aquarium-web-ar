'use client';

import { PhotoPreviewPanel } from '@/components/ui/PhotoPreviewPanel';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { photoService } from '@/services/PhotoCaptureService';

export default function PhotoPreviewPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for photo restoration from localStorage
    const checkPhoto = async () => {
      await photoService.blob.waitForRestoration();

      if (!photoService.blob.hasBlob()) {
        // No photo available, redirect back to AR page
        router.push('/ar');
      } else {
        setIsChecking(false);
      }
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
        <div className="text-white text-center space-y-4">
          <div className="text-6xl animate-pulse">📸</div>
          <p className="text-lg">Loading photo...</p>
        </div>
      </div>
    );
  }

  return <PhotoPreviewPanel onClose={handleClose} />;
}
