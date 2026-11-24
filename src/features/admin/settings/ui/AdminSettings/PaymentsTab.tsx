"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminSection } from "@/features/admin/ui/AdminShell";
import { SectionHeader, ToggleSwitch, SaveButton } from "./FormControls";
import { SettingsState } from "./index";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { BACKEND_URL } from "@/shared/lib/api";

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
    <AdminSection>
      <SectionHeader
        title={t("admin.settings.paymentsTitle")}
        desc={t("admin.settings.paymentsTitleDesc")}
      />
      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        <div className="rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
          <ToggleSwitch
            checked={settings.mercadoPagoEnabled}
            onChange={(v) =>
              setSettings((prev: SettingsState) => ({ ...prev, mercadoPagoEnabled: v }))
            }
            label={t("admin.settings.enableMercadoPago")}
          />
          <p className="mt-2 text-xs text-[#9e98b6]">{t("admin.settings.mercadoPagoHelp")}</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
          <ToggleSwitch
            checked={settings.paypalEnabled}
            onChange={(v) =>
              setSettings((prev: SettingsState) => ({ ...prev, paypalEnabled: v }))
            }
            label={t("admin.settings.enablePaypal")}
          />
          <p className="mt-2 text-xs text-[#9e98b6]">{t("admin.settings.paypalHelp")}</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
          <ToggleSwitch
            checked={settings.nowpaymentsEnabled}
            onChange={(v) =>
              setSettings((prev: SettingsState) => ({ ...prev, nowpaymentsEnabled: v }))
            }
            label={t("admin.settings.enableNowpayments")}
          />
          <p className="mt-2 text-xs text-[#9e98b6]">{t("admin.settings.nowpaymentsHelp")}</p>
        </div>

        <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {t("admin.settings.currencyConversionTitle")}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9e98b6]">
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
          />

          <p className="text-xs text-[#9e98b6]">
            {t("admin.settings.currencyConversionActive") || "Tasa activa:"}{" "}
            <span className="font-semibold text-white">
              {t(`admin.settings.rateKind.${settings.usdArsRateKind}`)}
            </span>
          </p>

          {ratesLoading ? (
            <div className="flex items-center gap-2 text-xs text-[#9e98b6]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Cargando cotizaciones...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(["blue", "oficial", "cripto"] as const).map((kind) => (
                <div
                  key={kind}
                  className={`rounded-md border p-2.5 text-center ${
                    settings.usdArsRateKind === kind
                      ? "border-accent/40 bg-accent/12"
                      : "border-white/[0.06] bg-[#0d0a18]"
                  }`}
                >
                  <span className="block text-[11px] font-medium text-[#9e98b6]">
                    {t(`admin.settings.rateKind.${kind}`)}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs font-semibold text-white tabular-nums">
                    {rates[kind] ? formatArs(rates[kind]!.value) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <SaveButton
          saving={saving}
          saved={saved}
          label={t("admin.settings.savePayments")}
        />
      </form>
    </AdminSection>
  );
}
