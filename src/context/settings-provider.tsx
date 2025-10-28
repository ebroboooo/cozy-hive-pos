
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Settings } from '@/lib/types';
import { defaultSettings } from '@/lib/placeholder-data';
import { translations } from '@/lib/translations';

type Language = 'en' | 'ar';
type TranslationKey = keyof (typeof translations)['en'];

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('app-settings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        localStorage.setItem('app-settings', JSON.stringify(defaultSettings));
      }
    } catch (error) {
      console.error("Failed to read settings from localStorage", error);
    }
    setIsMounted(true);
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem('app-settings', JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save settings to localStorage", error);
      }
      return updated;
    });
  };

  const t = useCallback((key: TranslationKey): string => {
    const lang: Language = settings.enableArabic ? 'ar' : 'en';
    return translations[lang][key] || key;
  }, [settings.enableArabic]);

  if (!isMounted) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function useTranslation() {
    const { t } = useSettings();
    return { t };
}
