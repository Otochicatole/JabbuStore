"use client";

import React from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { SectionHeader, ToggleSwitch, FieldLabel, StyledInput, SaveButton } from "./FormControls";
import { SettingsState } from "./index";

interface UserSellTabProps {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  saving: boolean;
  saved: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function UserSellTab({
  settings,
  setSettings,
  saving,
  saved,
  onSubmit,
}: UserSellTabProps) {
  const { t } = useI18n();

  const modifierOptions = [
    { value: "percentage_increase", label: t("admin.settings.modifier.percentageIncrease") },
    { value: "percentage_decrease", label: t("admin.settings.modifier.percentageDecrease") },
    { value: "fixed_increase", label: t("admin.settings.modifier.fixedIncrease") },
    { value: "fixed_decrease", label: t("admin.settings.modifier.fixedDecrease") },
  ];

  return (
    <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
      <SectionHeader
        title={t("admin.settings.userSellRulesTitle")}
        desc={t("admin.settings.userSellRulesDesc")}
      />
      <form onSubmit={onSubmit} className="space-y-5 max-w-xl">
        <ToggleSwitch
          checked={settings.userSellModifierEnabled}
          onChange={(v) =>
            setSettings((prev: SettingsState) => ({ ...prev, userSellModifierEnabled: v }))
          }
          label={t("admin.settings.enableSellModifier")}
        />
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.modifierType")}</FieldLabel>
          <AdminSelect
            value={settings.userSellModifierType}
            onChange={(v) =>
              setSettings((prev: SettingsState) => ({ ...prev, userSellModifierType: v }))
            }
            options={modifierOptions}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.value")}</FieldLabel>
          <StyledInput
            type="number"
            step="0.01"
            value={settings.userSellModifierValue}
            onChange={(e) =>
              setSettings((prev: SettingsState) => ({
                ...prev,
                userSellModifierValue: Number(e.target.value),
              }))
            }
          />
        </div>
        <SaveButton
          saving={saving}
          saved={saved}
          label={t("admin.settings.saveSellRules")}
        />
      </form>
    </div>
  );
}
