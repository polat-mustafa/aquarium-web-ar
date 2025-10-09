'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, translations } from '@/i18n/translations';

/**
 * Theme types: light (blue shades) or dark (black shades)
 */
export type Theme = 'light' | 'dark';

/**
 * Settings Context Interface
 * Following Interface Segregation Principle (ISP)
 */
interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: typeof translations.en;
}

/**
 * Default Settings Configuration
 * Single Responsibility Principle (SRP) - Centralized configuration
 */
const DEFAULT_SETTINGS = {
  language: 'en' as Language,
  theme: 'light' as Theme,
} as const;

/**
 * Storage Keys Configuration
 * Open/Closed Principle (OCP) - Easy to extend with new storage keys
 */
const STORAGE_KEYS = {
  language: 'language',
  theme: 'theme',
} as const;

/**
 * Settings Context
 */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Local Storage Service
 * Single Responsibility Principle (SRP) - Handles all localStorage operations
 */
class LocalStorageService {
  static get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? (item as T) : defaultValue;
    } catch (error) {
      console.warn(`Failed to read ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  static set(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to write ${key} to localStorage:`, error);
    }
  }
}

/**
 * Theme Manager Service
 * Single Responsibility Principle (SRP) - Handles all theme-related operations
 */
class ThemeManager {
  static apply(theme: Theme): void {
    if (typeof document === 'undefined') return;

    // Remove all theme classes
    document.documentElement.classList.remove('light', 'dark');

    // Add new theme class
    document.documentElement.classList.add(theme);
  }

  static toggle(currentTheme: Theme): Theme {
    return currentTheme === 'light' ? 'dark' : 'light';
  }
}

/**
 * Language Validator
 * Single Responsibility Principle (SRP) - Validates language codes
 */
class LanguageValidator {
  private static readonly VALID_LANGUAGES: Language[] = ['en', 'tr', 'pl'];

  static isValid(language: string): language is Language {
    return this.VALID_LANGUAGES.includes(language as Language);
  }
}

/**
 * Settings Provider Component
 * Dependency Inversion Principle (DIP) - Depends on abstractions (services)
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_SETTINGS.language);
  const [theme, setThemeState] = useState<Theme>(DEFAULT_SETTINGS.theme);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Initialize settings from localStorage on mount
   */
  useEffect(() => {
    setIsMounted(true);

    const savedLanguage = LocalStorageService.get(STORAGE_KEYS.language, DEFAULT_SETTINGS.language);
    const savedTheme = LocalStorageService.get(STORAGE_KEYS.theme, DEFAULT_SETTINGS.theme);

    // Validate and apply saved language
    if (LanguageValidator.isValid(savedLanguage)) {
      setLanguageState(savedLanguage);
    }

    // Validate and apply saved theme
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme);
      ThemeManager.apply(savedTheme);
    } else {
      ThemeManager.apply(DEFAULT_SETTINGS.theme);
    }
  }, []);

  /**
   * Apply theme changes immediately to DOM
   */
  useEffect(() => {
    if (isMounted) {
      ThemeManager.apply(theme);
    }
  }, [theme, isMounted]);

  /**
   * Update language with persistence
   */
  const setLanguage = (lang: Language) => {
    if (lang !== language) {
      setLanguageState(lang);
      LocalStorageService.set(STORAGE_KEYS.language, lang);
    }
  };

  /**
   * Update theme with persistence
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    LocalStorageService.set(STORAGE_KEYS.theme, newTheme);
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    const newTheme = ThemeManager.toggle(theme);
    setTheme(newTheme);
  };

  /**
   * Context value with all settings and actions
   * Using useMemo to ensure it updates when language/theme changes
   */
  const contextValue: SettingsContextType = useMemo(() => ({
    language,
    setLanguage,
    theme,
    setTheme,
    toggleTheme,
    t: translations[language],
  }), [language, theme]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Custom hook to access settings context
 * Throws error if used outside provider (fail-fast principle)
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }

  return context;
}
