"use client";

import React, { useEffect, useRef } from "react";
import { SkinImage } from "@/shared/components/SkinImage";
import { Pencil, ExternalLink } from "lucide-react";
import { StoreItem } from "@/features/admin/domain/types";
import { rarityColors } from "@/features/admin/shared/utils";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminPagination } from "@/features/admin/ui/AdminShell";

interface InventoryListProps {
  items: StoreItem[];
  botMap: Record<string, string>;
  onEditPrice: (item: StoreItem) => void;
  onToggleMarketable: (item: StoreItem, marketable: boolean) => void;
  selectedAssetIds: Set<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleSelectItem: (assetId: string) => void;
  onToggleSelectAllVisible: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
}

function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border border-white/25 bg-[#0d0a18] accent-accent"
    />
  );
}

export function InventoryList({
  items,
  botMap,
  onEditPrice,
  onToggleMarketable,
  selectedAssetIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleSelectItem,
  onToggleSelectAllVisible,
  currentPage,
  totalPages,
  onPageChange,
}: InventoryListProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 md:hidden">
        <SelectionCheckbox
          checked={allVisibleSelected}
          indeterminate={someVisibleSelected}
          onChange={onToggleSelectAllVisible}
          ariaLabel={t("admin.inventory.selectAll")}
        />
        <span className="text-xs font-medium text-[#9e98b6]">
          {t("admin.inventory.selectAll")}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#100d1e]">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#1a1630] text-xs font-semibold text-[#9e98b6]">
                <th className="w-10 px-3 py-3">
                  <SelectionCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={onToggleSelectAllVisible}
                    ariaLabel={t("admin.inventory.selectAll")}
                  />
                </th>
                <th className="px-4 py-3">{t("admin.inventory.skin")}</th>
                <th className="px-4 py-3">{t("admin.inventory.assetId")}</th>
                <th className="px-4 py-3">{t("admin.inventory.floatValue")}</th>
                <th className="px-4 py-3">{t("admin.inventory.ownerBot")}</th>
                <th className="px-4 py-3">{t("common.price")}</th>
                <th className="px-4 py-3 text-center">{t("admin.inventory.visible")}</th>
                <th className="px-4 py-3 text-right">{t("admin.common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-[13px]">
              {items.map((item) => {
                const color =
                  rarityColors[item.rarity.toLowerCase()] || rarityColors.common;
                const botName = botMap[item.botSteamId] || `Bot (${item.botSteamId.slice(-4)})`;
                const isSelected = selectedAssetIds.has(item.assetId);

                return (
                  <tr
                    key={item.assetId}
                    className={`transition-colors hover:bg-white/[0.03] ${
                      isSelected ? "bg-accent/[0.08]" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <SelectionCheckbox
                        checked={isSelected}
                        onChange={() => onToggleSelectItem(item.assetId)}
                        ariaLabel={item.name}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-[#0d0a18] p-1"
                          style={{ borderColor: `${color}35` }}
                        >
                          {item.iconUrl && (
                            <SkinImage
                              src={item.iconUrl}
                              alt={item.name}
                              width={40}
                              height={40}
                              maxWidth={40}
                              maxHeight={40}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-semibold text-white">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[#8e88a6]">{item.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9e98b6] tabular-nums">
                      {item.assetId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                      {item.float !== null && item.float !== undefined ? (
                        <span className="font-medium text-white">
                          {item.float.toFixed(5)}
                        </span>
                      ) : (
                        <span className="text-[#746e8d]">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#d4cfe6]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{botName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400 tabular-nums">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <label className="relative inline-flex cursor-pointer items-center select-none">
                          <input
                            type="checkbox"
                            checked={item.marketable !== false}
                            onChange={(e) => onToggleMarketable(item, e.target.checked)}
                            aria-label={`${t("admin.inventory.visible")}: ${item.name}`}
                            className="sr-only peer"
                          />
                          <div className="h-6 w-11 rounded-full border border-white/10 bg-[#1c1833] transition-colors peer-checked:border-accent/50 peer-checked:bg-accent" />
                          <div className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditPrice(item)}
                          className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-[#b8b2cd] hover:border-accent/40 hover:text-white transition-colors cursor-pointer"
                          title={t("admin.inventory.editPrice")}
                          aria-label={t("admin.inventory.editPrice")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`https://steamcommunity.com/profiles/${item.botSteamId}/inventory/#730`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-[#9e98b6] hover:text-white transition-colors"
                          title={t("admin.inventory.viewBotInventory")}
                          aria-label={t("admin.inventory.viewBotInventory")}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="divide-y divide-white/[0.06] md:hidden">
          {items.map((item) => {
            const color =
              rarityColors[item.rarity.toLowerCase()] || rarityColors.common;
            const botName = botMap[item.botSteamId] || `Bot (${item.botSteamId.slice(-4)})`;
            const isSelected = selectedAssetIds.has(item.assetId);

            return (
              <div
                key={item.assetId}
                className={`space-y-3 p-4 ${isSelected ? "bg-accent/[0.08]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <SelectionCheckbox
                    checked={isSelected}
                    onChange={() => onToggleSelectItem(item.assetId)}
                    ariaLabel={item.name}
                  />
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-[#0d0a18] p-1"
                    style={{ borderColor: `${color}35` }}
                  >
                    {item.iconUrl && (
                      <SkinImage
                        src={item.iconUrl}
                        alt={item.name}
                        width={42}
                        height={42}
                        maxWidth={42}
                        maxHeight={42}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="break-words text-sm font-semibold text-white">
                      {item.name}
                    </h4>
                    <span className="mt-0.5 inline-block text-xs text-[#8e88a6]">
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-md border border-white/[0.06] bg-[#141124] p-3 text-xs">
                  <div className="min-w-0">
                    <span className="block text-[11px] text-[#8e88a6]">Asset ID</span>
                    <span className="mt-0.5 block truncate font-mono text-white select-all tabular-nums">
                      {item.assetId}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] text-[#8e88a6]">
                      {t("admin.inventory.steamBots")}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span className="truncate font-medium text-white">{botName}</span>
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-white/[0.05] pt-2">
                    <span className="block text-[11px] text-[#8e88a6]">
                      {t("admin.inventory.floatValue")}
                    </span>
                    <span className="mt-0.5 block font-mono text-white tabular-nums">
                      {item.float !== null && item.float !== undefined ? item.float.toFixed(5) : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="block text-[11px] text-[#8e88a6]">
                        {t("common.price")}
                      </span>
                      <span className="block text-sm font-semibold text-emerald-400 tabular-nums">
                        ${item.price.toLocaleString()}
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center select-none">
                      <input
                        type="checkbox"
                        checked={item.marketable !== false}
                        onChange={(e) => onToggleMarketable(item, e.target.checked)}
                        aria-label={`${t("admin.inventory.visible")}: ${item.name}`}
                        className="sr-only peer"
                      />
                      <div className="h-6 w-11 rounded-full border border-white/10 bg-[#1c1833] transition-colors peer-checked:border-accent/50 peer-checked:bg-accent" />
                      <div className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditPrice(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-[#1c1833] px-3 text-xs font-semibold text-white hover:border-accent/40 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 text-accent" />
                      <span>{t("common.edit")}</span>
                    </button>
                    <a
                      href={`https://steamcommunity.com/profiles/${item.botSteamId}/inventory/#730`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#1c1833] text-[#9e98b6] hover:text-white"
                      title={t("admin.inventory.viewBotInventory")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => onPageChange(page)}
        summary={`${t("skinGrid.pagination")} ${currentPage} / ${totalPages}`}
        previousLabel={t("skinGrid.previous")}
        nextLabel={t("skinGrid.next")}
      />
    </div>
  );
}
