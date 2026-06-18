import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('hgs_lang');
      return (saved as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hgs_lang', language);
    } catch (err) {
      console.warn('Failed to persist language preference', err);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Custom event to notify any outside observers
    window.dispatchEvent(new CustomEvent('hgs_language_change', { detail: lang }));
  };

  const t = (key: string): string => {
    const langDict = translations[language];
    if (langDict && key in langDict) {
      return (langDict as any)[key];
    }
    // Fallback to English lookup if key missing in current language
    const enDict = translations['en'];
    if (enDict && key in enDict) {
      return (enDict as any)[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
