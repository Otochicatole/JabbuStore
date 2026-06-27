"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, RotateCcw, Filter, X } from "lucide-react";
import { useFilters } from "@/features/filters/context/FilterContext";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { stripLocaleFromPathname } from "@/shared/i18n/routing";
import Image from "next/image";

const CATEGORIES = [
  { value: "Cuchillos", labelKey: "filters.category.knives", icon: "knives.webp" },
  { value: "Guantes", labelKey: "filters.category.gloves", icon: "gloves.webp" },
  { value: "Pistolas", labelKey: "filters.category.pistols", icon: "pistols.webp" },
  { value: "Subfusiles", labelKey: "filters.category.smgs", icon: "smgs.webp" },
  { value: "Rifles de asalto", labelKey: "filters.category.assaultRifles", icon: "asault-rifles.webp" },
  { value: "Rifles de francotirador", labelKey: "filters.category.sniperRifles", icon: "snipers.webp" },
  { value: "Escopetas", labelKey: "filters.category.shotguns", icon: "shotguns.webp" },
  { value: "Ametralladoras", labelKey: "filters.category.machineGuns", icon: "machine-guns.webp" },
  { value: "Agentes", labelKey: "filters.category.agents", icon: "agents.webp" },
  { value: "Contenedores", labelKey: "filters.category.containers" },
  { value: "Kits musicales", labelKey: "filters.category.musicKits" },
  { value: "Parches", labelKey: "filters.category.patches" },
  { value: "Pegatinas", labelKey: "filters.category.stickers", icon: "stickers.webp" },
];

const CONDITIONS = [
  { value: "Recién fabricado", labelKey: "filters.condition.factoryNew" },
  { value: "Casi nuevo", labelKey: "filters.condition.minimalWear" },
  { value: "Algo desgastado", labelKey: "filters.condition.fieldTested" },
  { value: "Bastante desgastado", labelKey: "filters.condition.wellWorn" },
  { value: "Deplorable", labelKey: "filters.condition.battleScarred" },
];

