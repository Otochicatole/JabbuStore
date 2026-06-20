"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import type { Locale, TranslationParams } from "./types";

const dictionaries = { en, es } as const;
const STORAGE_KEY = "jabbustore-locale";
const DEFAULT_LOCALE: Locale = "en";

type DictionaryKey = keyof typeof en;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictionaryKey | string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(value: string, params?: TranslationParams) {
  if (!params) return value;
  return Object.entries(params).reduce(
    (message, [key, replacement]) =>
      message.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "es";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: DictionaryKey | string, params?: TranslationParams) => {
      const dictionary = dictionaries[locale] as Record<string, string>;
      const fallback = dictionaries.en as Record<string, string>;
      return interpolate(dictionary[key] ?? fallback[key] ?? key, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

