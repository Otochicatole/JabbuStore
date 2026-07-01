"use client";

import React from "react";
import {
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";
import { rarityColors } from "@/features/admin/ui/AdminPanel/utils";
import { useMarketCatalog } from "./useMarketCatalog";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";

function getCleanSearchName(fullName: string): string {
  if (!fullName) return "";
  let name = fullName;
  const phases = [
    " | Phase 1",
    " | Phase 2",
    " | Phase 3",
    " | Phase 4",
    " | Ruby",
    " | Sapphire",
    " | Black Pearl",
    " | Emerald",
  ];
  phases.forEach((p) => {
    name = name.replace(p, "");
  });
  const exteriors = [
    " (Factory New)",
    " (Minimal Wear)",
    " (Field-Tested)",
    " (Well-Worn)",
    " (Battle-Scarred)",
  ];
  exteriors.forEach((ext) => {
    name = name.replace(ext, "");
  });
  name = name.replace("★ ", "").replace("★", "");
  return name.trim();
}

function youpinAssetUrl(asset: { externalId: string | null; name: string }): string {
  if (asset.externalId) {
    return `https://www.youpin898.com/goodDetail?id=${encodeURIComponent(asset.externalId)}`;
  }
  return `https://www.youpin898.com/goodList?gameId=730&keywords=${encodeURIComponent(getCleanSearchName(asset.name))}`;
}

const ITEMS_PER_PAGE = 50;

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
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
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return pages;
}

