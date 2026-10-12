import React, { createContext, useContext, useState, useEffect } from 'react';
import { type UserSettings } from '../types';

const defaultSettings: UserSettings = {
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  compactMode: false,
  soundEnabled: true,
  uiVolume: 0.5,
};

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('eveo_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

useEffect(() => {
    localStorage.setItem('eveo_settings', JSON.stringify(settings));
    
    // Apply functional classes to the document root based on settings
    const root = document.documentElement;
    
    if (settings.highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    
    if (settings.reducedMotion) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
    
    if (settings.compactMode) root.classList.add('compact-ui');
    else root.classList.remove('compact-ui');
    
  }, [settings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};