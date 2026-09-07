import type { Locale } from "./types";
import { DEFAULT_LOCALE, isLocale } from "./routing";

const GEO_COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-geo-country",
  "x-country-code",
  "x-country",
] as const;

const SPANISH_SPEAKING_COUNTRIES = new Set([
  "AR",
  "BO",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "ES",
  "GQ",
  "GT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PE",
  "PR",
  "PY",
  "SV",
  "UY",
  "VE",
]);

const UNKNOWN_COUNTRY_CODES = new Set(["A1", "A2", "O1", "T1", "XX"]);

type HeaderReader = Pick<Headers, "get">;

export function getCountryCode(headers: HeaderReader): string | null {
  for (const headerName of GEO_COUNTRY_HEADERS) {
    const countryCode = headers.get(headerName)?.trim().toUpperCase();
    if (countryCode && getLocaleFromCountry(countryCode)) return countryCode;
  }

  return null;
}

export function getLocaleFromCountry(countryCode: string | null): Locale | null {
  const normalizedCountry = countryCode?.trim().toUpperCase();
  if (
    !normalizedCountry ||
    UNKNOWN_COUNTRY_CODES.has(normalizedCountry) ||
    !/^[A-Z]{2}$/.test(normalizedCountry)
  ) {
    return null;
  }

  if (normalizedCountry === "BR") return "br";
  if (SPANISH_SPEAKING_COUNTRIES.has(normalizedCountry)) return "es";
  return "en";
}

function getLocaleFromLanguageTag(languageTag: string): Locale | null {
  const baseLanguage = languageTag.trim().toLowerCase().split(/[-_]/)[0];

  if (baseLanguage === "pt") return "br";
  if (baseLanguage === "es") return "es";
  if (baseLanguage === "en") return "en";
  return null;
}

export function getLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
): Locale | null {
  if (!acceptLanguage) return null;

  const preferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [languageTag, ...parameters] = entry.trim().split(";");
      let quality = 1;

      for (const parameter of parameters) {
        const [name, rawValue] = parameter.trim().split("=");
        if (name?.toLowerCase() !== "q") continue;

        const parsedQuality = Number(rawValue);
        quality = Number.isFinite(parsedQuality) ? parsedQuality : 0;
      }

      return { languageTag, quality, index };
    })
    .filter(({ languageTag, quality }) => Boolean(languageTag) && quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const { languageTag } of preferences) {
    const locale = getLocaleFromLanguageTag(languageTag);
    if (locale) return locale;
  }

  return null;
}

export function detectRequestLocale(headers: HeaderReader): Locale {
  const countryLocale = getLocaleFromCountry(getCountryCode(headers));
  if (countryLocale) return countryLocale;

  return (
    getLocaleFromAcceptLanguage(headers.get("accept-language")) ?? DEFAULT_LOCALE
  );
}

export function resolveRequestLocale(
  savedPreference: string | null | undefined,
  headers: HeaderReader,
): Locale {
  return isLocale(savedPreference) ? savedPreference : detectRequestLocale(headers);
}
