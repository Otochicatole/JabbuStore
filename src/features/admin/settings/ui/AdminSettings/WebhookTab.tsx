"use client";

import React from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
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
    <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
      <SectionHeader
        title={t("admin.settings.webhookTitle")}
        desc={t("admin.settings.webhookDescFull")}
      />
      <form onSubmit={onSubmit} className="space-y-5 max-w-xl">
        <div className="space-y-1.5">
          <FieldLabel>Webhook URL</FieldLabel>
          <StyledInput
            type="url"
            placeholder="https://tu-servidor.com/webhook"
            value={settings.webhookUrl || ""}
            onChange={(e) =>
              setSettings((prev: SettingsState) => ({ ...prev, webhookUrl: e.target.value }))
            }
            style={{ fontFamily: "monospace" }}
          />
          <p className="text-[10px] text-[#84849b] font-mono leading-relaxed">
            {t("admin.settings.webhookHelp")}
          </p>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/[0.05] space-y-1.5 rounded-[3px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
            {t("admin.settings.triggeredEvents")}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {["order.created", "order.status_updated"].map((ev) => (
              <span
                key={ev}
                className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono rounded-[3px]"
              >
                {ev}
              </span>
            ))}
          </div>
        </div>

        <SaveButton
          saving={saving}
          saved={saved}
          label={t("admin.settings.saveWebhook")}
        />
      </form>
    </div>
  );
}
