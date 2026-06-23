"use client";

import React from "react";
import { SkinImage } from "@/shared/components/SkinImage";
import { Pencil, ExternalLink } from "lucide-react";
import { StoreItem } from "../../../domain/types";
import { rarityColors } from "../utils";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface InventoryListProps {
  items: StoreItem[];
  botMap: Record<string, string>;
  onEditPrice: (item: StoreItem) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    let adjustedStart = start;
    let adjustedEnd = end;
    if (currentPage <= 3) {
      adjustedEnd = 4;
    } else if (currentPage >= totalPages - 2) {
      adjustedStart = totalPages - 3;
    }

    for (let i = adjustedStart; i <= adjustedEnd; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
  }

  return pages;
}

export function InventoryList({
  items,
  botMap,
  onEditPrice,
  currentPage,
  totalPages,
  onPageChange,
}: InventoryListProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="border border-white/5 rounded-[3px] overflow-hidden">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-[#110f1e]/40 text-[#84849b] text-[10px] font-black uppercase tracking-wider font-mono">
                <th className="py-4 px-5">{t("admin.inventory.skin")}</th>
                <th className="py-4 px-5">{t("admin.inventory.assetId")}</th>
                <th className="py-4 px-5">{t("admin.inventory.floatValue")}</th>
                <th className="py-4 px-5">{t("admin.inventory.ownerBot")}</th>
                <th className="py-4 px-5">{t("common.price")}</th>
                <th className="py-4 px-5 text-right">{t("admin.common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {items.map((item) => {
                const color =
                  rarityColors[item.rarity.toLowerCase()] ||
                  rarityColors.common;
                const botName = botMap[item.botSteamId] || `Bot (${item.botSteamId.slice(-4)})`;

                return (
                  <tr
                    key={item.assetId}
                    className="hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="py-3 px-5 flex items-center gap-3">
                      <div
                        className="relative w-12 h-12 rounded-[3px] bg-[#110f1e]/60 border border-white/[0.03] flex items-center justify-center p-1 shrink-0"
                        style={{ borderColor: `${color}25` }}
                      >
                        <div
                          className="absolute inset-0 blur-md opacity-20 pointer-events-none rounded-[3px]"
                          style={{
                            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                          }}
                        />
                        {item.iconUrl && (
                          <SkinImage
                            src={item.iconUrl}
                            alt={item.name}
                            width={44}
                            height={44}
                            maxWidth={44}
                            maxHeight={44}
                            className="z-10"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white truncate max-w-xs">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#84849b] uppercase font-mono mt-0.5">
                          {item.type}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-[10px] text-[#84849b]">
                      {item.assetId}
                    </td>
                    <td className="py-3 px-5 font-mono text-[10px]">
                      {item.float !== null &&
                      item.float !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">
                            {item.float.toFixed(5)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#84849b]">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-black text-white text-[10px] uppercase font-mono">
                          {botName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-black text-green-400 font-mono text-sm">
                        ${item.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditPrice(item)}
                          className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-white/60 hover:text-accent hover:border-accent/40 transition-all cursor-pointer"
                          title={t("admin.inventory.editPrice")}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://steamcommunity.com/profiles/${item.botSteamId}/inventory/#730`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-[#84849b] hover:text-white transition-all cursor-pointer"
                          title={t("admin.inventory.viewBotInventory")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card-Based View */}
        <div className="md:hidden divide-y divide-white/5 bg-[#110f1e]/10">
          {items.map((item) => {
            const color =
              rarityColors[item.rarity.toLowerCase()] ||
              rarityColors.common;
            const botName = botMap[item.botSteamId] || `Bot (${item.botSteamId.slice(-4)})`;

            return (
              <div
                key={item.assetId}
                className="p-4 flex flex-col gap-3.5 hover:bg-white/[0.01] transition-colors relative"
              >
                <div className="flex items-start gap-3">
                  {/* Image Container with Glow */}
                  <div
                    className="relative w-14 h-14 rounded-[3px] bg-[#110f1e]/60 border border-white/[0.03] flex items-center justify-center p-1 shrink-0"
                    style={{ borderColor: `${color}25` }}
                  >
                    <div
                      className="absolute inset-0 blur-md opacity-25 pointer-events-none rounded-[3px]"
                      style={{
                        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                      }}
                    />
                    {item.iconUrl && (
                      <SkinImage
                        src={item.iconUrl}
                        alt={item.name}
                        width={44}
                        height={44}
                        maxWidth={44}
                        maxHeight={44}
                        className="z-10"
                      />
                    )}
                  </div>

                  {/* Name & Type */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-white text-xs leading-snug break-words">
                      {item.name}
                    </h4>
                    <span className="inline-block text-[8.5px] text-[#84849b] uppercase font-mono mt-0.5 tracking-wider bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-sm">
                      {item.type}
                    </span>
                  </div>
                </div>

                {/* Technical Details Grid */}
                <div className="grid grid-cols-2 gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-[3px] text-[10px] font-mono">
                  <div className="min-w-0">
                    <span className="text-[#84849b] block text-[8px] uppercase tracking-widest font-bold">Asset ID</span>
                    <span className="text-white/95 truncate block select-all mt-0.5">{item.assetId}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#84849b] block text-[8px] uppercase tracking-widest font-bold">{t("admin.inventory.steamBots")}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-white font-black text-[9.5px] uppercase tracking-wide truncate">{botName}</span>
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-white/[0.03] pt-2">
                    <span className="text-[#84849b] block text-[8px] uppercase tracking-widest font-bold">Float Value</span>
                    <span className="text-white font-bold block mt-0.5">
                      {item.float !== null && item.float !== undefined ? (
                        <span className="text-white font-extrabold">{item.float.toFixed(5)}</span>
                      ) : (
                        <span className="text-[#84849b]">N/A</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Pricing and Action Buttons */}
                <div className="flex items-center justify-between mt-0.5">
                  <div>
                    <span className="text-[#84849b] block text-[8px] uppercase tracking-widest font-bold">{t("common.price")}</span>
                    <span className="font-black text-green-400 font-mono text-sm block mt-0.5">
                      ${item.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditPrice(item)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-white/80 hover:text-accent hover:border-accent/40 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer min-h-[34px]"
                    >
                      <Pencil className="w-3 h-3 text-accent" />
                      <span>{t("common.edit")}</span>
                    </button>
                    <a
                      href={`https://steamcommunity.com/profiles/${item.botSteamId}/inventory/#730`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-[#84849b] hover:text-white transition-all cursor-pointer"
                      title={t("admin.inventory.viewBotInventory")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-[10px] text-[#84849b] font-bold uppercase tracking-wider font-mono">
            {t("skinGrid.pagination")} {currentPage} / {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                onPageChange((p) => Math.max(1, p - 1))
              }
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
            >
              {t("skinGrid.previous")}
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers(
                currentPage,
                totalPages,
              ).map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (typeof page === "number") onPageChange(page);
                  }}
                  disabled={page === "..."}
                  className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-[3px] border transition-all cursor-pointer select-none ${
                    page === currentPage
                      ? "bg-accent border-accent text-white font-black"
                      : "bg-white/[0.02] border-white/5 text-[#84849b] hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                onPageChange((p) =>
                  Math.min(totalPages, p + 1),
                )
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
            >
              {t("skinGrid.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
