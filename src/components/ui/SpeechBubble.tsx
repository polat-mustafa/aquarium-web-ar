'use client';

import React, { useEffect, useState } from 'react';
import type { FishFact } from '@/utils/fishFacts';

interface SpeechBubbleProps {
  fact: FishFact;
  language: 'en' | 'tr' | 'pl';
  onLanguageChange: (lang: 'en' | 'tr' | 'pl') => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  fact,
  language,
  onClose,
  position
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const bubbleStyle = position
    ? {
        position: 'fixed' as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }
    : {};

  return (
    <div
      className={`speech-cloud-container transition-all duration-500 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}
      style={bubbleStyle}
    >
      {/* Fun Cloud Shape */}
      <div className="relative max-w-xs">
        {/* Main Cloud Body */}
        <div className="relative bg-white rounded-[60px] p-6 shadow-2xl">
          {/* Close Button - Smaller and fun */}
          <button
            onClick={handleClose}
            className="absolute -top-1 -right-1 w-7 h-7 bg-red-400 hover:bg-red-500 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg z-10"
            aria-label="Close"
          >
            <span className="text-white text-lg font-bold leading-none">×</span>
          </button>

          {/* Cloud Bumps - Top */}
          <div className="absolute -top-5 left-[25%] w-16 h-16 bg-white rounded-full shadow-lg"></div>
          <div className="absolute -top-8 left-[45%] w-20 h-20 bg-white rounded-full shadow-lg"></div>
          <div className="absolute -top-5 right-[20%] w-14 h-14 bg-white rounded-full shadow-lg"></div>

          {/* Cloud Bumps - Sides */}
          <div className="absolute top-[20%] -left-4 w-12 h-12 bg-white rounded-full shadow-lg"></div>
          <div className="absolute top-[20%] -right-4 w-12 h-12 bg-white rounded-full shadow-lg"></div>

          {/* Fact Text with Fun Font */}
          <div className="relative z-10 text-center px-2">
            <p className="text-xl font-bold leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
               style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              {fact[language]}
            </p>
          </div>

          {/* Sparkles */}
          <div className="absolute -top-2 left-[15%] text-2xl animate-bounce">✨</div>
          <div className="absolute -top-3 right-[15%] text-xl animate-pulse">⭐</div>
          <div className="absolute bottom-2 left-3 text-lg animate-bounce" style={{ animationDelay: '0.3s' }}>💫</div>
        </div>

        {/* Speech Cloud Tail - Multiple Circles */}
        <div className="absolute bottom-0 left-[20%] transform translate-y-full">
          <div className="w-8 h-8 bg-white rounded-full shadow-lg -mb-2 ml-2"></div>
          <div className="w-5 h-5 bg-white rounded-full shadow-lg -mb-1 ml-4"></div>
          <div className="w-3 h-3 bg-white rounded-full shadow-lg ml-6"></div>
        </div>
      </div>

      <style jsx>{`
        .speech-cloud-container {
          z-index: 1000;
          pointer-events: auto;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(1deg);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-2deg);
          }
          75% {
            transform: rotate(2deg);
          }
        }

        .speech-cloud-container {
          animation: float 3s ease-in-out infinite, wiggle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
