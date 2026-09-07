import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  detectRequestLocale,
  getLocaleFromAcceptLanguage,
  getLocaleFromCountry,
  resolveRequestLocale,
} from "./localeDetection";

describe("locale detection", () => {
  it("maps Brazil, Spanish-speaking countries, and other countries", () => {
    assert.equal(getLocaleFromCountry("br"), "br");
    assert.equal(getLocaleFromCountry("AR"), "es");
    assert.equal(getLocaleFromCountry("mx"), "es");
    assert.equal(getLocaleFromCountry("US"), "en");
  });

  it("ignores missing and provider-specific unknown country codes", () => {
    assert.equal(getLocaleFromCountry(null), null);
    assert.equal(getLocaleFromCountry("XX"), null);
    assert.equal(getLocaleFromCountry("T1"), null);
  });

  it("uses the highest-priority supported browser language", () => {
    assert.equal(
      getLocaleFromAcceptLanguage("fr-FR, es-AR;q=0.9, en;q=0.8"),
      "es",
    );
    assert.equal(getLocaleFromAcceptLanguage("pt-BR, en;q=0.8"), "br");
    assert.equal(getLocaleFromAcceptLanguage("de-DE, en;q=0.7"), "en");
    assert.equal(getLocaleFromAcceptLanguage("pt-BR;q=0, es;q=0.8"), "es");
  });

  it("prefers geographic country over the browser language", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "BR",
      "accept-language": "es-AR,es;q=0.9",
    });

    assert.equal(detectRequestLocale(headers), "br");
  });

  it("supports common CDN and reverse-proxy country headers", () => {
    assert.equal(
      detectRequestLocale(new Headers({ "cf-ipcountry": "ES" })),
      "es",
    );
    assert.equal(
      detectRequestLocale(
        new Headers({ "cloudfront-viewer-country": "BR" }),
      ),
      "br",
    );
    assert.equal(
      detectRequestLocale(new Headers({ "x-country-code": "CA" })),
      "en",
    );
    assert.equal(
      detectRequestLocale(
        new Headers({
          "x-vercel-ip-country": "XX",
          "cf-ipcountry": "AR",
        }),
      ),
      "es",
    );
  });

  it("lets a valid saved manual preference override automatic detection", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "BR",
      "accept-language": "pt-BR",
    });

    assert.equal(resolveRequestLocale("es", headers), "es");
    assert.equal(resolveRequestLocale("invalid", headers), "br");
  });

  it("falls back to English when no usable signal exists", () => {
    assert.equal(detectRequestLocale(new Headers()), "en");
    assert.equal(
      detectRequestLocale(
        new Headers({ "cf-ipcountry": "XX", "accept-language": "fr-FR" }),
      ),
      "en",
    );
  });
});
