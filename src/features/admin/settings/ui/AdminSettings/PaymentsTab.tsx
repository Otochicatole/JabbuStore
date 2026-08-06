"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { SectionHeader, ToggleSwitch, SaveButton } from "./FormControls";
import { SettingsState } from "./index";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { BACKEND_URL } from "@/shared/lib/api";
import { Loader2 } from "lucide-react";

interface PaymentsTabProps {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  saving: boolean;
  saved: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

interface RateInfo {
  value: number;
  updatedAt: string;
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PaymentsTab({
  settings,
  setSettings,
  saving,
  saved,
  onSubmit,
}: PaymentsTabProps) {
  const { t } = useI18n();
  const [rates, setRates] = useState<{
    blue: RateInfo | null;
    oficial: RateInfo | null;
    cripto: RateInfo | null;
  }>({ blue: null, oficial: null, cripto: null });
  const [ratesLoading, setRatesLoading] = useState(true);

  const rateOptions = [
    { value: "blue", label: t("admin.settings.rateKind.blue") },
    { value: "oficial", label: t("admin.settings.rateKind.oficial") },
    { value: "cripto", label: t("admin.settings.rateKind.cripto") },
  ];

  useEffect(() => {
    fetch(`${BACKEND_URL}/currency-conversion/all-rates`)
      .then((r) => r.json())
      .then((data) => {
        setRates({
          blue: data.blue ?? null,
          oficial: data.oficial ?? null,
          cripto: data.cripto ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, []);

  return (
    <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
      <SectionHeader
        title={t("admin.settings.paymentsTitle")}
        desc={t("admin.settings.paymentsTitleDesc")}
      />
      <form onSubmit={onSubmit} className="space-y-5 max-w-xl">
        <div className="space-y-4">
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
            <ToggleSwitch
              checked={settings.mercadoPagoEnabled}
              onChange={(v) =>
                setSettings((prev: SettingsState) => ({ ...prev, mercadoPagoEnabled: v }))
              }
              label={t("admin.settings.enableMercadoPago")}
            />
            <p className="text-[10px] text-[#84849b] mt-2 font-mono">
              {t("admin.settings.mercadoPagoHelp")}
            </p>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
            <ToggleSwitch
              checked={settings.paypalEnabled}
              onChange={(v) =>
                setSettings((prev: SettingsState) => ({ ...prev, paypalEnabled: v }))
              }
              label={t("admin.settings.enablePaypal")}
            />
            <p className="text-[10px] text-[#84849b] mt-2 font-mono">
              {t("admin.settings.paypalHelp")}
            </p>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px]">
            <ToggleSwitch
              checked={settings.nowpaymentsEnabled}
              onChange={(v) =>
                setSettings((prev: SettingsState) => ({ ...prev, nowpaymentsEnabled: v }))
              }
              label={t("admin.settings.enableNowpayments")}
            />
            <p className="text-[10px] text-[#84849b] mt-2 font-mono">
              {t("admin.settings.nowpaymentsHelp")}
            </p>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px] space-y-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {t("admin.settings.currencyConversionTitle")}
              </h3>
              <p className="text-[10px] text-[#84849b] mt-1 font-mono leading-relaxed">
                {t("admin.settings.currencyConversionHelp")}
              </p>
            </div>
            <AdminSelect
              value={settings.usdArsRateKind}
              onChange={(value) =>
                setSettings((prev: SettingsState) => ({
                  ...prev,
                  usdArsRateKind: value as SettingsState["usdArsRateKind"],
                }))
              }
              options={rateOptions}
              className="w-full"
              buttonClassName="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white focus:outline-none focus:border-accent/50 transition-colors flex items-center justify-between gap-2 cursor-pointer font-medium"
              menuClassName="absolute left-0 top-full mt-2 w-full bg-[#110f1e] border border-white/10 rounded-[3px] overflow-hidden shadow-2xl z-40 backdrop-blur-xl"
              optionClassName="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            />
            <p className="text-[10px] text-[#84849b] font-mono">
              {t("admin.settings.currencyConversionActive") || "Tasa activa:"}{" "}
              <span className="text-accent font-bold">{t(`admin.settings.rateKind.${settings.usdArsRateKind}`)}</span>
            </p>

            {ratesLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#84849b]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Cargando cotizaciones...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(["blue", "oficial", "cripto"] as const).map((kind) => (
                  <div
                    key={kind}
                    className={`p-2 rounded-[3px] border text-center ${
                      settings.usdArsRateKind === kind
                        ? "border-accent/30 bg-accent/10"
                        : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-wider text-[#84849b] block">
                      {t(`admin.settings.rateKind.${kind}`)}
                    </span>
                    <span className="text-[11px] font-black text-white font-mono block mt-0.5">
                      {rates[kind] ? formatArs(rates[kind]!.value) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SaveButton
          saving={saving}
          saved={saved}
          label={t("admin.settings.savePayments")}
        />
      </form>
    </div>
  );
}
