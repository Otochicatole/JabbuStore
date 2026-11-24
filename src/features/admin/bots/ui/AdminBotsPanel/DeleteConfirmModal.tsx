"use client";

import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Bot } from "./useAdminBots";
import { AdminButton, AdminModal } from "@/features/admin/ui/AdminShell";

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
    <AdminModal
      open
      onClose={onClose}
      size="sm"
      title={
        <span className="inline-flex items-center gap-2 text-rose-300">
          <AlertTriangle className="h-4.5 w-4.5" />
          <span>{t("admin.bots.deleteBot")}?</span>
        </span>
      }
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </AdminButton>
          <AdminButton
            type="button"
            variant="danger"
            icon={loading ? Loader2 : Trash2}
            loading={loading}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? t("admin.bots.deleting") : t("admin.bots.delete")}
          </AdminButton>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-[#b8b2cd]">
        {t("admin.bots.deleteConfirm", { name: bot.name })}
      </p>
    </AdminModal>
  );
}
