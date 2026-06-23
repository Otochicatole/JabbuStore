"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2, Check } from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Bot } from "./useAdminBots";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-[#0f0d1e] border border-white/10 rounded-[3px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-black uppercase tracking-wider">
            {bot ? t("admin.bots.editBot") : t("admin.bots.addBot")}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              {t("admin.bots.botName")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="JabbuBot #1"
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              SteamID64 *
            </label>
            <input
              type="text"
              required
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="76561199649767651"
              disabled={!!bot}
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            />
            {bot && (
              <p className="text-[10px] text-[#84849b] mt-1">
                {t("admin.bots.steamIdLocked")}
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              {t("admin.bots.tradeUrl")}
            </label>
            <input
              type="url"
              value={tradeUrl}
              onChange={(e) => setTradeUrl(e.target.value)}
              placeholder="https://steamcommunity.com/tradeoffer/new/..."
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              {t("admin.bots.maxItems")}
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={maxItems}
              onChange={(e) => setMaxItems(parseInt(e.target.value) || 1000)}
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-[3px]">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-sm font-bold text-white transition-colors cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-accent hover:bg-accent/90 rounded-[3px] text-sm font-black text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving
                ? t("admin.bots.saving")
                : bot
                  ? t("admin.bots.update")
                  : t("admin.bots.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
