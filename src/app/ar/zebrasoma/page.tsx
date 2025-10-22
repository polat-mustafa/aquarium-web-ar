'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ZebrasomaARPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main AR page with zebrasoma parameter
    router.replace('/ar?creature=zebrasoma');
  }, [router]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-6xl mb-4 animate-pulse">🐠</div>
        <h2 className="text-2xl font-bold">Loading Zebrasoma AR Experience...</h2>
      </div>
    </div>
  );
}
