"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { SkinImage } from "@/shared/components/SkinImage";
import { Skin } from "../../domain/skin";
import { useCart } from "../../../cart/context/CartContext";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { X, Search, ArrowUpDown, AlertCircle, Check, RefreshCw, Eye } from "lucide-react";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface FloatItem {
  id: string;
  assetId: string;
  floatValue: number;
  paintSeed: number;
  market: "YOUPIN" | "CSFLOAT";
  price: number;
  displayPrice: number;
  inspectLink: string | null;
  available: boolean;
  externalId: string | null;
  lastSyncAt: string;
  resaleItemId: string;
}

interface FloatsModalProps {
  skin: Skin;
  isOpen: boolean;
  onClose: () => void;
}

const getConditionLabelKey = (float: number) => {
  if (float < 0.07) return "filters.condition.factoryNewShort";
  if (float < 0.15) return "filters.condition.minimalWearShort";
  if (float < 0.38) return "filters.condition.fieldTestedShort";
  if (float < 0.45) return "filters.condition.wellWornShort";
  return "filters.condition.battleScarredShort";
};

const getFloatColorClass = (float: number) => {
  if (float < 0.07) return "bg-[#10b981]"; // FN
  if (float < 0.15) return "bg-[#84cc16]"; // MW
  if (float < 0.38) return "bg-[#eab308]"; // FT
  if (float < 0.45) return "bg-[#f97316]"; // WW
  return "bg-[#ef4444]"; // BS
};

