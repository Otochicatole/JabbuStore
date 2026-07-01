"use client";

import React from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { SectionHeader, ToggleSwitch, SaveButton } from "./FormControls";
import { SettingsState } from "./index";

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
