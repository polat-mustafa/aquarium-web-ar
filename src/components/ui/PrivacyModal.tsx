'use client';

import { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface PrivacyModalProps {
  onAccept: () => void;
  onDecline: () => void;
  show: boolean;
}

export function PrivacyModal({ onAccept, onDecline, show }: PrivacyModalProps) {
  const { t } = useSettings();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={`bg-gradient-to-br from-slate-900 to-blue-900 border-2 border-cyan-500/30 rounded-2xl max-w-lg w-full shadow-2xl transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.privacyTitle}</h2>
              <p className="text-sm text-cyan-300">KVKK / GDPR Compliance</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0">📸</span>
              <p className="text-white text-sm leading-relaxed">{t.privacyMessage}</p>
            </div>
          </div>

          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0">✅</span>
              <p className="text-white text-sm leading-relaxed">{t.privacyKVKK}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onDecline}
            className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-500/50 text-white py-3 px-6 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
          >
            {t.privacyDecline}
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            {t.privacyAccept}
          </button>
        </div>
      </div>
    </div>
  );
}
