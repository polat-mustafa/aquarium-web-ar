'use client';

import { PhotoPreviewPanel } from '@/components/ui/PhotoPreviewPanel';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { photoService } from '@/services/PhotoCaptureService';

export default function PhotoPreviewPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's a captured photo
    if (!photoService.blob.hasBlob()) {
      // No photo available, redirect back to AR page
      router.push('/ar');
    }
  }, [router]);

  const handleClose = () => {
    // Clean up photo and go back to AR
    photoService.reset();
    router.push('/ar');
  };

  return <PhotoPreviewPanel onClose={handleClose} />;
}