export function MarketCatalog() {
  const { t } = useI18n();
  const {
    listings,
    loading,
    syncing,
    error,
    syncMessage,
    search,
    setSearch,
    sortBy,
    setSortBy,
    filtered,
    youpinCount,
    handleSync,
    fetchListings,
    currentPage,
    setCurrentPage,
  } = useMarketCatalog();

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentActivePage = currentPage > totalPages ? 1 : currentPage;
  const paginatedListings = filtered.slice(
    (currentActivePage - 1) * ITEMS_PER_PAGE,
    currentActivePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            {t("admin.market.title")}
          </h2>
          <p className="text-[10px] text-[#84849b] font-mono mt-0.5 uppercase tracking-wider">
            {t("admin.market.description", {
              count: listings.length.toLocaleString(),
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={fetchListings}
            disabled={loading}
            className="px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-[10px] font-black uppercase tracking-wider text-white rounded-[3px] transition-all cursor-pointer disabled:opacity-50"
          >
            {t("common.refresh")}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2.5 bg-accent hover:brightness-110 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider text-white rounded-[3px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? t("admin.market.syncing") : t("admin.market.sync")}
          </button>
        </div>
      </div>

      {(syncMessage || error) && (
        <div
          className={`p-3 rounded-[3px] text-xs font-bold border ${
            error
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {error || syncMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#110f1e] border border-white/5 rounded-[3px] p-4 flex flex-col justify-center">
          <div className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider">
            {t("admin.market.totalAssets")}
          </div>
          <div className="text-2xl font-black mt-1 text-white">
            {listings.length.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#110f1e] border border-white/5 rounded-[3px] p-4 flex flex-col justify-center">
          <div className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider">
            {t("admin.market.visibleAssets")}
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-400">
            {youpinCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#84849b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.market.searchPlaceholder")}
              className="w-full bg-[#110f1e]/80 border border-white/5 pl-9 pr-3 py-2 text-xs font-bold text-white placeholder-[#84849b] rounded-[3px] outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sort */}
            <AdminSelect
              value={sortBy}
              onChange={(v) =>
                setSortBy(v as "price_desc" | "price_asc" | "name")
              }
              options={[
                { value: "price_desc", label: t("admin.market.sortPriceDesc") },
                { value: "price_asc", label: t("admin.market.sortPriceAsc") },
                { value: "name", label: t("admin.market.sortName") },
              ]}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[3px] text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Listings List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mb-2" />
            <span className="text-[10px] text-[#84849b] font-black uppercase tracking-widest">
              {t("admin.market.loading")}
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#84849b] font-bold">
            {t("admin.market.noResults")}
          </div>
        ) : (
          <div className="border border-white/5 rounded-[3px] overflow-hidden">
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 bg-[#110f1e]/60 text-[#84849b] text-[9px] font-black uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">{t("common.item")}</th>
                    <th className="py-3 px-4">Float / Pattern</th>
                    <th className="py-3 px-4">{t("admin.market.wear")}</th>
                    <th className="py-3 px-4">{t("admin.market.basePrice")}</th>
                    <th className="py-3 px-4">{t("admin.market.storePrice")}</th>
                    <th className="py-3 px-4 text-right">{t("admin.market.links")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedListings.map((l) => {
                    const color =
                      rarityColors[l.rarity.toLowerCase()] ||
                      rarityColors.common;
                    return (
                      <tr
                        key={l.id}
                        className="hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="py-2.5 px-4 font-black text-white flex items-center gap-3">
                          <div
                            className="relative w-10 h-10 rounded-[3px] bg-[#110f1e]/60 border border-white/[0.03] flex items-center justify-center p-1 shrink-0"
                            style={{ borderColor: `${color}15` }}
                          >
                            <div
                              className="absolute inset-0 blur-md opacity-20 pointer-events-none rounded-[3px]"
                              style={{
                                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                              }}
                            />
                            {l.iconUrl && (
                              <img
                                src={l.iconUrl}
                                alt={l.name}
                                className="w-8 h-8 object-contain z-10"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-white">{l.name}</p>
                            <p className="text-[10px] text-[#84849b] uppercase font-mono mt-0.5">
                              {l.category}
                            </p>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[10px] text-white/80">
                          <div>{l.float?.toFixed(6) ?? "—"}</div>
                          <div className="text-[#84849b]">#{l.pattern ?? "—"}</div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs">
                          {l.exterior ? (
                            <span className="text-white font-medium uppercase text-[10px]">
                              {l.exterior}
                            </span>
                          ) : (
                            <span className="text-[#84849b]">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#84849b]">
                          ${l.price.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-green-400 font-bold">
                          ${(l.displayPrice ?? l.price).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={youpinAssetUrl(l)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-all cursor-pointer text-[10px] font-bold"
                              title={t("admin.market.viewYouPin")}
                            >
                              YouPin <ExternalLink className="w-3 h-3 inline-block ml-1" />
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
              {paginatedListings.map((l) => {
                const color =
                  rarityColors[l.rarity.toLowerCase()] ||
                  rarityColors.common;
                return (
                  <div
                    key={l.id}
                    className="p-4 flex flex-col gap-3.5 hover:bg-white/[0.01] transition-colors relative"
                  >
                    <div className="flex items-start gap-3">
                      {/* Image Container with Glow */}
                      <div
                        className="relative w-12 h-12 rounded-[3px] bg-[#110f1e]/60 border border-white/[0.03] flex items-center justify-center p-1 shrink-0"
                        style={{ borderColor: `${color}15` }}
                      >
                        <div
                          className="absolute inset-0 blur-md opacity-25 pointer-events-none rounded-[3px]"
                          style={{
                            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                          }}
                        />
                        {l.iconUrl && (
                          <img
                            src={l.iconUrl}
                            alt={l.name}
                            className="w-8 h-8 object-contain z-10"
                          />
                        )}
                      </div>

                      {/* Name & Details */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-white text-xs leading-snug break-words">
                          {l.name}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="inline-block text-[8px] text-[#84849b] uppercase font-mono tracking-wider bg-white/[0.02] border border-white/5 px-1 py-0.5 rounded-sm">
                            {l.category}
                          </span>
                          {l.exterior && (
                            <span className="inline-block text-[8px] text-white/90 uppercase font-mono tracking-wider bg-white/10 px-1 py-0.5 rounded-sm border border-white/5 font-bold">
                              {l.exterior}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-[3px] text-[8px] font-mono uppercase font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            youpin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sugeridos and Resell Prices Grid */}
                    <div className="grid grid-cols-2 gap-2.5 bg-white/[0.01] border border-white/5 p-3 rounded-[3px] text-[9.5px] font-mono">
                      <div>
                        <span className="text-[#84849b] block text-[8px] uppercase tracking-widest font-bold">Float</span>
                        <span className="text-white/80 block mt-0.5">{l.float?.toFixed(6) ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-[#84849b] block text-[8px] uppercase tracking-widest font-bold">Pattern</span>
                        <span className="text-white/80 block mt-0.5">#{l.pattern ?? "—"}</span>
                      </div>
                      <div className="col-span-2 border-t border-white/[0.03] pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-[#84849b] block text-[8px] uppercase tracking-widest font-bold">{t("admin.market.storePriceShort")}</span>
                          <span className="font-extrabold text-green-400 text-xs block mt-0.5">
                            ${(l.displayPrice ?? l.price).toLocaleString()}
                          </span>
                        </div>

                        <a
                          href={youpinAssetUrl(l)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-all cursor-pointer text-[9px] font-black uppercase tracking-wider flex items-center gap-1 min-h-[30px]"
                        >
                          <span>YouPin</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-[#110f1e]/20 border-t border-white/5">
                <span className="text-[10px] text-[#84849b] font-bold uppercase tracking-wider font-mono">
                  {t("admin.market.page", {
                    current: currentActivePage,
                    total: totalPages,
                    count: filtered.length.toLocaleString(),
                  })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentActivePage === 1}
                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
                  >
                    {t("admin.market.previous")}
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers(currentActivePage, totalPages).map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (typeof page === "number") setCurrentPage(page);
                        }}
                        disabled={page === "..."}
                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-[3px] border transition-all cursor-pointer select-none ${
                          page === currentActivePage
                            ? "bg-accent border-accent text-white font-black"
                            : "bg-white/[0.02] border-white/5 text-[#84849b] hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentActivePage === totalPages}
                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
                  >
                    {t("common.next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default MarketCatalog;
