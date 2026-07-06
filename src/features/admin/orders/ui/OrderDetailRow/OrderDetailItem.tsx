"use client";

import React from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { getItemRarity, getItemExterior } from "@/features/admin/shared/utils";
import { buildYoupinItemUrl } from "@/shared/lib/youpin";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { OrderItem } from "@/features/admin/domain/types";

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

  const finalFloat =
    item.float !== null && item.float !== undefined
      ? item.float
      : resolvedDetails.float !== undefined
        ? resolvedDetails.float
        : null;

  const finalPattern =
    item.pattern !== null && item.pattern !== undefined
      ? item.pattern
      : resolvedDetails.pattern !== undefined
        ? resolvedDetails.pattern
        : null;

  const finalRarity =
    item.rarity || resolvedDetails.rarity || getItemRarity(item);

  const finalExterior =
    item.exterior || resolvedDetails.exterior || getItemExterior(item);

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
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-6 bg-[#090812] p-5 border relative overflow-hidden group rounded-[3px] transition-all duration-300 hover:bg-[#0c0a1a] ${
        isPhysical
          ? "border-emerald-500/10 hover:border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.02)]"
          : "border-white/5 hover:border-white/10"
      }`}
    >


      {/* Icon image */}
      <div className="w-24 h-16 relative bg-[#131124] border border-white/5 p-2 flex items-center justify-center flex-shrink-0 font-sans rounded-[4px] shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
        {item.iconUrl ? (
          <img
            src={item.iconUrl}
            className="w-full h-full object-contain drop-shadow-md"
            alt={item.name}
          />
        ) : (
          <span className="text-[8px] text-[#84849b] font-mono">
            No Image
          </span>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-extrabold text-white block truncate tracking-wide">
            {item.name}
          </span>

          {/* STATTRAK / SOUVENIR SPECIAL BADGES */}
          {isStatTrak && (
            <span className="text-[7.5px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-[2px] shadow-[0_0_8px_rgba(249,115,22,0.1)]">
              StatTrak™
            </span>
          )}
          {isSouvenir && (
            <span className="text-[7.5px] font-black uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-[2px] shadow-[0_0_8px_rgba(234,179,8,0.1)]">
              Souvenir
            </span>
          )}
          {isStar && (
            <span className="text-[7.5px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-[2px] shadow-[0_0_8px_rgba(168,85,247,0.1)]">
              ★ Especial
            </span>
          )}
          {finalExterior && (
            item.float !== null && item.float !== undefined ? (
              <span className="text-[7.5px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-[2px] shadow-[0_0_8px_rgba(59,130,246,0.1)]">
                {t("admin.orders.specificFloat") || "Float Específico"}
              </span>
            ) : (
              <span className="text-[7.5px] font-black uppercase tracking-wider bg-neutral-500/15 text-neutral-400 border border-neutral-500/30 px-1.5 py-0.5 rounded-[2px]">
                {t("admin.orders.anyFloat") || "Cualquier Float"}
              </span>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-[#84849b]">
          {/* ENHANCED LABELS & PROVIDER BADGES */}
          {finalProvider === "youpin" && (
            <a
              href={youpinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-[2px] font-sans transition-all hover:scale-105"
            >
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse mr-0.5" />
              <span>{t("admin.orders.resaleYouPin")}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}

          {finalProvider === "bots" && (
            <a
              href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-[2px] font-sans transition-all hover:scale-105 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-0.5 animate-pulse" />
              <span>{t("admin.orders.physicalStockBot")}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {finalProvider === "user" && (
            <a
              href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 rounded-[2px] font-sans transition-all hover:scale-105 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
            >
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-0.5 animate-pulse" />
              <span>{t("admin.orders.clientInventorySale")}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}

          {/* PHYSICAL VS RESELL BADGES */}
          {isPhysical ? (
            <span className="text-[8.5px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-[2px] font-sans tracking-wide">
              {t("admin.orders.physicalSkins")}
            </span>
          ) : (
            <span className="text-[8.5px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-[2px] font-sans tracking-wide">
              {t("admin.orders.resellOrder")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 text-[9.5px] font-mono">
          {finalExterior && (
            <span className="text-white font-sans uppercase tracking-wider font-extrabold bg-white/10 px-2 py-0.5 rounded-sm border border-white/5">
              {finalExterior}
            </span>
          )}

          {finalRarity && (
            <span className="text-white/90 font-sans uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">
              {finalRarity}
            </span>
          )}

          {displayPattern !== null && displayPattern !== undefined && (
            <span className="text-white/90 bg-white/5 px-2 py-0.5 rounded-sm border border-white/5 flex items-center gap-1">
              <span className="text-[#84849b]">{t("admin.orders.seed")}:</span>
              <span className="font-extrabold text-accent">{displayPattern}</span>
              {isPhysical && (
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 rounded-[2px] ml-1 uppercase font-black font-sans tracking-wide">
                  {t("admin.orders.physical")}
                </span>
              )}
            </span>
          )}

          <button
            onClick={() => onCopyAssetId(item.assetId)}
            className="text-[#84849b] bg-[#141223] hover:bg-white/10 hover:text-white px-2 py-0.5 rounded-sm border border-white/5 font-mono text-[9.5px] flex items-center gap-1 transition-all cursor-pointer rounded-[3px]"
            title={t("admin.orders.copyAssetId")}
          >
            <span>AssetID:</span>
            <span className="text-white font-semibold select-all">
              {item.assetId}
            </span>
            {copiedAssetId === item.assetId ? (
              <Check className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-white/35" />
            )}
          </button>
        </div>
      </div>

      {/* Float display */}
      {displayFloat !== null && displayFloat !== undefined ? (
        <div className="sm:w-48 flex-shrink-0 bg-[#121021]/80 border border-white/5 p-3 rounded-[3px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono">
              Float Registrado
            </span>
            {isPhysical && (
              <span className="text-[7.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-sans tracking-wider">
                ✓ Real
              </span>
            )}
          </div>
          <span className="text-[11px] font-black font-mono text-white block mt-1 select-all">
            {displayFloat.toFixed(10)}
          </span>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5 relative">
            <div
              className={`h-full rounded-full ${
                displayFloat < 0.07
                  ? "bg-emerald-400"
                  : displayFloat < 0.15
                    ? "bg-blue-400"
                    : displayFloat < 0.38
                      ? "bg-yellow-400"
                      : displayFloat < 0.45
                        ? "bg-orange-400"
                        : "bg-red-400"
              }`}
              style={{
                width: `${Math.min(100, displayFloat * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="sm:w-48 flex-shrink-0 bg-[#121021]/80 border border-white/5 p-3 rounded-[3px] flex flex-col justify-center">
          <span className="text-[9px] uppercase tracking-wider font-black text-white/25 font-mono">
            Float Registrado
          </span>
          <span className="text-[10px] text-white/35 font-mono mt-1 font-bold">
            {t("admin.orders.chooseAnyFloat") || "A Criterio (Cualquiera)"}
          </span>
        </div>
      )}

      {finalProvider === "youpin" && (
        <div className="flex-shrink-0">
          <a
            href={youpinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 rounded-[3px] text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] shadow-[0_0_16px_rgba(99,102,241,0.08)]"
            title={
              item.externalId
                ? t("admin.orders.openExactYouPin")
                : t("admin.orders.searchItemYouPin")
            }
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {item.externalId ? t("admin.orders.viewItemYouPin") : t("admin.orders.searchYouPin")}
          </a>
        </div>
      )}

      {/* Price */}
      <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
        <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block sm:hidden">
          Precio
        </span>
        <div>
          <span className="text-sm sm:text-base font-black text-accent">
            ${item.price.toLocaleString()}
          </span>
          <span className="text-[9px] text-[#84849b] font-bold block">
            USD
          </span>
        </div>
      </div>
    </div>
  );
}
