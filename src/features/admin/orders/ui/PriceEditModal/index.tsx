"use client";

import React, { useState } from "react";
import {
  X,
  DollarSign,
  XCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { StoreItem } from "@/features/admin/domain/types";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminButton, AdminModal } from "@/features/admin/ui/AdminShell";

interface PriceEditModalProps {
  item: StoreItem;
  onClose: () => void;
  onSuccess: (updatedItem: StoreItem) => void;
}

export function PriceEditModal({
  item,
  onClose,
  onSuccess,
}: PriceEditModalProps) {
  const { t } = useI18n();
  const [manualEnabled, setManualEnabled] = useState(item.isPriceManual ?? false);
  const [priceValue, setPriceValue] = useState(item.price.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const parsedPrice = parseFloat(priceValue);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError(t("admin.priceModal.invalidPrice"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/admin/marketplace/store/items/${item.assetId}/price`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            price: parsedPrice,
            isPriceManual: manualEnabled,
          }),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(t("admin.priceModal.updateError"));
      }

      onSuccess({
        ...item,
        price: parsedPrice,
        isPriceManual: manualEnabled,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.priceModal.connectionError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      size="md"
      title={item.name}
      subtitle={item.exterior ?? item.type}
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </AdminButton>
          <AdminButton
            type="button"
            variant="primary"
            icon={saving ? Loader2 : CheckCircle2}
            loading={saving}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? t("common.saving") : t("common.save")}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-5">
        {/* Item visual preview */}
        {item.iconUrl && (
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0e0b1a] p-3">
            <img
              src={item.iconUrl}
              alt={item.name}
              className="h-12 w-16 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{item.name}</p>
              <p className="text-xs text-[#9e98b6] tabular-nums">
                {t("admin.priceModal.currentMarketPrice")}: ${item.price.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Switch de precio manual */}
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-white/[0.07] bg-[#1a1630] p-4 select-none">
          <div>
            <p className="text-sm font-semibold text-white">{t("admin.priceModal.manualPrice")}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#9e98b6]">
              {manualEnabled
                ? t("admin.priceModal.manualActiveDescription")
                : t("admin.priceModal.manualInactiveDescription")}
            </p>
          </div>
          <div className="relative shrink-0">
            <input
              type="checkbox"
              checked={manualEnabled}
              onChange={(e) => setManualEnabled(e.target.checked)}
              aria-label={t("admin.priceModal.toggleManualPrice")}
              className="sr-only peer"
            />
            <div className="h-6 w-11 rounded-full border border-white/10 bg-[#0d0a18] transition-colors peer-checked:border-accent/50 peer-checked:bg-accent" />
            <div className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </div>
        </label>

        {/* Input de precio */}
        <div
          className={`space-y-1.5 transition-opacity ${
            manualEnabled ? "opacity-100" : "pointer-events-none opacity-40"
          }`}
        >
          <label className="block text-xs font-medium text-[#b8b2cd]">
            {t("admin.priceModal.priceUsd")}
          </label>
          <div className="relative">
            <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e88a6]" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              disabled={!manualEnabled}
              className="h-10 w-full rounded-md border border-white/15 bg-[#0d0a18] pl-9 pr-4 font-mono text-sm font-semibold text-white outline-none transition-colors placeholder:text-[#746e8d] focus:border-accent"
              placeholder="0.00"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-200">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </AdminModal>
  );
}
