import { useState, useEffect, useCallback } from 'react';
import type { Language } from '../types';
import { translations, getTranslation, type TranslationSchema } from '../i18n/translations';

const LANG_STORAGE_KEY = 'adaPT_lang';

export interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyPath: string) => string;
  translations: TranslationSchema;
}

export function useLanguage(): UseLanguageReturn {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === 'es' || stored === 'en') {
        return stored;
      }
    } catch (e) {
      console.warn('Unable to read initial language from localStorage', e);
    }
    return 'es';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
      document.documentElement.setAttribute('lang', language);
    } catch (e) {
      console.warn('Unable to persist language to localStorage', e);
    }
  }, [language]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'es' ? 'en' : 'es'));
  }, []);

  const t = useCallback(
    (keyPath: string) => {
      return getTranslation(language, keyPath);
    },
    [language]
  );

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    translations: translations[language],
  };
}
