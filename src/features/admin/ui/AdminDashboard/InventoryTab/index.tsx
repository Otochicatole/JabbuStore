import React from "react";
import {
  Loader2,
  Database,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { StoreItem } from "../../../domain/types";
import { PriceEditModal } from "../PriceEditModal";
import { useInventoryTab } from "./useInventoryTab";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { InventoryStats } from "./InventoryStats";
import { InventoryList } from "./InventoryList";

function getCleanSearchName(fullName: string): string {
  if (!fullName) return "";
  let name = fullName;

  // Remove Doppler phases
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

  // Remove exteriors
  const exteriors = [
    " (Factory New)",
    " (Minimal Wear)",
    " (Field-Tested)",
    " (Well-Worn)",
    " (Battle-Scarred)",
    " | Factory New",
    " | Minimal Wear",
    " | Field-Tested",
    " | Well-Worn",
    " | Battle-Scarred",
    " Factory New",
    " Minimal Wear",
    " Field-Tested",
    " Well-Worn",
    " Battle-Scarred",
  ];
  exteriors.forEach((ext) => {
    name = name.replace(ext, "");
  });

  // Remove star symbols
  name = name.replace("★ ", "");
  name = name.replace("★", "");

  return name.trim();
}

interface InventoryTabProps {
  initialItems?: StoreItem[];
}

type InventorySortBy = "price_asc" | "price_desc" | "float_asc" | "float_desc";

export function InventoryTab({ initialItems = [] }: InventoryTabProps) {
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
    inventoryPage,
    setInventoryPage,
    botMap,
  } = useInventoryTab(initialItems);

  return (
    <div className="space-y-8">
      {/* Statistics Grid */}
      <InventoryStats stats={stats} loading={loading} />

      {/* Filters and Inventory List Section */}
      <div className="bg-[#110f1e]/20 border border-white/5 rounded-[3px] p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#84849b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.inventory.searchPlaceholder")}
              className="w-full bg-[#110f1e]/40 border border-white/5 pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-[#84849b] rounded-[3px] outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Sort */}
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

            <button
              type="button"
              onClick={triggerSync}
              disabled={syncing}
              className="w-full sm:w-auto px-4 py-2.5 bg-accent hover:brightness-110 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider text-white rounded-[3px] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? t("admin.inventory.syncingInventory") : t("admin.inventory.syncInventoryBots")}
            </button>
          </div>
        </div>

        {syncSuccess && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-[3px] text-emerald-400">
            <p className="text-xs font-bold">{syncSuccess}</p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-[3px] text-red-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        {/* Items Grid/List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
            <p className="text-[10px] text-[#84849b] font-black uppercase tracking-widest">
              {t("buy.loadingCatalog")}
            </p>
          </div>
        ) : visibleInventoryItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Database className="w-8 h-8 text-[#84849b] mb-3" />
            <p className="text-xs text-[#84849b] font-bold">
              {t("skinGrid.noResultsDescription")}
            </p>
          </div>
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
      </div>

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