const getFloatConditionStyle = (float: number) => {
  if (float < 0.07) return { text: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-[#10b981]/25" }; // FN
  if (float < 0.15) return { text: "text-[#84cc16]", bg: "bg-[#84cc16]/10", border: "border-[#84cc16]/25" }; // MW
  if (float < 0.38) return { text: "text-[#eab308]", bg: "bg-[#eab308]/10", border: "border-[#eab308]/25" }; // FT
  if (float < 0.45) return { text: "text-[#f97316]", bg: "bg-[#f97316]/10", border: "border-[#f97316]/25" }; // WW
  return { text: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/25" }; // BS
};

const getExteriorLabelKey = (exterior: string | null | undefined) => {
  if (!exterior) return null;
  const ext = exterior.toLowerCase();
  if (ext.includes("factory") || ext.includes("fn") || ext.includes("recién"))
    return "filters.condition.factoryNew";
  if (ext.includes("minimal") || ext.includes("mw") || ext.includes("casi"))
    return "filters.condition.minimalWear";
  if (ext.includes("field") || ext.includes("ft") || ext.includes("algo"))
    return "filters.condition.fieldTested";
  if (ext.includes("well") || ext.includes("ww") || ext.includes("bastante"))
    return "filters.condition.wellWorn";
  if (ext.includes("battle") || ext.includes("bs") || ext.includes("deplorable"))
    return "filters.condition.battleScarred";
  return null;
};

const sortOptionKeys = [
  { value: "price_asc", labelKey: "skinCard.sort.lowestPrice" },
  { value: "price_desc", labelKey: "skinCard.sort.highestPrice" },
  { value: "float_asc", labelKey: "skinCard.sort.lowestWear" },
  { value: "float_desc", labelKey: "skinCard.sort.highestWear" },
];

type FloatSortOption = "price_asc" | "price_desc" | "float_asc" | "float_desc";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  return fallback;
};

export const FloatsModal = ({ skin, isOpen, onClose }: FloatsModalProps) => {
  const { t } = useI18n();
  const { addToCart, removeFromCart, items: cartItems } = useCart();
  const sortOptions = useMemo(
    () => sortOptionKeys.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t],
  );

  const [mounted, setMounted] = useState(false);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y ordenamiento
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<FloatSortOption>("price_asc");
  const skinExteriorLabelKey = getExteriorLabelKey(skin.exterior);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const fetchFloats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/market/listings/${encodeURIComponent(skin.id)}/floats`,
      );
      if (!response.ok) {
        throw new Error(t("skinCard.floatLoadApiError"));
      }
      const data = await response.json();
      setFloats(data);
    } catch (err: unknown) {
      console.error("[Floats Modal] Error fetching floats:", err);
      setError(getErrorMessage(err, t("skinCard.floatLoadError")));
    } finally {
      setLoading(false);
    }
  }, [skin.id, t]);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = window.setTimeout(() => {
        void fetchFloats();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [fetchFloats, isOpen]);

  // Encontrar si este listado (o un asset youpin del mismo skin) está en el carrito
  const cartItemForThisListing = useMemo(() => {
    return cartItems.find(
      (item) =>
        item.skin.id === skin.id ||
        (item.skin.id.startsWith("youpin-") &&
          item.skin.name === skin.name &&
          item.skin.weapon === skin.weapon),
    );
  }, [cartItems, skin.id, skin.name, skin.weapon]);

  // Filtrado y Ordenamiento
  const processedFloats = useMemo(() => {
    let result = [...floats];

    // Búsqueda (por float o paintseed)
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.floatValue.toString().includes(query) ||
          f.paintSeed.toString().includes(query) ||
          t(getConditionLabelKey(f.floatValue)).toLowerCase().includes(query)
      );
    }

    // Ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.displayPrice - b.displayPrice;
        case "price_desc":
          return b.displayPrice - a.displayPrice;
        case "float_asc":
          return a.floatValue - b.floatValue;
        case "float_desc":
          return b.floatValue - a.floatValue;
        default:
          return 0;
      }
    });

    return result;
  }, [floats, search, sortBy, t]);

  if (!isOpen || !mounted) return null;

  const handleSelectFloat = (float: FloatItem) => {
    const assetId = float.id ? `youpin-${float.id}` : skin.id;
    const selectedSkin: Skin = {
      ...skin,
      id: assetId,
      price: float.displayPrice,
      float: float.floatValue,
      pattern: float.paintSeed,
      provider: "youpin",
      inspectLink: float.inspectLink ?? skin.inspectLink ?? null,
    };

    const existing = cartItems.find(
      (item) => item.skin.id === assetId || item.skin.id === skin.id,
    );
    if (existing) {
      removeFromCart(existing.skin.id);
    }

    addToCart(selectedSkin);
  };

  const handleRemoveFromCart = () => {
    const existing = cartItems.find(
      (item) =>
        item.skin.id === skin.id ||
        (item.skin.id.startsWith("youpin-") &&
          item.skin.name === skin.name &&
          item.skin.weapon === skin.weapon),
    );
    if (existing) {
      removeFromCart(existing.skin.id);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0b0a11]/95 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-[0_0_60px_rgba(217,70,239,0.15)] flex flex-col h-[88vh] sm:h-[85vh] max-h-[750px] animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/5 mb-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-xl p-1 flex items-center justify-center shrink-0">
              <SkinImage
                src={skin.imageUrl}
                alt={skin.name}
                width={60}
                height={60}
                maxWidth={60}
                maxHeight={60}
                className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-accent tracking-widest font-mono">
                {skin.weapon}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight mt-0.5 line-clamp-2">
                {skin.name}
                {skin.phase && <span className="text-accent ml-1">| {skin.phase}</span>}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {skin.exterior && (
                  <span className="text-[#84849b] text-[9px] uppercase font-bold tracking-wider font-mono">
                    {skinExteriorLabelKey ? t(skinExteriorLabelKey) : skin.exterior}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer border-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros, Búsqueda y Ordenamiento */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder={t("skinCard.searchFloatPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 shrink-0 min-w-0 sm:min-w-[180px]">
            <ArrowUpDown className="w-3.5 h-3.5 text-white/40 animate-pulse" />
            <AdminSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as FloatSortOption)}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
          {loading ? (
            // Skeleton Loader
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-xl h-[72px] animate-pulse"
              >
                <div className="flex flex-col gap-2 w-1/3">
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
                <div className="h-4 bg-white/10 rounded w-1/6" />
                <div className="h-8 bg-white/10 rounded w-24" />
              </div>
            ))
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-sm font-semibold text-white/70">{error}</p>
              <button
                onClick={fetchFloats}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider rounded-lg text-white transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {t("common.retry")}
              </button>
            </div>
          ) : processedFloats.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-2xl">
              <span className="text-white/20 font-black text-xs uppercase tracking-widest font-mono mb-2">
                {t("skinCard.noFloatResults")}
              </span>
              <p className="text-xs text-[#84849b] max-w-xs leading-relaxed">
                {t("skinCard.noFloatResultsDescription")}
              </p>
            </div>
          ) : (
            // Floats List
            processedFloats.map((f) => {
              const assetId = f.id ? `youpin-${f.id}` : null;
              const isSelectedInCart =
                cartItemForThisListing &&
                (cartItemForThisListing.skin.id === assetId ||
                  (cartItemForThisListing.skin.float === f.floatValue &&
                    cartItemForThisListing.skin.pattern === f.paintSeed));

              const condStyle = getFloatConditionStyle(f.floatValue);

              return (
                <div
                  key={f.id}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl border transition-all duration-300 gap-4 ${
                    isSelectedInCart
                      ? "bg-accent/[0.04] border-accent shadow-[0_0_25px_rgba(217,70,239,0.12)]"
                      : "bg-[#13111c]/45 border-white/[0.04] hover:bg-white/[0.02] hover:border-white/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  {/* Left: Float and Seed Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Condition Badge */}
                      <span className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full select-none border font-mono tracking-wider ${condStyle.bg} ${condStyle.text} ${condStyle.border}`}>
                        {t(getConditionLabelKey(f.floatValue))}
                      </span>
                      
                      {/* Seed Badge */}
                      <span className="bg-white/5 border border-white/10 text-white/70 text-[9.5px] font-mono px-2 py-0.5 rounded-md">
                        {t("checkout.seed")}: <span className="text-white font-bold">{f.paintSeed}</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1.5 w-full max-w-sm">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#84849b]">
                        <span className="opacity-80">Float</span>
                        <span className="text-white/90 font-bold tracking-tight">{f.floatValue.toFixed(8)}</span>
                      </div>
                      <div className="h-[5px] w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                        <div className="absolute top-0 bottom-0 left-[7%] w-[1px] bg-white/10" />
                        <div className="absolute top-0 bottom-0 left-[15%] w-[1px] bg-white/10" />
                        <div className="absolute top-0 bottom-0 left-[38%] w-[1px] bg-white/10" />
                        <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-white/10" />
                        <div
                          className={`h-full ${getFloatColorClass(f.floatValue)} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, f.floatValue * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Selection Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-5 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[#84849b] uppercase font-bold text-[8px] block tracking-widest font-mono">
                        {t("skinCard.finalPrice")}
                      </span>
                      <span className="text-base font-black text-white font-mono">
                        ${f.displayPrice.toLocaleString()}{" "}
                        <span className="text-[9px] text-[#84849b]">USD</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {f.inspectLink && !/%[a-z0-9_:]+%/i.test(f.inspectLink) && (
                        <a
                          href={f.inspectLink}
                          className="h-9 w-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg transition-all hover:scale-105 active:scale-95"
                          title={t("skinCard.inspectInGame")}
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}

                      {isSelectedInCart ? (
                        <button
                          onClick={handleRemoveFromCart}
                          className="h-9 px-4 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all hover:scale-[1.02] active:scale-95 text-[9.5px] font-black uppercase tracking-wider rounded-lg cursor-pointer font-mono"
                        >
                          {t("common.remove")}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectFloat(f)}
                          className="h-9 px-4 flex items-center justify-center gap-1 bg-accent text-white hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all text-[9.5px] font-black uppercase tracking-wider rounded-lg cursor-pointer border-none shadow-[0_4px_15px_rgba(217,70,239,0.2)] font-mono"
                        >
                          {cartItemForThisListing ? t("common.replace") : t("skinCard.select")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[9px] font-bold text-[#84849b] uppercase tracking-wider font-mono">
              {t("skinCard.cartStatus")}
            </span>
            <span className="text-[10px] font-black text-white">
              {cartItemForThisListing ? (
                <span className="text-emerald-400 flex items-center gap-1 break-words">
                  <Check className="w-3.5 h-3.5" /> {t("skinCard.oneVariantInCart", { float: cartItemForThisListing.skin.float?.toFixed(4) ?? "N/A" })}
                </span>
              ) : (
                <span className="text-white/40">{t("skinCard.notSelected")}</span>
              )}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer border-none font-mono"
          >
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