export const FilterSidebar = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const isSellPage = stripLocaleFromPathname(pathname) === "/sell";
  const [isOpenMobile, setIsMobileOpen] = useState(false);

  const {
    searchQuery, setSearchQuery,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    selectedCategories, toggleCategory,
    selectedConditions, toggleCondition,
    immediateTradeOnly, setImmediateTradeOnly,
    groupSameItems, setGroupSameItems,
    clearFilters,
  } = useFilters();

  const [isConditionOpen, setIsConditionOpen] = useState(false);

  // Original filters layout and elements character-by-character to avoid changing any styles
  const renderFiltersContent = () => (
    <>
      {/* Search */}
      <div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-accent transition-colors z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("buy.searchPlaceholder")}
            className="w-full bg-transparent border border-white/5 pl-10 pr-3 py-2.5 text-xs font-bold text-white outline-none focus:border-accent/50 transition-all rounded-lg"
          />
        </div>
      </div>

      {/* Clear Filters */}
      <div className="relative group w-full">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            clearFilters();
            setIsMobileOpen(false);
          }}
          className="w-full relative flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white hover:border-accent/40 transition-all duration-300 cursor-pointer overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          <div className="relative z-10 flex items-center justify-center gap-1.5 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]">
            <RotateCcw className="h-3 w-3 group-hover:rotate-[-180deg] transition-transform duration-500" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t("filters.reset")}</span>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 border border-accent/20 rounded-lg" />
        </motion.button>
      </div>

      {/* Price Range */}
      <div className="border-b border-white/5 pb-5">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{t("filters.priceRange")}</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder={t("filters.min")}
            className="w-full border border-white/5 p-2.5 text-xs font-bold text-white outline-none focus:border-accent/50 transition-colors rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/20 text-xs font-bold">—</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={t("filters.max")}
            className="w-full border border-white/5 p-2.5 text-xs font-bold text-white outline-none focus:border-accent/50 transition-colors rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Trade Inmediato (Instant Trade Only) - Solo visible en compra, no en venta (/sell) */}
      {!isSellPage && (
        <div className="border-b border-white/5 pb-5">
          <button
            onClick={() => setImmediateTradeOnly(!immediateTradeOnly)}
            className="flex items-center gap-3 cursor-pointer group select-none w-full text-left bg-transparent border-none p-0 outline-none"
          >
            <div
              className={`
                relative flex items-center justify-center h-5 w-5 rounded-[4px] border transition-all duration-300 shrink-0
                ${immediateTradeOnly
                  ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'border-white/10 bg-background group-hover:border-white/20'
                }
              `}
            >
              <div className={`
                h-2 w-2 rounded-full bg-emerald-400 transition-opacity duration-300
                ${immediateTradeOnly ? 'opacity-100 animate-pulse' : 'opacity-0'}
              `} />
            </div>
            <div>
              <span className={`
                text-[11px] font-black uppercase tracking-wider transition-colors duration-300 flex items-center gap-1
                ${immediateTradeOnly ? 'text-emerald-400' : 'text-[#84849b] group-hover:text-white/70'}
              `}>
                ⚡ {t("filters.instantTrade")}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Estado (Condition) */}
      <div className="border-b border-white/5 pb-5">
        <button
          onClick={() => setIsConditionOpen(!isConditionOpen)}
          className="w-full flex items-center justify-between mb-2 group text-left cursor-pointer"
        >
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-white/50 transition-colors">{t("filters.exterior")}</h3>
          <ChevronRight className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${isConditionOpen ? 'rotate-90 text-accent' : ''}`} />
        </button>

        <AnimatePresence>
          {isConditionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-2 py-3">
                {CONDITIONS.map((condition) => (
                  <label
                    key={condition.value}
                    onClick={() => toggleCondition(condition.value)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`
                        relative flex items-center justify-center h-4 w-4 rounded-[2px] border transition-all duration-200
                        ${selectedConditions.includes(condition.value)
                          ? 'border-accent bg-accent/10'
                          : 'border-white/10 bg-background group-hover:border-white/20'
                        }
                      `}
                    >
                      <div className={`
                        h-1.5 w-1.5 rounded-full bg-accent transition-opacity duration-200
                        ${selectedConditions.includes(condition.value) ? 'opacity-100' : 'opacity-0'}
                      `} />
                    </div>
                    <span className={`
                      text-[11px] font-bold transition-colors duration-200
                      ${selectedConditions.includes(condition.value) ? 'text-white' : 'text-[#84849b] group-hover:text-white/70'}
                    `}>
                      {t(condition.labelKey)}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Categorías Grid */}
      <div>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">{t("filters.category")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.value);
            return (
              <button
                key={category.value}
                onClick={() => toggleCategory(category.value)}
                className={`
                  relative h-[100px] w-full flex flex-col items-center justify-center p-2 rounded-[4px] border transition-all duration-300 group active:scale-95 cursor-pointer overflow-visible
                  ${isSelected
                    ? 'bg-accent/10 border-accent'
                    : 'bg-card border-transparent hover:border-accent/40'
                  }
                `}
              >
                {/* Spotlight/Glow beam coming from below (matching SkinCard style) */}
                <div
                  className={`absolute bottom-0 left-0 right-0 mx-auto w-full h-full transition-all duration-500 ease-out pointer-events-none rounded-[4px] ${
                    isSelected 
                      ? 'opacity-30' 
                      : 'opacity-0 translate-y-2 group-hover:opacity-30 group-hover:translate-y-0'
                  }`}
                  style={{
                    background: 'radial-gradient(ellipse at bottom, var(--accent) 0%, transparent 70%)',
                  }}
                />

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#ff4b4b] animate-pulse shadow-[0_0_8px_rgba(255,75,75,0.8)]" />
                )}

                {category.icon && (
                  <div className="relative w-[66px] h-[66px] flex items-center justify-center mb-1 transition-all duration-500 group-hover:-translate-y-5 group-hover:scale-[1.8] z-10 pointer-events-none">
                    <Image 
                      src={`/category-images/${category.icon}`} 
                      alt={t(category.labelKey)} 
                      width={256} 
                      height={256} 
                      unoptimized
                      className={`w-[66px] h-[66px] object-contain transition-all duration-500 ${
                        isSelected 
                          ? 'opacity-100 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)] animate-hologram-flicker' 
                          : 'opacity-60 group-hover:opacity-100 group-hover:animate-hologram-flicker'
                      }`}
                    />
                  </div>
                )}
                <span className={`
                  text-[9px] font-black uppercase text-center leading-tight tracking-tight mt-1 transition-all duration-300 z-10
                  ${isSelected ? 'text-white' : 'text-[#84849b] group-hover:text-accent/80'}
                `}>
                  {t(category.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 🚀 DESKTOP PERSISTENT VIEW */}
      <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 custom-scrollbar overscroll-contain lg:fixed lg:top-24 lg:left-6 pb-10">
        {renderFiltersContent()}
      </aside>

      {/* 📱 MOBILE FLOATING FILTER TOGGLE BUTTON */}
      <div className="lg:hidden w-full flex items-center justify-between mb-4 gap-2 bg-[#110f1e]/40 p-2 border border-white/5 rounded-[3px]">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#84849b] font-mono leading-tight max-w-[150px] truncate">{t("filters.searchAndFilters")}</span>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-accent text-white rounded-[3px] text-[9.5px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(217,70,239,0.2)] shrink-0 cursor-pointer"
        >
          <Filter className="w-3 h-3" />
          {t("filters.filterCatalog")}
        </button>
      </div>

      {/* 📱 MOBILE SLIDING BOTTOM SHEET DRAWER */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-[100] lg:hidden flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Drawer Sheet sliding from bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="relative w-full max-h-[85vh] bg-[#0c0a1a] border-t border-white/10 rounded-t-3xl p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-white"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-accent" />
                  <span className="text-xs font-black uppercase tracking-widest">{t("filters.searchFilters")}</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inner Filters Content with EXACT original styles */}
              <div className="space-y-6">
                {renderFiltersContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
