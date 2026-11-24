"use client";

import React from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { getItemRarity, getItemExterior } from "@/features/admin/shared/utils";
import { buildYoupinItemUrl } from "@/shared/lib/youpin";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { OrderItem } from "@/features/admin/domain/types";
import { AdminBadge } from "@/features/admin/ui/AdminShell";

interface OrderDetailItemProps {
  item: OrderItem;
  resolvedDetails: {
    float?: number | null;
    pattern?: number | null;
    rarity?: string;
    exterior?: string;
  };
  copiedAssetId: string | null;
  onCopyAssetId: (assetId: string) => void;
}

export function OrderDetailItem({
  item,
  resolvedDetails,
  copiedAssetId,
  onCopyAssetId,
}: OrderDetailItemProps) {
  const { t } = useI18n();

  const finalRarity = item.rarity || resolvedDetails.rarity || getItemRarity(item);
  const finalExterior = item.exterior || resolvedDetails.exterior || getItemExterior(item);

  const finalProvider =
    item.provider ||
    (item.assetId &&
    typeof item.assetId === "string" &&
    (item.assetId.startsWith("resell-") ||
      item.assetId.startsWith("market-") ||
      item.assetId.startsWith("youpin-"))
      ? "youpin"
      : "bots");

  const youpinUrl = buildYoupinItemUrl({
    externalId: item.externalId,
    name: item.name,
  });

  const displayFloat = item.float !== null && item.float !== undefined ? item.float : null;
  const displayPattern = item.pattern !== null && item.pattern !== undefined ? item.pattern : null;

  const isPhysical = finalProvider === "bots" || finalProvider === "user";
  const isStatTrak = item.name.includes("StatTrak™") || item.name.includes("StatTrak");
  const isSouvenir = item.name.includes("Souvenir");
  const isStar = item.name.includes("★");

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/[0.07] bg-[#1a1630] p-4 sm:flex-row sm:items-center">
      {/* Icon image */}
      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0d0a18] p-2">
        {item.iconUrl ? (
          <img
            src={item.iconUrl}
            className="h-full w-full object-contain"
            alt={item.name}
          />
        ) : (
          <span className="text-xs text-[#8e88a6]">{t("common.noImage")}</span>
        )}
      </div>

      {/* Item Details */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">
            {item.name}
          </span>
          {isStatTrak && <AdminBadge tone="warning">StatTrak™</AdminBadge>}
          {isSouvenir && <AdminBadge tone="warning">Souvenir</AdminBadge>}
          {isStar && <AdminBadge tone="accent">★ {t("admin.orders.specialBadge")}</AdminBadge>}
          {finalExterior && (
            <AdminBadge tone={item.float !== null && item.float !== undefined ? "info" : "neutral"}>
              {item.float !== null && item.float !== undefined
                ? t("admin.orders.specificFloat")
                : t("admin.orders.anyFloat")}
            </AdminBadge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-[#9e98b6]">
          <AdminBadge tone={isPhysical ? "success" : "info"}>
            {isPhysical ? t("admin.orders.physicalSkins") : t("admin.orders.resellOrder")}
          </AdminBadge>

          {finalProvider === "youpin" && (
            <a
              href={youpinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-indigo-500/25 bg-indigo-500/12 px-2 py-0.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              <span>{t("admin.orders.resaleYouPin")}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {finalProvider === "bots" && (
            <a
              href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/12 px-2 py-0.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <span>{t("admin.orders.physicalStockBot")}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {finalProvider === "user" && (
            <a
              href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-rose-500/25 bg-rose-500/12 px-2 py-0.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              <span>{t("admin.orders.clientInventorySale")}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {finalExterior && <span>{finalExterior}</span>}
          {finalRarity && <span>· {finalRarity}</span>}

          {displayPattern !== null && displayPattern !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs text-[#d4cfe6]">
              <span className="text-[#8e88a6]">{t("admin.orders.seed")}:</span>
              <span className="font-mono font-semibold text-accent tabular-nums">{displayPattern}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => onCopyAssetId(item.assetId)}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0d0a18] px-2 py-0.5 font-mono text-xs text-[#a39db9] hover:border-white/20 hover:text-white transition-colors cursor-pointer tabular-nums"
            title={t("admin.orders.copyAssetId")}
          >
            <span>Asset:</span>
            <span className="text-white">{item.assetId}</span>
            {copiedAssetId === item.assetId ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-[#8e88a6]" />
            )}
          </button>
        </div>
      </div>

      {/* Float Box */}
      <div className="sm:w-48 shrink-0 rounded-md border border-white/[0.07] bg-[#0e0b1a] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-[#8e88a6]">
            {t("purchases.registeredFloat")}
          </span>
          {displayFloat !== null && isPhysical && (
            <span className="text-[11px] font-medium text-emerald-400">
              {t("admin.orders.realBadge")}
            </span>
          )}
        </div>
        {displayFloat !== null ? (
          <>
            <span className="mt-1 block font-mono text-xs font-semibold text-white select-all tabular-nums">
              {displayFloat.toFixed(8)}
            </span>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  displayFloat < 0.07
                    ? "bg-emerald-400"
                    : displayFloat < 0.15
                      ? "bg-sky-400"
                      : displayFloat < 0.38
                        ? "bg-amber-400"
                        : displayFloat < 0.45
                          ? "bg-orange-400"
                          : "bg-rose-400"
                }`}
                style={{ width: `${Math.min(100, displayFloat * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <span className="mt-1 block text-xs text-[#746e8d]">
            {t("admin.orders.chooseAnyFloat")}
          </span>
        )}
      </div>

      {finalProvider === "youpin" && (
        <div className="shrink-0">
          <a
            href={youpinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/15 px-3 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25 transition-colors"
            title={item.externalId ? t("admin.orders.openExactYouPin") : t("admin.orders.searchItemYouPin")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {item.externalId ? t("admin.orders.viewItemYouPin") : t("admin.orders.searchYouPin")}
          </a>
        </div>
      )}

      {/* Price */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] pt-2.5 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <span className="text-xs text-[#8e88a6] sm:hidden">{t("common.price")}</span>
        <div className="text-right">
          <span className="block text-base font-semibold text-emerald-400 tabular-nums">
            ${item.price.toLocaleString()}
          </span>
          <span className="block text-[11px] text-[#8e88a6]">USD</span>
        </div>
      </div>
    </div>
  );
}
