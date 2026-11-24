"use client";

import React from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminBadge, AdminSection } from "@/features/admin/ui/AdminShell";
import { SectionHeader, FieldLabel, StyledInput, SaveButton } from "./FormControls";
import { SettingsState } from "./index";

interface WebhookTabProps {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  saving: boolean;
  saved: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function WebhookTab({
  settings,
  setSettings,
  saving,
  saved,
  onSubmit,
}: WebhookTabProps) {
  const { t } = useI18n();

  return (
    <AdminSection>
      <SectionHeader
        title={t("admin.settings.webhookTitle")}
        desc={t("admin.settings.webhookDescFull")}
      />
      <form onSubmit={onSubmit} className="max-w-xl space-y-5">
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.webhookUrl")}</FieldLabel>
          <StyledInput
            type="url"
            placeholder={t("admin.settings.webhookExample")}
            value={settings.webhookUrl || ""}
            onChange={(e) =>
              setSettings((prev: SettingsState) => ({ ...prev, webhookUrl: e.target.value }))
            }
            className="font-mono"
          />
          <p className="text-xs leading-relaxed text-[#9e98b6]">
            {t("admin.settings.webhookHelp")}
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
          <p className="text-xs font-semibold text-[#c2bdd6]">
            {t("admin.settings.triggeredEvents")}
          </p>
          <div className="flex flex-wrap gap-2">
            {["order.created", "order.status_updated"].map((ev) => (
              <AdminBadge key={ev} tone="accent" className="font-mono">
                {ev}
              </AdminBadge>
            ))}
          </div>
        </div>

        <SaveButton
          saving={saving}
          saved={saved}
          label={t("admin.settings.saveWebhook")}
        />
      </form>
    </AdminSection>
  );
}
