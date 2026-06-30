import type { Locale } from "./types";

export const LOCALES: Locale[] = ["en", "es", "br"];
export const DEFAULT_LOCALE: Locale = "en";

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
