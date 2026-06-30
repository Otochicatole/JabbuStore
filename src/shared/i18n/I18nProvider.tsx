"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { br } from "./dictionaries/br";
import type { Locale, TranslationParams } from "./types";
import { DEFAULT_LOCALE, isLocale } from "./routing";

const dictionaries = { en, es, br } as const;

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

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale | string | null;
}) {
  const normalizedInitialLocale = isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE;
  const locale = normalizedInitialLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    void nextLocale;
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
