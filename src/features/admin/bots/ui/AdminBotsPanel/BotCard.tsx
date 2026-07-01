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

interface BotCardProps {
  bot: Bot;
  actionLoading: string | null;
  onEdit: (bot: Bot) => void;
  onDelete: (bot: Bot) => void;
  onToggle: (bot: Bot) => void;
}

const statusConfig: Record<
  string,
  { labelKey: string; color: string; bg: string; dot: string }
> = {
  active: {
    labelKey: "admin.bots.status.active",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  inactive: {
    labelKey: "admin.bots.status.inactive",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
    dot: "bg-slate-500",
  },
  maintenance: {
    labelKey: "admin.bots.status.maintenance",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  full: {
    labelKey: "admin.bots.status.full",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    dot: "bg-orange-500",
  },
  error: {
    labelKey: "admin.bots.status.error",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-500",
  },
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
    pct > 90
      ? "bg-red-500"
      : pct > 75
        ? "bg-orange-400"
        : "bg-accent";

  return (
    <div className="bg-[#110f1e]/30 border border-white/5 rounded-[3px] p-4 sm:p-5 space-y-5 relative overflow-hidden group min-w-0">
      {/* Status Indicator Bar */}
      <div className={`absolute top-0 left-0 w-full h-[2px] ${status.dot}`} />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-[3px] bg-white/[0.02] border border-white/8 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4 text-white/50 group-hover:text-accent transition-colors" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm text-white truncate max-w-[150px]">
              {bot.name}
            </h3>
            <p className="text-[9px] text-[#84849b] font-mono mt-0.5 uppercase tracking-wider">
              {t("admin.bots.steamBotAccount")}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-[3px] text-[8px] font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${status.bg} ${status.color}`}
        >
          <span className={`w-1 h-1 rounded-full ${status.dot}`} />
          {t(status.labelKey)}
        </span>
      </div>

      {/* Properties */}
      <div className="space-y-2.5 pt-1.5 border-t border-white/[0.03]">
        <div>
          <span className="text-[8px] font-black uppercase text-[#84849b] tracking-wider block">
            SteamID64 del Bot
          </span>
          <span className="text-[10px] font-mono text-white/70 block mt-0.5 break-all">
            {bot.steamId}
          </span>
        </div>

        <div>
          <div className="flex justify-between items-center text-[8px] font-black uppercase text-[#84849b] tracking-wider mb-1">
            <span>{t("admin.bots.storageCapacity")}</span>
            <span className="text-white/80">
              {bot.currentItems} / {bot.maxItems} items ({pct.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pctColor}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-white/[0.03] gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(bot)}
            className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-white/60 hover:text-white transition-all cursor-pointer"
            title={t("admin.bots.editConfig")}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(bot)}
            className="p-2 bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-[3px] text-white/40 hover:text-red-400 transition-all cursor-pointer"
            title={t("admin.bots.deleteBot")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {bot.tradeUrl && (
            <a
              href={bot.tradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-[#84849b] hover:text-white transition-all cursor-pointer"
              title={t("admin.bots.viewTradeOffer")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <button
          onClick={() => onToggle(bot)}
          disabled={actionLoading === bot.id}
          className={`flex w-full items-center justify-center gap-1.5 px-3 py-2 text-[9px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer select-none border disabled:opacity-45 sm:w-auto ${
            bot.isActive
              ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {actionLoading === bot.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : bot.isActive ? (
            <PowerOff className="w-3 h-3" />
          ) : (
            <Power className="w-3 h-3" />
          )}
          {bot.isActive ? t("admin.bots.deactivate") : t("admin.bots.activate")}
        </button>
      </div>
    </div>
  );
}
