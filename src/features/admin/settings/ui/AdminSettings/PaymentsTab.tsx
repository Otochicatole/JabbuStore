"use client";

import React from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { SectionHeader, ToggleSwitch, SaveButton } from "./FormControls";
import { SettingsState } from "./index";
import { AdminSelect } from "@/shared/components/AdminSelect";

interface PaymentsTabProps {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  saving: boolean;
  saved: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function PaymentsTab({
  settings,
  setSettings,
  saving,
  saved,
  onSubmit,
}: PaymentsTabProps) {
  const { t } = useI18n();
  const rateOptions = [
    { value: "blue", label: t("admin.settings.rateKind.blue") },
    { value: "oficial", label: t("admin.settings.rateKind.oficial") },
    { value: "cripto", label: t("admin.settings.rateKind.cripto") },
  ];

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
