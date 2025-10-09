'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { galleryCreatures } from '@/utils/galleryData';
import { hideGlobalLoading } from '@/components/ui/LoadingOverlay';

function QRCodePageContent() {
  const searchParams = useSearchParams();
  const [selectedCreature, setSelectedCreature] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Hide global loading when QR page loads
  useEffect(() => {
    hideGlobalLoading();
  }, []);

  useEffect(() => {
    const creatureId = searchParams.get('creature');
    if (creatureId) {
      const creature = galleryCreatures.find(c => c.id === creatureId);
      if (creature) {
        setSelectedCreature(creature);
        // Generate the AR URL
        const baseUrl = window.location.origin;
        const arUrl = `${baseUrl}/ar?creature=${creature.id}`;

        // Generate QR code using qrcode library
        import('qrcode').then(QRCode => {
          QRCode.toDataURL(arUrl, {
            width: 400,
            margin: 2,
            color: {
              dark: '#1e293b',
              light: '#ffffff'
            }
          }).then(url => {
            setQrCodeUrl(url);
          });
        });
      }
    }
  }, [searchParams]);

  if (!selectedCreature) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🌊</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            QR Code Generator
          </h1>
          <p className="text-slate-600 mb-6">
            Select a creature from the gallery to generate its QR code
          </p>
          <Link
            href="/gallery"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Go to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 p-4 print:p-0 print:bg-white">
      {/* Print-optimized Layout */}
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 print:shadow-none print:rounded-none">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 p-6 print:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🌊</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Aquarium
                  </h1>
                  <p className="text-blue-100 font-medium">
                    WebAR Experience
                  </p>
                </div>
              </div>
              <div className="text-right text-white print:hidden">
                <button
                  onClick={() => window.print()}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                >
                  Print QR Code
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* QR Code Section */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl mb-4 print:bg-white print:border-2 print:border-gray-300">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt={`QR Code for ${selectedCreature.name}`}
                      className="mx-auto w-64 h-64 print:w-48 print:h-48"
                    />
                  ) : (
                    <div className="w-64 h-64 print:w-48 print:h-48 mx-auto bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
                      <span className="text-gray-400">Loading QR...</span>
                    </div>
                  )}
                </div>

                {/* QR Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm">📱</span>
                    </div>
                    <h3 className="font-bold text-blue-800 print:text-gray-800">
                      How to Use
                    </h3>
                  </div>
                  <p className="text-blue-700 text-sm print:text-gray-700">
                    Open your camera app and point it at this QR code to experience AR magic!
                  </p>
                </div>
              </div>

              {/* Creature Information */}
              <div className="space-y-6">
                {/* Creature Display */}
                <div className="text-center mb-6">
                  <div className="text-8xl mb-4 print:text-6xl">{selectedCreature.emoji}</div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2 print:text-2xl">
                    {selectedCreature.name}
                  </h2>
                  <div className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold print:bg-gray-600">
                    {selectedCreature.category.charAt(0).toUpperCase() + selectedCreature.category.slice(1)}
                  </div>
                </div>

                {/* Hashtags */}
                <div className="bg-gray-50 rounded-xl p-4 print:bg-gray-100">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                    <span className="text-lg mr-2">#️⃣</span>
                    Social Media Hashtags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCreature.hashtags.map((hashtag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium print:bg-gray-200 print:text-gray-800"
                      >
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AR Features */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4 print:bg-gray-50 print:border-gray-300">
                  <h3 className="font-bold text-cyan-800 mb-3 print:text-gray-800">
                    ✨ AR Features
                  </h3>
                  <ul className="space-y-2 text-sm text-cyan-700 print:text-gray-700">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 print:bg-gray-400"></span>
                      Interactive 3D animations
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 print:bg-gray-400"></span>
                      Record AR videos
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 print:bg-gray-400"></span>
                      Share on social media
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 print:bg-gray-400"></span>
                      Educational information
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="bg-white rounded-2xl shadow-xl p-6 print:shadow-none print:rounded-none print:border-t-2 print:border-gray-300">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">🌐</div>
              <h4 className="font-bold text-slate-800 mb-1">Visit Portfolio</h4>
              <p className="text-sm text-slate-600">polat-mustafa.github.io/portfolio</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📍</div>
              <h4 className="font-bold text-slate-800 mb-1">Visit Us</h4>
              <p className="text-sm text-slate-600">Aquarium</p>
            </div>
            <div>
              <div className="text-2xl mb-2">💻</div>
              <h4 className="font-bold text-slate-800 mb-1">GitHub</h4>
              <p className="text-sm text-slate-600">@polat-mustafa</p>
            </div>
          </div>

          {/* Bottom branding */}
          <div className="border-t border-gray-200 mt-6 pt-4 text-center">
            <p className="text-xs text-gray-500">
              WebAR Experience • #aquarium #OceanMagic
            </p>
          </div>
        </div>

        {/* Print-only URL */}
        <div className="hidden print:block mt-4 text-center">
          <p className="text-sm text-gray-600">
            Scan QR code or visit: {typeof window !== 'undefined' ? `${window.location.origin}/ar?creature=${selectedCreature.id}` : ''}
          </p>
        </div>
      </div>

      {/* Navigation (hidden in print) */}
      <div className="fixed bottom-6 right-6 print:hidden">
        <div className="flex space-x-3">
          <Link
            href="/gallery"
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 p-3 rounded-full shadow-lg transition-all hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link
            href={`/ar?creature=${selectedCreature.id}`}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QRCodePage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold">Loading QR Code</h2>
        </div>
      </div>
    }>
      <QRCodePageContent />
    </Suspense>
  );
}