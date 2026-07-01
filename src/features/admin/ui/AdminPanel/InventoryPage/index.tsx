"use client";

import React from "react";
import {
  Database,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { StoreItem } from "../../../domain/types";
import { PriceEditModal } from "../PriceEditModal";
import { useInventoryPage } from "./useInventoryPage";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { InventoryStats } from "./InventoryStats";
import { InventoryList } from "./InventoryList";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminSearchInput,
  AdminSection,
  AdminToolbar,
} from "../../AdminShell";

interface InventoryPageProps {
  initialItems?: StoreItem[];
}

type InventorySortBy = "price_asc" | "price_desc" | "float_asc" | "float_desc";

export function InventoryPage({ initialItems = [] }: InventoryPageProps) {
  const { t } = useI18n();
  const {
    loading,
    syncing,
    error,
    syncSuccess,
    search,
    setSearch,
    sortBy,
    setSortBy,
    priceModalItem,
    setPriceModalItem,
    stats,
    totalInventoryPages,
    currentInventoryPage,
    visibleInventoryItems,
    handleUpdateItemPrice,
    handleToggleMarketable,
    triggerSync,
    setInventoryPage,
    botMap,
  } = useInventoryPage(initialItems);

  return (
    <div className="space-y-8">
      {/* Statistics Grid */}
      <InventoryStats stats={stats} loading={loading} />

      {/* Filters and Inventory List Section */}
      <AdminSection className="space-y-6">
        <AdminToolbar className="justify-between">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("admin.inventory.searchPlaceholder")}
            className="md:max-w-md"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <AdminSelect
              value={sortBy}
              onChange={(v) => setSortBy(v as InventorySortBy)}
              options={[
                { value: "price_desc", label: t("admin.inventory.sortPriceDesc") },
                { value: "price_asc", label: t("admin.inventory.sortPriceAsc") },
                { value: "float_asc", label: t("sort.Float: Menor a Mayor") },
                { value: "float_desc", label: t("sort.Float: Mayor a Menor") },
              ]}
            />

            <AdminButton
              type="button"
              onClick={triggerSync}
              disabled={syncing}
              icon={RefreshCw}
              loading={syncing}
              variant="primary"
            >
              {syncing ? t("admin.inventory.syncingInventory") : t("admin.inventory.syncInventoryBots")}
            </AdminButton>
          </div>
        </AdminToolbar>

        {syncSuccess && (
          <AdminAlert tone="success">{syncSuccess}</AdminAlert>
        )}

        {error && (
          <AdminAlert>
            <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          </AdminAlert>
        )}

        {loading ? (
          <AdminLoadingState label={t("buy.loadingCatalog")} />
        ) : visibleInventoryItems.length === 0 ? (
          <AdminEmptyState icon={Database} title={t("skinGrid.noResultsDescription")} />
        ) : (
          <InventoryList
            items={visibleInventoryItems}
            botMap={botMap}
            onEditPrice={setPriceModalItem}
            onToggleMarketable={handleToggleMarketable}
            currentPage={currentInventoryPage}
            totalPages={totalInventoryPages}
            onPageChange={setInventoryPage}
          />
        )}
      </AdminSection>

      {/* Price Edit Modal popup */}
      {priceModalItem && (
        <PriceEditModal
          item={priceModalItem}
          onClose={() => setPriceModalItem(null)}
          onSuccess={handleUpdateItemPrice}
        />
      )}
    </div>
  );
}
