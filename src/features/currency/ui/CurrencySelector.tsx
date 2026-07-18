"use client";

import { CircleAlert } from "lucide-react";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { DISPLAY_CURRENCIES, type DisplayCurrency } from "../domain/currency";
import { useCurrency } from "../context/CurrencyContext";

export function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { selectedCurrency, setCurrency, ready, saving, conversionUnavailable } = useCurrency();

  return (
    <div className="flex items-center gap-2" title={conversionUnavailable ? t("currency.unavailable") : t("currency.label")}>
      {!compact && <span className="text-[10px] font-black uppercase text-white/45">{t("currency.label")}</span>}
      <AdminSelect
        ariaLabel={t("currency.label")}
        value={selectedCurrency}
        disabled={!ready || saving}
        options={DISPLAY_CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
        onChange={(value) => void setCurrency(value as DisplayCurrency).catch(() => undefined)}
        className={compact ? "w-[68px]" : "w-[92px]"}
        buttonClassName="flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-[4px] border border-white/10 bg-transparent px-2.5 text-[10px] font-black text-white outline-none transition-colors hover:border-accent/50 focus:border-accent"
        menuClassName="absolute right-0 top-full z-40 mt-2 min-w-[92px] overflow-hidden rounded-[4px] border border-white/10 bg-card shadow-2xl backdrop-blur-xl"
        optionClassName="w-full px-3 py-2 text-left text-[10px] font-black uppercase transition-colors"
      />
      {conversionUnavailable && <CircleAlert className="h-3.5 w-3.5 text-amber-400" />}
    </div>
  );
}
