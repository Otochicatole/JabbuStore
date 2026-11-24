"use client";

import React from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminAlert, AdminSection } from "@/features/admin/ui/AdminShell";
import {
  SectionHeader,
  ToggleSwitch,
  FieldLabel,
  StyledInput,
  StyledTextarea,
  SaveButton,
} from "./FormControls";
import { SettingsState } from "./index";

interface TransferTabProps {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  saving: boolean;
  saved: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function TransferTab({
  settings,
  setSettings,
  saving,
  saved,
  onSubmit,
}: TransferTabProps) {
  const { t } = useI18n();

  return (
    <AdminSection>
      <SectionHeader
        title={t("admin.settings.manualTransferTitle")}
        desc={t("admin.settings.manualTransferDesc")}
      />
      <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
        <ToggleSwitch
          checked={settings.manualTransferEnabled}
          onChange={(v) =>
            setSettings((prev: SettingsState) => ({ ...prev, manualTransferEnabled: v }))
          }
          label={t("admin.settings.enableManualTransfer")}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
            <h3 className="text-sm font-semibold text-white">
              {t("admin.settings.bankTransfer")}
            </h3>
            <div className="space-y-1.5">
              <FieldLabel>Alias</FieldLabel>
              <StyledInput
                value={settings.manualBankAlias || ""}
                onChange={(e) =>
                  setSettings((prev: SettingsState) => ({
                    ...prev,
                    manualBankAlias: e.target.value,
                  }))
                }
                placeholder="ej. jabbu.store.mp"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>CBU / CVU</FieldLabel>
              <StyledInput
                value={settings.manualBankCbu || ""}
                onChange={(e) =>
                  setSettings((prev: SettingsState) => ({
                    ...prev,
                    manualBankCbu: e.target.value,
                  }))
                }
                placeholder="0000003100012345678901"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{t("checkout.accountHolder")}</FieldLabel>
              <StyledInput
                value={settings.manualBankHolder || ""}
                onChange={(e) =>
                  setSettings((prev: SettingsState) => ({
                    ...prev,
                    manualBankHolder: e.target.value,
                  }))
                }
                placeholder={t("admin.settings.bankHolderPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.bankInstructions")}</FieldLabel>
              <StyledTextarea
                value={settings.manualBankInstructions || ""}
                onChange={(e) =>
                  setSettings((prev: SettingsState) => ({
                    ...prev,
                    manualBankInstructions: e.target.value,
                  }))
                }
                placeholder={t("admin.settings.bankInstructionsPlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
            <h3 className="text-sm font-semibold text-white">
              {t("admin.settings.cryptoTransfer")}
            </h3>
            <div className="space-y-1.5">
              <FieldLabel>{t("checkout.walletAddress")}</FieldLabel>
              <StyledInput
                value={settings.manualCryptoAddress || ""}
                onChange={(e) =>
                  setSettings((prev: SettingsState) => ({
                    ...prev,
                    manualCryptoAddress: e.target.value,
                  }))
                }
                placeholder="0x... / TRC20 / BTC / etc."
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{t("checkout.network")}</FieldLabel>
              <StyledInput
                value={settings.manualCryptoNetwork || ""}
                onChange={(e) =>
                  setSettings((prev: SettingsState) => ({
                    ...prev,
                    manualCryptoNetwork: e.target.value,
                  }))
                }
                placeholder="USDT TRC20, ERC20, BTC..."
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{t("admin.settings.cryptoInstructions")}</FieldLabel>
              <StyledTextarea
                value={settings.manualCryptoInstructions || ""}
                onChange={(e) =>
                  setSettings((prev: SettingsState) => ({
                    ...prev,
                    manualCryptoInstructions: e.target.value,
                  }))
                }
                placeholder={t("admin.settings.cryptoInstructionsPlaceholder")}
              />
            </div>
          </div>
        </div>

        <AdminAlert tone="warning">{t("admin.settings.manualTransferWarning")}</AdminAlert>

        <SaveButton
          saving={saving}
          saved={saved}
          label={t("admin.settings.saveManualTransfer")}
        />
      </form>
    </AdminSection>
  );
}
