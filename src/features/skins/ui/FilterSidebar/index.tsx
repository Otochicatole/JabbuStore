"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, RotateCcw, Filter, X } from "lucide-react";
import {
  cloneFilterState,
  createDefaultFilterState,
  type FilterState,
  useFilters,
} from "@/features/filters/context/FilterContext";
import { useI18n } from "@/shared/i18n/I18nProvider";
import Image from "next/image";
import { useCurrency } from "@/features/currency/context/CurrencyContext";

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

interface FilterControlsProps {
  value: FilterState;
  onSearchQueryChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleCondition: (condition: string) => void;
  onReset: () => void;
}

function FilterControls({
  value,
  onSearchQueryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onToggleCategory,
  onToggleCondition,
  onReset,
}: FilterControlsProps) {
  const { t } = useI18n();
  const { effectiveCurrency, convertUsd, displayToUsd } = useCurrency();
  const [isConditionOpen, setIsConditionOpen] = useState(false);
  const toDisplayValue = useCallback((canonicalUsd: string) => {
    if (!canonicalUsd.trim()) return "";
    const parsed = Number(canonicalUsd);
    if (!Number.isFinite(parsed)) return "";
    return String(Number(convertUsd(parsed).toFixed(2)));
  }, [convertUsd]);
  const [displayMinPrice, setDisplayMinPrice] = useState(() => toDisplayValue(value.minPrice));
  const [displayMaxPrice, setDisplayMaxPrice] = useState(() => toDisplayValue(value.maxPrice));
  const lastMinUsd = useRef(value.minPrice);
  const lastMaxUsd = useRef(value.maxPrice);
  const previousCurrency = useRef(effectiveCurrency);

  useEffect(() => {
    const currencyChanged = previousCurrency.current !== effectiveCurrency;
    if (currencyChanged || value.minPrice !== lastMinUsd.current) {
      setDisplayMinPrice(toDisplayValue(value.minPrice));
    }
    if (currencyChanged || value.maxPrice !== lastMaxUsd.current) {
      setDisplayMaxPrice(toDisplayValue(value.maxPrice));
    }
    previousCurrency.current = effectiveCurrency;
    lastMinUsd.current = value.minPrice;
    lastMaxUsd.current = value.maxPrice;
  }, [effectiveCurrency, toDisplayValue, value.maxPrice, value.minPrice]);

  const updateDisplayPrice = (
    raw: string,
    setDisplay: (next: string) => void,
    lastUsd: React.MutableRefObject<string>,
    onCanonicalChange: (next: string) => void,
  ) => {
    setDisplay(raw);
    if (!raw.trim()) {
      lastUsd.current = "";
      onCanonicalChange("");
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const canonicalUsd = String(Number(displayToUsd(parsed).toFixed(2)));
    lastUsd.current = canonicalUsd;
    onCanonicalChange(canonicalUsd);
  };

  return (
    <>
      <div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-accent transition-colors z-10" />
          <input
            type="search"
            value={value.searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={t("buy.searchPlaceholder")}
            autoComplete="off"
            enterKeyHint="search"
            className="w-full bg-transparent border border-white/5 pl-10 pr-3 py-2.5 text-xs font-bold text-white outline-none focus:border-accent/50 transition-all rounded-lg"
          />
        </div>
      </div>

      <div className="relative group w-full">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
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

      <div className="border-b border-white/5 pb-5">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{t("filters.priceRange")} ({effectiveCurrency})</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={displayMinPrice}
            onChange={(event) => updateDisplayPrice(event.target.value, setDisplayMinPrice, lastMinUsd, onMinPriceChange)}
            placeholder={t("filters.min")}
            className="w-full border border-white/5 p-2.5 text-xs font-bold text-white outline-none focus:border-accent/50 transition-colors rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/20 text-xs font-bold">—</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={displayMaxPrice}
            onChange={(event) => updateDisplayPrice(event.target.value, setDisplayMaxPrice, lastMaxUsd, onMaxPriceChange)}
            placeholder={t("filters.max")}
            className="w-full border border-white/5 p-2.5 text-xs font-bold text-white outline-none focus:border-accent/50 transition-colors rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="border-b border-white/5 pb-5">
        <button
          type="button"
          onClick={() => setIsConditionOpen((current) => !current)}
          className="w-full flex items-center justify-between mb-2 group text-left cursor-pointer"
        >
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-white/50 transition-colors">{t("filters.exterior")}</h3>
          <ChevronRight className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${isConditionOpen ? "rotate-90 text-accent" : ""}`} />
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
                {CONDITIONS.map((condition) => {
                  const isSelected = value.selectedConditions.includes(condition.value);
                  return (
                    <button
                      type="button"
                      key={condition.value}
                      aria-pressed={isSelected}
                      onClick={() => onToggleCondition(condition.value)}
                      className="flex w-full items-center gap-3 cursor-pointer group"
                    >
                      <span
                        className={`relative flex items-center justify-center h-4 w-4 rounded-[2px] border transition-all duration-200 ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-white/10 bg-background group-hover:border-white/20"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full bg-accent transition-opacity duration-200 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                      </span>
                      <span className={`text-[11px] font-bold transition-colors duration-200 ${isSelected ? "text-white" : "text-[#84849b] group-hover:text-white/70"}`}>
                        {t(condition.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">{t("filters.category")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((category) => {
            const isSelected = value.selectedCategories.includes(category.value);
            return (
              <button
                type="button"
                key={category.value}
                aria-pressed={isSelected}
                onClick={() => onToggleCategory(category.value)}
                className={`relative h-[100px] w-full flex flex-col items-center justify-center p-2 rounded-[4px] border transition-all duration-300 group active:scale-95 cursor-pointer overflow-visible ${
                  isSelected
                    ? "bg-accent/10 border-accent"
                    : "bg-card border-transparent hover:border-accent/40"
                }`}
              >
                <div
                  className={`absolute bottom-0 left-0 right-0 mx-auto w-full h-full transition-all duration-500 ease-out pointer-events-none rounded-[4px] ${
                    isSelected
                      ? "opacity-30"
                      : "opacity-0 translate-y-2 group-hover:opacity-30 group-hover:translate-y-0"
                  }`}
                  style={{
                    background: "radial-gradient(ellipse at bottom, var(--accent) 0%, transparent 70%)",
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
                          ? "opacity-100 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)] animate-hologram-flicker"
                          : "opacity-60 group-hover:opacity-100 group-hover:animate-hologram-flicker"
                      }`}
                    />
                  </div>
                )}
                <span className={`text-[9px] font-black uppercase text-center leading-tight tracking-tight mt-1 transition-all duration-300 z-10 ${isSelected ? "text-white" : "text-[#84849b] group-hover:text-accent/80"}`}>
                  {t(category.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export const FilterSidebar = () => {
  const { t } = useI18n();
  const [isOpenMobile, setIsMobileOpen] = useState(false);
  const filters = useFilters();
  const [mobileDraft, setMobileDraft] = useState<FilterState>(() =>
    cloneFilterState(filters.filterState),
  );

  const openMobileFilters = () => {
    setMobileDraft(cloneFilterState(filters.filterState));
    setIsMobileOpen(true);
  };

  const closeMobileFilters = () => {
    setMobileDraft(cloneFilterState(filters.filterState));
    setIsMobileOpen(false);
  };

  const applyMobileFilters = () => {
    filters.replaceFilters(mobileDraft);
    setIsMobileOpen(false);
  };

  const updateMobileDraft = <Key extends keyof FilterState>(
    key: Key,
    value: FilterState[Key],
  ) => {
    setMobileDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleMobileCategory = (category: string) => {
    setMobileDraft((current) => ({
      ...current,
      selectedCategories: current.selectedCategories.includes(category)
        ? current.selectedCategories.filter((item) => item !== category)
        : [...current.selectedCategories, category],
    }));
  };

  const toggleMobileCondition = (condition: string) => {
    setMobileDraft((current) => ({
      ...current,
      selectedConditions: current.selectedConditions.includes(condition)
        ? current.selectedConditions.filter((item) => item !== condition)
        : [...current.selectedConditions, condition],
    }));
  };

  return (
    <>
      <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 custom-scrollbar overscroll-contain lg:fixed lg:top-24 lg:left-6 pb-10">
        <FilterControls
          value={filters.filterState}
          onSearchQueryChange={filters.setSearchQuery}
          onMinPriceChange={filters.setMinPrice}
          onMaxPriceChange={filters.setMaxPrice}
          onToggleCategory={filters.toggleCategory}
          onToggleCondition={filters.toggleCondition}
          onReset={filters.clearFilters}
        />
      </aside>

      <div className="lg:hidden w-full flex items-center justify-between mb-4 gap-2 bg-[#110f1e]/40 p-2 border border-white/5 rounded-[3px]">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#84849b] font-mono leading-tight max-w-[150px] truncate">{t("filters.searchAndFilters")}</span>
        <button
          type="button"
          onClick={openMobileFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-accent text-white rounded-[3px] text-[9.5px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(217,70,239,0.2)] shrink-0 cursor-pointer"
        >
          <Filter className="w-3 h-3" />
          {t("filters.filterCatalog")}
        </button>
      </div>

      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-[100] lg:hidden flex items-end justify-center">
            <motion.button
              type="button"
              aria-label={t("common.close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileFilters}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("filters.searchFilters")}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="relative flex w-full max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-[#0c0a1a] text-white"
            >
              <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-accent" />
                    <span className="text-xs font-black uppercase tracking-widest">{t("filters.searchFilters")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={closeMobileFilters}
                    className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-white/50 hover:text-white cursor-pointer"
                    aria-label={t("common.close")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  <FilterControls
                    value={mobileDraft}
                    onSearchQueryChange={(value) => updateMobileDraft("searchQuery", value)}
                    onMinPriceChange={(value) => updateMobileDraft("minPrice", value)}
                    onMaxPriceChange={(value) => updateMobileDraft("maxPrice", value)}
                    onToggleCategory={toggleMobileCategory}
                    onToggleCondition={toggleMobileCondition}
                    onReset={() => setMobileDraft(createDefaultFilterState())}
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-[#0c0a1a]/95 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={applyMobileFilters}
                  className="flex h-11 w-full items-center justify-center rounded-[4px] bg-accent px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_22px_rgba(217,70,239,0.25)]"
                >
                  {t("filters.apply")}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
