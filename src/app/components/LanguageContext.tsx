'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dictionaries } from '@/lib/dictionaries';

type Language = 'en' | 'es' | 'fr' | 'ar' | 'zh' | 'ru' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  isRTL: boolean;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check for saved preference
    const saved = localStorage.getItem('trade-language') as Language;
    if (saved && dictionaries[saved]) {
      setLanguageState(saved);
    } else {
      // 2. Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (dictionaries[browserLang]) {
        setLanguageState(browserLang);
      }
    }
    setIsReady(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('trade-language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (path: string) => {
    const keys = path.split('.');
    let result = dictionaries[language];
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        // Fallback to English if missing
        let fallback = dictionaries['en'];
        for (const fKey of keys) {
          if (fallback && fallback[fKey]) {
            fallback = fallback[fKey];
          } else {
            return path; // Return key if totally missing
          }
        }
        return fallback;
      }
    }
    return result;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, isReady }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={!isReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
