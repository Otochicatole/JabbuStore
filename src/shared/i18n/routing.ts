import type { Locale } from "./types";

export const LOCALES: Locale[] = ["en", "es", "br"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_PREFERENCE_COOKIE = "jabbustore_locale";
export const LOCALE_PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;
export const LOCALE_REQUEST_HEADER = "x-jabbustore-locale";
export const LANGUAGE_TAG_BY_LOCALE: Record<Locale, string> = {
  en: "en",
  es: "es",
  br: "pt-BR",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "es" || value === "br";
}

export function getLocaleFromPathname(pathname: string | null | undefined): Locale | null {
  if (!pathname) return null;
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isLocale(firstSegment) ? firstSegment : null;
}

export function stripLocaleFromPathname(pathname: string | null | undefined) {
  if (!pathname) return "/";
  const parts = pathname.split("/");
  const firstSegment = parts[1];
  if (!isLocale(firstSegment)) return pathname || "/";
  const nextPath = `/${parts.slice(2).join("/")}`;
  return nextPath === "/" ? "/" : nextPath.replace(/\/$/, "");
}

export function withLocalePath(pathname: string, locale: Locale) {
  const cleanPathname = stripLocaleFromPathname(pathname);
  return cleanPathname === "/" ? `/${locale}` : `/${locale}${cleanPathname}`;
}
