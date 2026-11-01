import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types';

const THEME_STORAGE_KEY = 'adaPT_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
    } catch (e) {
      console.warn('Unable to read initial theme from localStorage', e);
    }
    return 'dark';
  });

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === 'undefined') return;

    // Apply data-theme attribute to <html> element
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.style.colorScheme = newTheme;

    // Synchronize meta color-scheme
    let metaTag = document.querySelector('meta[name="color-scheme"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'color-scheme');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', newTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
