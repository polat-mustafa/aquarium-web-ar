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

const languageFlags = {
  en: '🇺🇸',
  tr: '🇹🇷',
  pl: '🇵🇱'
};

const languageNames = {
  en: 'English',
  tr: 'Türkçe',
  pl: 'Polski'
};

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  fact,
  language,
  onLanguageChange,
  onClose,
  position
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState(language);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'tr' | 'pl') => {
    setCurrentLang(lang);
    onLanguageChange(lang);
  };

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
      className={`speech-bubble-container transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
      style={bubbleStyle}
    >
      {/* Main Bubble */}
      <div className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 rounded-3xl p-6 shadow-2xl border-4 border-white/30 backdrop-blur-xl max-w-sm">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Language Selector */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          {(['en', 'tr', 'pl'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentLang === lang
                  ? 'bg-white text-blue-600 shadow-lg scale-110'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={languageNames[lang]}
            >
              <span className="text-base">{languageFlags[lang]}</span>
            </button>
          ))}
        </div>

        {/* Fact Text */}
        <div className="text-white text-center">
          <p className="text-lg font-semibold leading-relaxed drop-shadow-lg">
            {fact[currentLang]}
          </p>
        </div>

        {/* Speech Bubble Tail */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-blue-600" />
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-cyan-300 rounded-full animate-bounce" />
      </div>

      <style jsx>{`
        .speech-bubble-container {
          z-index: 1000;
          pointer-events: auto;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .speech-bubble-container:hover {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
