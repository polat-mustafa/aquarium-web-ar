'use client';

import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Language } from '@/i18n/translations';

export const SettingsButton: React.FC = () => {
  const { language, setLanguage, theme, toggleTheme } = useSettings();
  const [showMenu, setShowMenu] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 bg-slate-800/90 dark:bg-slate-800/90 light:bg-white/90 hover:bg-slate-700/90 dark:hover:bg-slate-700/90 light:hover:bg-gray-100 backdrop-blur-sm border border-slate-600/50 dark:border-slate-600/50 light:border-gray-300 text-white dark:text-white light:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
        aria-label="Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">{currentLang.flag}</span>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Panel */}
          <div className="absolute right-0 mt-2 w-64 bg-slate-900/98 dark:bg-slate-900/98 light:bg-white/98 backdrop-blur-xl border border-slate-700/50 dark:border-slate-700/50 light:border-gray-300 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            {/* Theme Toggle */}
            <div className="p-4 border-b border-slate-700/50 dark:border-slate-700/50 light:border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white dark:text-white light:text-gray-900">Theme</span>
              </div>
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center justify-between bg-slate-800/50 dark:bg-slate-800/50 light:bg-gray-100 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-gray-200 px-4 py-3 rounded-xl transition-all duration-200"
              >
                <span className="text-sm font-medium text-white dark:text-white light:text-gray-900">
                  {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </span>
                <div className="w-12 h-6 bg-slate-700 dark:bg-slate-700 light:bg-gray-300 rounded-full relative transition-colors">
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-white light:bg-blue-500 rounded-full transition-transform duration-200 ${
                      theme === 'dark' ? 'left-1' : 'left-7'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Language Selection */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white dark:text-white light:text-gray-900">Language</span>
              </div>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      // Keep menu open so user can see the language change
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      language === lang.code
                        ? 'bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-600 border-2 border-blue-500/50'
                        : 'bg-slate-800/30 dark:bg-slate-800/30 light:bg-gray-100 text-white dark:text-white light:text-gray-700 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="flex-1 text-left">{lang.label}</span>
                    {language === lang.code && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
