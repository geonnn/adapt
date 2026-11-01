import { useState, useEffect, useCallback } from 'react';

/**
 * A resilient localStorage hook that safely handles JSON serialization,
 * private browsing mode, storage quota errors, and cross-tab/storage events.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] {
  // Read value safely from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }

    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((current) => {
          const valueToStore =
            typeof value === 'function'
              ? (value as (val: T) => T)(current)
              : value;

          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (err) {
              console.warn(`Error writing to localStorage key "${key}":`, err);
            }
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error updating state for key "${key}":`, error);
      }
    },
    [key]
  );

  // Sync state if localStorage changes in another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (err) {
          console.warn(`Error parsing updated storage event for "${key}":`, err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
