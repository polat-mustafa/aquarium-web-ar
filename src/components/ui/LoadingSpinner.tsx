'use client';

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  theme?: 'ocean' | 'dark' | 'light';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading magical sea creatures...',
  size = 'large',
  theme = 'ocean',
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const themeClasses = {
    ocean: 'bg-gradient-to-b from-blue-400 to-blue-600',
    dark: 'bg-gray-800',
    light: 'bg-white',
  };

  const textColors = {
    ocean: 'text-white',
    dark: 'text-white',
    light: 'text-gray-800',
  };

  return (
    <div className={`
      flex flex-col items-center justify-center
      min-h-screen w-full
      ${themeClasses[theme]}
      ${textColors[theme]}
    `}>
      <div className="relative flex items-center justify-center">
        <div className={`
          ${sizeClasses[size]}
          rounded-full border-4 border-cyan-300
          animate-ping opacity-75
        `} />

        <div className={`
          absolute ${sizeClasses[size]}
          rounded-full border-4 border-teal-400
          animate-pulse
        `} />

        <div className={`
          absolute w-12 h-12
          rounded-full bg-gradient-to-r from-cyan-400 to-blue-500
          animate-spin
          shadow-lg
        `}>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center max-w-sm px-4">
        <h2 className="text-xl font-semibold mb-2">
          🐠 Aquarium
        </h2>
        <p className="text-sm opacity-90 animate-pulse">
          {message}
        </p>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className={`
              absolute w-4 h-4 bg-cyan-200 rounded-full opacity-30
              animate-bounce
            `}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-32 text-cyan-400 opacity-20"
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
    </div>
  );
};