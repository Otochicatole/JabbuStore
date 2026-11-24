"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, Check } from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Bot } from "./useAdminBots";
import { AdminButton, AdminModal } from "@/features/admin/ui/AdminShell";

interface BotModalProps {
  bot?: Bot | null;
  onClose: () => void;
  onSaved: () => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BotModal({ bot, onClose, onSaved }: BotModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState(bot ? bot.name : "");
  const [steamId, setSteamId] = useState(bot ? bot.steamId : "");
  const [tradeUrl, setTradeUrl] = useState(bot ? bot.tradeUrl || "" : "");
  const [maxItems, setMaxItems] = useState(bot ? bot.maxItems : 1000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = bot
        ? `${BACKEND_URL}/admin/marketplace/bots/${bot.id}`
        : `${BACKEND_URL}/admin/marketplace/bots`;
      const method = bot ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          steamId,
          tradeUrl: tradeUrl || null,
          maxItems,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || t("admin.bots.saveError"));
      }

      onSaved();
    } catch (e: unknown) {
      setError(getErrorMessage(e, t("admin.bots.saveError")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      size="md"
      title={bot ? t("admin.bots.editBot") : t("admin.bots.addBot")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#b8b2cd]">
            {t("admin.bots.botName")}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="JabbuBot #1"
            className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#746e8d] focus:border-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#b8b2cd]">SteamID64 *</label>
          <input
            type="text"
            required
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="76561199649767651"
            disabled={!!bot}
            className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-[#746e8d] focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          />
          {bot && (
            <p className="text-xs text-[#8e88a6]">{t("admin.bots.steamIdLocked")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#b8b2cd]">
            {t("admin.bots.tradeUrl")}
          </label>
          <input
            type="url"
            value={tradeUrl}
            onChange={(e) => setTradeUrl(e.target.value)}
            placeholder="https://steamcommunity.com/tradeoffer/new/..."
            className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#746e8d] focus:border-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#b8b2cd]">
            {t("admin.bots.maxItems")}
          </label>
          <input
            type="number"
            min={1}
            max={10000}
            value={maxItems}
            onChange={(e) => setMaxItems(parseInt(e.target.value) || 1000)}
            className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none transition-colors focus:border-accent"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </AdminButton>
          <AdminButton
            type="submit"
            variant="primary"
            icon={saving ? Loader2 : Check}
            loading={saving}
            disabled={saving}
          >
            {saving
              ? t("admin.bots.saving")
              : bot
                ? t("admin.bots.update")
                : t("admin.bots.create")}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  );
}
