"use client";

import { useParams } from "next/navigation";

import { DEFAULT_LOCALE, isLocale, withLocalePath } from "./routing";

export function useLocalizedPath() {
  const params = useParams<{ language?: string }>();
  const locale = isLocale(params?.language) ? params.language : DEFAULT_LOCALE;

  return (pathname: string) => withLocalePath(pathname, locale);
}
