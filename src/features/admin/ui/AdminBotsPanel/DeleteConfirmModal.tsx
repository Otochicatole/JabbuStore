"use client";

import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Bot } from "./useAdminBots";

interface DeleteConfirmModalProps {
  bot: Bot;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteConfirmModal({
  bot,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  const { t } = useI18n();

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
        <div className="flex items-center gap-3 mb-4 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h2 className="text-base font-black uppercase tracking-wider">
            {t("admin.bots.deleteBot")}?
          </h2>
        </div>

        <p className="text-sm text-[#84849b] mb-6">
          {t("admin.bots.deleteConfirm", { name: bot.name })}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-sm font-bold text-white transition-colors cursor-pointer"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 bg-red-500 hover:bg-red-600 rounded-[3px] text-sm font-black text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? t("admin.bots.deleting") : t("admin.bots.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
