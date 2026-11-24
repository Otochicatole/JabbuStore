"use client";

import React from "react";
import {
  Database,
  ExternalLink,
  Globe,
  RefreshCw,
} from "lucide-react";
import { rarityColors } from "@/features/admin/shared/utils";
import { useMarketCatalog } from "./useMarketCatalog";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminPagination,
  AdminSearchInput,
  AdminSection,
  AdminStatCard,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

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

export function MarketCatalog() {
  const { t } = useI18n();
  const {
    listings,
    loading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    filtered,
    youpinCount,
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
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.market.title")}
        description={t("admin.market.description", {
          count: listings.length.toLocaleString(),
        })}
        icon={Globe}
        actions={
          <AdminButton
            type="button"
            onClick={fetchListings}
            disabled={loading}
            loading={loading}
            icon={RefreshCw}
            variant="secondary"
          >
            {t("common.refresh")}
          </AdminButton>
        }
      />

      {error && <AdminAlert>{error}</AdminAlert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AdminStatCard
          label={t("admin.market.totalAssets")}
          value={listings.length.toLocaleString()}
          icon={Database}
          loading={loading}
        />
        <AdminStatCard
          label={t("admin.market.visibleAssets")}
          value={<span className="text-emerald-400">{youpinCount.toLocaleString()}</span>}
          icon={Globe}
          tone="green"
          loading={loading}
        />
      </div>

      <AdminSection className="space-y-4">
        <AdminToolbar className="justify-between border-0 bg-transparent p-0">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("admin.market.searchPlaceholder")}
          />

          <AdminSelect
            value={sortBy}
            onChange={(v) => setSortBy(v as "price_desc" | "price_asc" | "name")}
            className="w-full md:w-56"
            options={[
              { value: "price_desc", label: t("admin.market.sortPriceDesc") },
              { value: "price_asc", label: t("admin.market.sortPriceAsc") },
              { value: "name", label: t("admin.market.sortName") },
            ]}
          />
        </AdminToolbar>

        {loading ? (
          <AdminLoadingState label={t("admin.market.loading")} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState icon={Globe} title={t("admin.market.noResults")} />
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#100d1e]">
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-[#1a1630] text-xs font-semibold text-[#9e98b6]">
                      <th className="px-4 py-3">{t("common.item")}</th>
                      <th className="px-4 py-3">{t("admin.market.wear")}</th>
                      <th className="px-4 py-3">{t("admin.market.basePrice")}</th>
                      <th className="px-4 py-3">{t("admin.market.storePrice")}</th>
                      <th className="px-4 py-3 text-right">{t("admin.market.links")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-[13px]">
                    {paginatedListings.map((l) => {
                      const color =
                        rarityColors[l.rarity.toLowerCase()] || rarityColors.common;
                      return (
                        <tr key={l.id} className="transition-colors hover:bg-white/[0.03]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-[#0d0a18] p-1"
                                style={{ borderColor: `${color}35` }}
                              >
                                {l.iconUrl && (
                                  <img
                                    src={l.iconUrl}
                                    alt={l.name}
                                    className="h-8 w-8 object-contain"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">{l.name}</p>
                                <p className="mt-0.5 text-xs text-[#8e88a6]">{l.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#d4cfe6]">
                            {l.exterior || <span className="text-[#746e8d]">N/A</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[#9e98b6] tabular-nums">
                            ${l.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-emerald-400 tabular-nums">
                            ${(l.displayPrice ?? l.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={youpinAssetUrl(l)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                              title={t("admin.market.viewYouPin")}
                            >
                              <span>YouPin</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-white/[0.06] md:hidden">
                {paginatedListings.map((l) => {
                  const color =
                    rarityColors[l.rarity.toLowerCase()] || rarityColors.common;
                  return (
                    <div key={l.id} className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-[#0d0a18] p-1"
                          style={{ borderColor: `${color}35` }}
                        >
                          {l.iconUrl && (
                            <img
                              src={l.iconUrl}
                              alt={l.name}
                              className="h-8 w-8 object-contain"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="break-words text-sm font-semibold text-white">
                            {l.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <AdminBadge tone="neutral">{l.category}</AdminBadge>
                            {l.exterior && <AdminBadge tone="neutral">{l.exterior}</AdminBadge>}
                            <AdminBadge tone="success">YouPin</AdminBadge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-md border border-white/[0.06] bg-[#141124] px-3 py-2.5">
                        <div>
                          <span className="block text-[11px] text-[#8e88a6]">
                            {t("admin.market.storePriceShort")}
                          </span>
                          <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                            ${(l.displayPrice ?? l.price).toLocaleString()}
                          </span>
                        </div>
                        <a
                          href={youpinAssetUrl(l)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/12 px-3 text-xs font-semibold text-emerald-300"
                        >
                          <span>YouPin</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <AdminPagination
              currentPage={currentActivePage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              summary={t("admin.market.page", {
                current: currentActivePage,
                total: totalPages,
                count: filtered.length.toLocaleString(),
              })}
              previousLabel={t("admin.market.previous")}
              nextLabel={t("common.next")}
            />
          </div>
        )}
      </AdminSection>
    </div>
  );
}
export default MarketCatalog;
