"use client";

import { useState } from "react";
import { FilterSidebar } from "@/features/skins/ui/FilterSidebar";
import { useInventory } from "@/features/inventory/context/InventoryContext";
import { InventoryGrid } from "@/features/inventory/ui/InventoryGrid";
import { SellBasket } from "@/features/inventory/ui/SellBasket";
import { RefreshCw, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/shared/i18n/I18nProvider";

function SellPageContent() {
  const { inventoryItems, loading, syncing, refetchInventory, selectedItems } = useInventory();
  const [isSellBasketOpen, setIsSellBasketOpen] = useState(false);
  const { t } = useI18n();


  return (
    <main className="mx-auto max-w-full px-4 sm:px-6 pt-24 pb-20 overflow-x-hidden">
      <div className="flex flex-col gap-6 lg:flex-row items-start overflow-x-hidden">
        {/* Sidebar Placeholder */}
        <div className="hidden lg:block w-64 flex-shrink-0" />
        
        <FilterSidebar />

        {/* Main Content: Inventory */}
        <section className="w-full min-w-0 flex-1">
          <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter">
                {t("sell.title")}
              </h1>
              <p className="text-xs sm:text-sm text-[#84849b] mt-0.5">{t("sell.description")}</p>
            </div>


          </header>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-white/5 p-3 rounded-[3px]">
            <span className="text-[10px] sm:text-xs font-bold text-[#84849b] uppercase tracking-widest">
              {loading ? t("sell.loadingInventory") : t("sell.inventoryCount", { count: inventoryItems.length })}
            </span>
            {!loading && (
              <button
                onClick={() => refetchInventory(true)}
                disabled={syncing}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-[3px] bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-accent/30 text-[9.5px] font-black uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer w-full sm:w-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent group-hover:text-white transition-colors ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? t("sell.syncing") : t("sell.refreshInventory")}
              </button>
            )}
          </div>
          
          <InventoryGrid />
        </section>

        {/* Right Panel: Sell List */}
        <aside className="hidden xl:block xl:w-80 flex-shrink-0 xl:sticky xl:top-24 bg-card rounded-2xl p-5 border border-white/5">
          <SellBasket embedded />
        </aside>
      </div>

      {/* Floating sell basket for < xl screens */}
      <motion.button
        type="button"
        onClick={() => setIsSellBasketOpen(true)}
        initial={{ opacity: 0, x: 24, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        whileTap={{ scale: 0.94 }}
        className="fixed right-4 bottom-6 z-50 flex xl:hidden h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_30px_rgba(217,70,239,0.35)]"
        aria-label={t("sell.openSummary")}
      >
        <ShoppingBag className="h-5 w-5" />
        {selectedItems.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white/20 bg-[#0f0d1e] px-1.5 text-[9px] font-black text-white">
            {selectedItems.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isSellBasketOpen && (
          <motion.div
            className="fixed inset-0 z-[90] xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              aria-label={t("sell.closeSummary")}
              onClick={() => setIsSellBasketOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.aside
              className="absolute bottom-0 right-0 top-0 flex h-dvh w-full max-w-md flex-col overflow-hidden bg-card border-l border-white/10 shadow-2xl shadow-black/80"
              initial={{ x: "100%", opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.6 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-[#110f1e]/80 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                    {t("sell.summary")}
                  </p>
                  <p className="truncate text-xs font-bold text-white">
                    {selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSellBasketOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={t("sell.closeSummary")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                <SellBasket embedded />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function SellPage() {
  return <SellPageContent />;
}
