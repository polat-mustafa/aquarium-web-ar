'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { showGlobalLoading, hideGlobalLoading } from '@/components/ui/LoadingOverlay';
import { useSettings } from '@/contexts/SettingsContext';
import { SettingsButton } from '@/components/ui/SettingsButton';

interface Bubble {
  left: number;
  top: number;
  animationDelay: number;
  animationDuration: number;
}

export default function Home() {
  const { t } = useSettings();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  useEffect(() => {
    const newBubbles = [...Array(20)].map((_, index) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: index * 0.2,
      animationDuration: 3 + Math.random() * 2,
    }));
    setBubbles(newBubbles);
  }, []);

  // Hide global loading when home page loads
  useEffect(() => {
    hideGlobalLoading();
  }, []);

  const handleNavigation = (href: string, buttonId: string, message: string = 'Loading...') => {
    setLoadingButton(buttonId);
    showGlobalLoading(message);
    setTimeout(() => {
      window.location.href = href;
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 via-blue-600 to-blue-800 relative">
      {/* Professional Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/60 to-transparent backdrop-blur-xl">
        <div className="px-6 py-4 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-xl">🌊</span>
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl blur opacity-20"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Aquarium
                </h1>
                <p className="text-xs text-cyan-300 font-medium">WebAR Experience</p>
              </div>
            </div>

            {/* Navigation Menu - Hidden on small screens */}
            <div className="hidden sm:flex items-center space-x-2">
              <SettingsButton />
              <Link
                href="/gallery"
                className="bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all hover:from-slate-700/90 hover:to-slate-600/90 hover:scale-105"
              >
                {t.gallery}
              </Link>
              <Link
                href="/ar"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:from-cyan-600 hover:to-blue-700 hover:scale-105"
              >
                {t.startAR}
              </Link>
            </div>
            {/* Mobile Settings Button */}
            <div className="sm:hidden">
              <SettingsButton />
            </div>
          </div>
        </div>
      </header>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {bubbles.map((bubble, index) => (
          <div
            key={index}
            className="absolute w-4 h-4 bg-cyan-200 rounded-full opacity-30 animate-bounce"
            style={{
              left: `${bubble.left}%`,
              top: `${bubble.top}%`,
              animationDelay: `${bubble.animationDelay}s`,
              animationDuration: `${bubble.animationDuration}s`,
            }}
          />
        ))}
      </div>

      {/* Mobile Only Layout - Professional Compact Buttons */}
      <main className="relative z-10 pt-24 pb-16 block lg:hidden">
        <div className="min-h-screen flex flex-col justify-center items-center px-4">
          {/* Mobile Hero */}
          <div className="text-center mb-12 space-y-4 px-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Aquarium
            </h1>
            <p className="text-lg text-white/90 font-light">WebAR Experience</p>
            <p className="text-sm text-white/70 max-w-xs mx-auto">
              Bring the magic of the ocean to life in augmented reality
            </p>
          </div>

          {/* Compact Professional Buttons */}
          <div className="space-y-3 w-full max-w-xs mx-auto">
            <button
              onClick={() => handleNavigation('/ar', 'ar-mobile', 'Starting AR Experience...')}
              disabled={loadingButton === 'ar-mobile'}
              className={`w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl text-base shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-between touch-manipulation ${
                loadingButton === 'ar-mobile' ? 'opacity-75' : ''
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {loadingButton === 'ar-mobile' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <span>{loadingButton === 'ar-mobile' ? t.loading : t.search}</span>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => handleNavigation('/gallery', 'gallery-mobile', 'Loading Gallery...')}
              disabled={loadingButton === 'gallery-mobile'}
              className={`w-full bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-xl text-base active:scale-[0.98] transition-all duration-200 flex items-center justify-between touch-manipulation ${
                loadingButton === 'gallery-mobile' ? 'opacity-75' : ''
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-white/40 rounded-lg flex items-center justify-center">
                  {loadingButton === 'gallery-mobile' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <span>{loadingButton === 'gallery-mobile' ? t.loading : t.gallery}</span>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

          </div>

          {/* Professional Mobile Features */}
          <div className="mt-12 space-y-3 px-6 max-w-xs mx-auto">
            <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">No App Required</h3>
                <p className="text-white/70 text-xs">Works directly in your browser</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">Record & Share</h3>
                <p className="text-white/70 text-xs">Capture magical moments</p>
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="mt-16 text-center px-6">
            <p className="text-white/50 text-xs">#aquarium #WebAR</p>
          </div>
        </div>
      </main>

      {/* Desktop Layout - Keeps Everything Original */}
      <main className="relative z-10 pt-24 pb-16 hidden lg:block">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col justify-center text-center text-white mb-16">
            <div className="mb-12">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                🌊 Aquarium
              </h1>
              <h2 className="text-xl md:text-3xl lg:text-4xl font-light mb-8 text-cyan-200">
                WebAR Experience
              </h2>
              <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
                Bring the magic of the ocean to life! Scan QR codes near exhibits
                to interact with amazing sea creatures in augmented reality.
              </p>
            </div>

            {/* Scroll Down Button */}
            <button
              onClick={() => {
                // Simple reliable scroll - just scroll down 500px
                const currentY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                const scrollTo = currentY + 500;

                // Try multiple scroll methods
                try {
                  window.scrollTo({ top: scrollTo, behavior: 'smooth' });
                } catch (e) {
                  // Fallback for older browsers
                  window.scrollTo(0, scrollTo);
                }
              }}
              onTouchStart={() => {}}
              className="mx-auto mt-12 bg-white/20 active:bg-white/30 backdrop-blur-sm border border-white/40 text-white p-4 rounded-full transition-all duration-200 active:scale-105 animate-bounce shadow-lg touch-manipulation select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Scroll down to explore"
              type="button"
            >
              <svg className="w-8 h-8 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </section>

          {/* Main Content */}
          <section id="main-content" className="text-white">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-center items-center mb-12 px-4">
              <Link
                href="/ar"
                className="group relative bg-white text-blue-700 font-bold py-4 px-8 lg:py-5 lg:px-10 rounded-2xl text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-blue-700">Start AR Experience</span>
                </div>
              </Link>

              <Link
                href="/gallery"
                className="group relative border-2 border-white text-white font-bold py-4 px-8 lg:py-5 lg:px-10 rounded-2xl text-base lg:text-lg hover:bg-white hover:text-blue-600 transition-all duration-200 overflow-hidden w-full sm:w-auto"
              >
                <div className="relative flex items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-current rounded-full flex items-center justify-center text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  View Gallery
                </div>
              </Link>

              <Link
                href="/qr-codes/print-sheet.html"
                target="_blank"
                className="group relative bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 lg:py-5 lg:px-10 rounded-2xl text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden w-full sm:w-auto"
              >
                <div className="relative flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  QR Codes
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto px-4">
              <div className="group bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-opacity-25 transition-all duration-300 transform hover:scale-105 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">No App Required</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Works directly in your browser. Just scan and explore!
                </p>
              </div>

              <div className="group bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-opacity-25 transition-all duration-300 transform hover:scale-105 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Record & Share</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Capture magical moments and share them with friends!
                </p>
              </div>

              <div className="group bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-opacity-25 transition-all duration-300 transform hover:scale-105 border border-white/20 sm:col-span-2 lg:col-span-1">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V5a1 1 0 00-1-1zM9 9l6 6m0-6l-6 6" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  Interactive Creatures
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Touch to trigger special animations and behaviors!
                </p>
              </div>
            </div>

            {/* How to Get Started */}
            <div className="mt-20 max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-10 text-center bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                How to Get Started
              </h3>
              <div className="grid gap-6 md:gap-8">
                <div className="flex items-start gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                    1
                  </span>
                  <p className="text-lg leading-relaxed">Find a QR code near any aquarium exhibit</p>
                </div>
                <div className="flex items-start gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                    2
                  </span>
                  <p className="text-lg leading-relaxed">Allow camera access when prompted</p>
                </div>
                <div className="flex items-start gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                    3
                  </span>
                  <p className="text-lg leading-relaxed">Watch as sea creatures come to life in your space!</p>
                </div>
                <div className="flex items-start gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                    4
                  </span>
                  <p className="text-lg leading-relaxed">
                    Tap creatures for special animations and record videos to share
                  </p>
                </div>
              </div>
            </div>

            {/* Social Footer */}
            <footer className="mt-32 text-center border-t border-white/20 pt-12">
              <div className="flex justify-center items-center space-x-8 mb-8">
                <a
                  href="https://github.com/polat-mustafa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-gradient-to-r from-gray-700 to-gray-900 p-4 rounded-full hover:scale-110 transition-all duration-300 shadow-lg"
                  aria-label="Visit GitHub"
                >
                  <svg className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a
                  href="https://polat-mustafa.github.io/portfolio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-gradient-to-r from-blue-500 to-cyan-600 p-4 rounded-full hover:scale-110 transition-all duration-300 shadow-lg"
                  aria-label="Visit portfolio website"
                >
                  <svg className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m0 0a9 9 0 009-9"/>
                  </svg>
                </a>
              </div>
              <div className="space-y-2 text-cyan-200">
                <p className="text-lg font-semibold">#aquarium #WebAR #OceanMagic</p>
              </div>
            </footer>
          </section>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          <svg
            className="absolute bottom-0 w-full h-32 text-blue-900 opacity-30"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              fill="currentColor"
              className="animate-pulse"
            />
          </svg>
        </div>
      </main>
    </div>
  );
}
