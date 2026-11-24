"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface AlertConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "confirm";
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function AlertConfirmModal({
  isOpen,
  title,
  message,
  type = "info",
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
}: AlertConfirmModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (onCancel) onCancel();
        else onConfirm();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen || typeof document === "undefined") return null;

  const resolvedConfirmLabel = confirmLabel ?? t("common.accept");
  const resolvedCancelLabel = cancelLabel ?? t("common.cancel");
  const isConfirm = type === "confirm";

  const iconStyle =
    type === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
      : type === "error"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-400"
        : type === "warning"
          ? "border-amber-500/25 bg-amber-500/10 text-amber-400"
          : type === "confirm"
            ? "border-sky-500/25 bg-sky-500/10 text-sky-400"
            : "border-accent/25 bg-accent/10 text-accent";

  const Icon =
    type === "success"
      ? CheckCircle
      : type === "info"
        ? Info
        : AlertCircle;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/75"
        onClick={onCancel ?? onConfirm}
        aria-hidden="true"
      />
      <div
        className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-xl border border-white/10 bg-[#141124] p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconStyle}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed text-[#a39db9]">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel ?? onConfirm}
            aria-label={t("common.close")}
            className="rounded-md p-1 text-[#8e88a6] hover:bg-white/[0.06] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-3.5">
          {isConfirm && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-md border border-white/10 bg-[#1c1833] px-3.5 text-xs font-medium text-[#d4cfe6] hover:bg-[#252042] hover:text-white transition-colors cursor-pointer"
            >
              {resolvedCancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`h-9 rounded-md px-4 text-xs font-semibold text-white transition-colors cursor-pointer ${
              type === "error"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-accent hover:bg-accent/90"
            }`}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
