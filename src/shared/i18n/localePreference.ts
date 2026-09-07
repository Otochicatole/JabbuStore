import type { Locale } from "./types";
import {
  isLocale,
  LOCALE_PREFERENCE_COOKIE,
  LOCALE_PREFERENCE_MAX_AGE,
} from "./routing";

const LEGACY_LOCALE_STORAGE_KEY = "jabbustore-locale";

export function readLocalePreference(): Locale | null {
  if (typeof document === "undefined") return null;

  const prefix = `${LOCALE_PREFERENCE_COOKIE}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) return null;

  try {
    const value = decodeURIComponent(cookie.slice(prefix.length));
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveLocalePreference(locale: Locale) {
  if (typeof document === "undefined") return;

  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_PREFERENCE_COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=${LOCALE_PREFERENCE_MAX_AGE}; SameSite=Lax${secureAttribute}`;
}

export function migrateLegacyLocalePreference(): Locale | null {
  if (typeof window === "undefined" || readLocalePreference()) return null;

  let storedLocale: string | null = null;
  try {
    storedLocale = window.localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }

  // The old provider wrote its default "en" value for every visitor, so only
  // "es" proves that the user actively changed the language in that version.
  if (storedLocale !== "es") return null;

  saveLocalePreference(storedLocale);
  try {
    window.localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
  } catch {
    // The cookie is already persisted; storage cleanup is best-effort only.
  }

  return storedLocale;
}
