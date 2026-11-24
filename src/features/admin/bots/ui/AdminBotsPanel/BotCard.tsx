"use client";

import React from "react";
import {
  Cpu,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  PowerOff,
  Power,
} from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Bot } from "./useAdminBots";
import { AdminBadge, AdminButton } from "@/features/admin/ui/AdminShell";

interface BotCardProps {
  bot: Bot;
  actionLoading: string | null;
  onEdit: (bot: Bot) => void;
  onDelete: (bot: Bot) => void;
  onToggle: (bot: Bot) => void;
}

const statusConfig: Record<
  string,
  { labelKey: string; tone: "success" | "neutral" | "warning" | "danger" }
> = {
  active: { labelKey: "admin.bots.status.active", tone: "success" },
  inactive: { labelKey: "admin.bots.status.inactive", tone: "neutral" },
  maintenance: { labelKey: "admin.bots.status.maintenance", tone: "warning" },
  full: { labelKey: "admin.bots.status.full", tone: "warning" },
  error: { labelKey: "admin.bots.status.error", tone: "danger" },
};

export function BotCard({
  bot,
  actionLoading,
  onEdit,
  onDelete,
  onToggle,
}: BotCardProps) {
  const { t } = useI18n();
  const status = statusConfig[bot.status] || statusConfig.inactive;
  const pct = bot.maxItems > 0 ? (bot.currentItems / bot.maxItems) * 100 : 0;
  const pctColor =
    pct > 90 ? "bg-rose-500" : pct > 75 ? "bg-amber-400" : "bg-accent";

  return (
    <div className="flex min-w-0 flex-col justify-between gap-4 rounded-lg border border-white/[0.07] bg-[#141124] p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#1c1833] text-[#b8b2cd]">
            <Cpu className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{bot.name}</h3>
            <p className="text-xs text-[#8e88a6]">{t("admin.bots.steamBotAccount")}</p>
          </div>
        </div>

        <AdminBadge tone={status.tone} dot>
          {t(status.labelKey)}
        </AdminBadge>
      </div>

      {/* Properties */}
      <div className="space-y-3 border-t border-white/[0.06] pt-3">
        <div>
          <span className="block text-xs text-[#8e88a6]">SteamID64</span>
          <span className="mt-0.5 block break-all font-mono text-xs text-[#d4cfe6] select-all tabular-nums">
            {bot.steamId}
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-[#8e88a6]">{t("admin.bots.storageCapacity")}</span>
            <span className="font-medium text-white tabular-nums">
              {bot.currentItems} / {bot.maxItems} ({pct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${pctColor}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(bot)}
            className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-[#b8b2cd] hover:text-white transition-colors cursor-pointer"
            title={t("admin.bots.editConfig")}
            aria-label={t("admin.bots.editConfig")}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(bot)}
            className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-[#9e98b6] hover:border-rose-500/30 hover:bg-rose-500/12 hover:text-rose-300 transition-colors cursor-pointer"
            title={t("admin.bots.deleteBot")}
            aria-label={t("admin.bots.deleteBot")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {bot.tradeUrl && (
            <a
              href={bot.tradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-[#9e98b6] hover:text-white transition-colors"
              title={t("admin.bots.viewTradeOffer")}
              aria-label={t("admin.bots.viewTradeOffer")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <AdminButton
          type="button"
          size="sm"
          onClick={() => onToggle(bot)}
          disabled={actionLoading === bot.id}
          variant={bot.isActive ? "danger" : "success"}
          icon={actionLoading === bot.id ? Loader2 : bot.isActive ? PowerOff : Power}
          loading={actionLoading === bot.id}
        >
          {bot.isActive ? t("admin.bots.deactivate") : t("admin.bots.activate")}
        </AdminButton>
      </div>
    </div>
  );
}
