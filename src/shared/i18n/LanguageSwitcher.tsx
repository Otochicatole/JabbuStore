"use client";

import { useI18n } from "./I18nProvider";
import type { Locale } from "./types";

const LOCALES: Locale[] = ["en", "es"];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`flex items-center gap-1 w-fit rounded-full border border-white/10 bg-white/[0.02] p-1 ${
        compact ? "" : "min-w-fit"
      }`}
      aria-label={t("language.label")}
    >
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            locale === item
              ? "bg-accent text-white shadow-[0_0_14px_rgba(217,70,239,0.25)]"
              : "text-white/40 hover:text-white"
          }`}
        >
          {t(`language.${item}`)}
        </button>
      ))}
    </div>
  );
}

