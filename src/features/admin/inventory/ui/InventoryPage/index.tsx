"use client";

import React from "react";
import {
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { StoreItem } from "@/features/admin/domain/types";
import { PriceEditModal } from "@/features/admin/orders/ui/PriceEditModal";
import { useInventoryPage } from "./useInventoryPage";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { InventoryStats } from "./InventoryStats";
import { InventoryList } from "./InventoryList";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSearchInput,
  AdminSection,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

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
    selectedAssetIds,
    selectedCount,
    bulkUpdating,
    allVisibleSelected,
    someVisibleSelected,
    filteredCount,
    toggleSelectItem,
    toggleSelectAllVisible,
    selectAllFiltered,
    clearSelection,
    handleBulkMarketable,
  } = useInventoryPage(initialItems);

  return (
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.inventoryBots")}
        description={t("admin.inventory.syncedItems")}
        icon={Database}
        actions={
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
        }
      />

      <InventoryStats stats={stats} loading={loading} />

      <AdminSection className="space-y-4">
        <AdminToolbar className="justify-between border-0 bg-transparent p-0">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("admin.inventory.searchPlaceholder")}
            className="md:max-w-md"
          />

          <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center md:w-auto">
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
          </div>
        </AdminToolbar>

        {selectedCount > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border border-accent/25 bg-accent/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-fuchsia-200">
              <span className="font-semibold text-white">
                {t("admin.inventory.selectedCount", { count: selectedCount })}
              </span>
              {selectedCount < filteredCount && (
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="underline underline-offset-2 hover:text-white cursor-pointer"
                >
                  {t("admin.inventory.selectAll")} ({filteredCount})
                </button>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="text-[#c2bdd6] underline underline-offset-2 hover:text-white cursor-pointer"
              >
                {t("admin.inventory.clearSelection")}
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AdminButton
                type="button"
                size="sm"
                onClick={() => handleBulkMarketable(true)}
                disabled={bulkUpdating}
                loading={bulkUpdating}
                icon={Eye}
                variant="success"
              >
                {t("admin.inventory.setVisible")}
              </AdminButton>
              <AdminButton
                type="button"
                size="sm"
                onClick={() => handleBulkMarketable(false)}
                disabled={bulkUpdating}
                loading={bulkUpdating}
                icon={EyeOff}
                variant="secondary"
              >
                {t("admin.inventory.setHidden")}
              </AdminButton>
            </div>
          </div>
        )}

        {syncSuccess && <AdminAlert tone="success">{syncSuccess}</AdminAlert>}

        {error && (
          <AdminAlert>
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0" />
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
            selectedAssetIds={selectedAssetIds}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            onToggleSelectItem={toggleSelectItem}
            onToggleSelectAllVisible={toggleSelectAllVisible}
            currentPage={currentInventoryPage}
            totalPages={totalInventoryPages}
            onPageChange={setInventoryPage}
          />
        )}
      </AdminSection>

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
