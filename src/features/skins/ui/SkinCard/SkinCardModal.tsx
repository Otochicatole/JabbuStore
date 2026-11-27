import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingCart, Eye, Check, Box, Image as ImageIcon, Loader2 } from "lucide-react";
import { Skin } from "../../domain/skin";
import { CartItem } from "../../../cart/domain/cart";
import { SkinImage } from "@/shared/components/SkinImage";
import type { TranslationParams } from "@/shared/i18n/types";
import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  getFloatColorClass,
  getExteriorAbbreviation as getHelperExteriorAbbr,
} from "./helpers";
import {
  CS2_VIEWER_ORIGIN,
  buildCs2ViewerUrl,
  getCs2ViewerPublicKey,
  supportsCs2Viewer3d,
} from "./cs2ViewerUrl";
import { Money } from "@/features/currency/ui/Money";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";

interface SkinCardModalProps {
  skin: Skin;
  skinsInGroup: Skin[];
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  addToCart: (skin: Skin) => void;
  items: CartItem[];
  translateExterior: (
    exterior: string | null | undefined,
    fallback: string,
  ) => string;
  t: (key: string, params?: TranslationParams) => string;
}

const MODAL_EXTERIOR_OPTIONS = [
  {
    abbr: "FN",
    labelKey: "filters.condition.factoryNew",
    dotClass: "bg-[#10b981]",
    rangeWidth: 7,
  },
  {
    abbr: "MW",
    labelKey: "filters.condition.minimalWear",
    dotClass: "bg-[#84cc16]",
    rangeWidth: 8,
  },
  {
    abbr: "FT",
    labelKey: "filters.condition.fieldTested",
    dotClass: "bg-[#eab308]",
    rangeWidth: 23,
  },
  {
    abbr: "WW",
    labelKey: "filters.condition.wellWorn",
    dotClass: "bg-[#f97316]",
    rangeWidth: 7,
  },
  {
    abbr: "BS",
    labelKey: "filters.condition.battleScarred",
    dotClass: "bg-[#ef4444]",
    rangeWidth: 55,
  },
] as const;

const getVariantExteriorAbbr = (variant: Skin): string => {
  const fromExterior = getHelperExteriorAbbr(variant.exterior);
  if (fromExterior) return fromExterior;
  if (variant.float === undefined) return "";
  if (variant.float < 0.07) return "FN";
  if (variant.float < 0.15) return "MW";
  if (variant.float < 0.38) return "FT";
  if (variant.float < 0.45) return "WW";
  return "BS";
};

const getRarityDetails = (rarity: string) => {
  const r = rarity?.toLowerCase() || "";
  switch (r) {
    case "immortal":
      return { label: "Contrabando", color: "text-[#e4ae39]" };
    case "ancient":
      return { label: "Encubierto (Covert)", color: "text-[#f87171]" };
    case "legendary":
      return { label: "Clasificado (Classified)", color: "text-[#e879f9]" };
    case "mythical":
      return { label: "Restringido (Restricted)", color: "text-[#a78bfa]" };
    case "rare":
      return { label: "Grado Militar (Mil-Spec)", color: "text-[#60a5fa]" };
    case "uncommon":
      return { label: "Grado Industrial", color: "text-[#7dd3fc]" };
    case "common":
    default:
      return { label: "Grado De Consumo", color: "text-[#cbd5e1]" };
  }
};

const getTheoreticalFloat = (exterior: string | null | undefined): number | undefined => {
  const ext = exterior?.toLowerCase() || "";
  if (ext.includes("factory new") || ext === "fn") return 0.035;
  if (ext.includes("minimal wear") || ext === "mw") return 0.11;
  if (ext.includes("field-tested") || ext === "ft") return 0.26;
  if (ext.includes("well-worn") || ext === "ww") return 0.415;
  if (ext.includes("battle-scarred") || ext === "bs") return 0.72;
  return undefined;
};

export const SkinCardModal = ({
  skin,
  skinsInGroup,
  isModalOpen,
  setIsModalOpen,
  addToCart,
  items,
  translateExterior,
  t,
}: SkinCardModalProps) => {
  const [selectedExterior, setSelectedExterior] = useState<string | null>(null);
  const [statTrakOnly, setStatTrakOnly] = useState(false);

  const sortedVariants = useMemo(() => {
    const source = skinsInGroup?.length ? skinsInGroup : [skin];
    return [...source].sort((a, b) => {
      const priceDiff = a.price - b.price;
      return priceDiff !== 0 ? priceDiff : a.id.localeCompare(b.id);
    });
  }, [skinsInGroup, skin]);

  const hasExteriorOptions = useMemo(
    () => sortedVariants.some((variant) => Boolean(getVariantExteriorAbbr(variant))),
    [sortedVariants],
  );

  const hasAnyStatTrak = useMemo(
    () => sortedVariants.some((variant) => variant.isStatTrak),
    [sortedVariants],
  );
  const hasAnyStandard = useMemo(
    () => sortedVariants.some((variant) => !variant.isStatTrak),
    [sortedVariants],
  );
  const effectiveStatTrakOnly =
    hasAnyStatTrak && (!hasAnyStandard || statTrakOnly);

  const poolForExteriorSelection = useMemo(() => {
    if (effectiveStatTrakOnly) {
      return sortedVariants.filter((variant) => variant.isStatTrak);
    }
    return sortedVariants;
  }, [sortedVariants, effectiveStatTrakOnly]);

  const effectiveExterior = useMemo(() => {
    if (!hasExteriorOptions) return null;
    if (
      selectedExterior &&
      poolForExteriorSelection.some(
        (variant) => getVariantExteriorAbbr(variant) === selectedExterior,
      )
    ) {
      return selectedExterior;
    }
    const fallbackPool = effectiveStatTrakOnly
      ? poolForExteriorSelection
      : sortedVariants;
    const standardFirst = !effectiveStatTrakOnly
      ? fallbackPool.find((variant) => !variant.isStatTrak) ?? fallbackPool[0]
      : fallbackPool[0];
    return standardFirst ? getVariantExteriorAbbr(standardFirst) : null;
  }, [
    hasExteriorOptions,
    selectedExterior,
    poolForExteriorSelection,
    effectiveStatTrakOnly,
    sortedVariants,
  ]);

  const matchingVariants = useMemo(() => {
    const byWear =
      !hasExteriorOptions || !effectiveExterior
        ? sortedVariants
        : sortedVariants.filter(
            (variant) => getVariantExteriorAbbr(variant) === effectiveExterior,
          );
    if (effectiveStatTrakOnly) {
      return byWear.filter((variant) => variant.isStatTrak);
    }
    const nonStatTrak = byWear.filter((variant) => !variant.isStatTrak);
    return nonStatTrak.length > 0 ? nonStatTrak : byWear;
  }, [sortedVariants, hasExteriorOptions, effectiveExterior, effectiveStatTrakOnly]);

  const activeVariant = matchingVariants[0] ?? sortedVariants[0];
  const theoreticalFloat = getTheoreticalFloat(activeVariant.exterior);
  const exteriorAbbr = getVariantExteriorAbbr(activeVariant);
  const rarityDetails = getRarityDetails(activeVariant.rarity);

  const { locale } = useI18n();
  const viewerKey = getCs2ViewerPublicKey();
  const viewerIframeRef = useRef<HTMLIFrameElement | null>(null);

  const isYoupinMarketItem =
    activeVariant.provider === "youpin" || activeVariant.isImmediate === false;
  const [resolvedInspect, setResolvedInspect] = useState<{
    id: string;
    link: string | null;
  } | null>(null);
  const isInspectResolving =
    isYoupinMarketItem && resolvedInspect?.id !== activeVariant.id;
  const resolvedInspectLink =
    resolvedInspect?.id === activeVariant.id
      ? resolvedInspect.link
      : activeVariant.inspectLink ?? null;

  const canShow3d = supportsCs2Viewer3d(activeVariant, resolvedInspectLink);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [viewerFrameState, setViewerFrameState] = useState<{
    url: string;
    ready: boolean;
    error: boolean;
  } | null>(null);

  const viewerUrl = useMemo(() => {
    if (viewMode !== "3d" || !viewerKey || !canShow3d || isInspectResolving) {
      return null;
    }
    return buildCs2ViewerUrl({
      viewerKey,
      skin: activeVariant,
      inspectLink: resolvedInspectLink,
      wearFloat: theoreticalFloat,
      locale,
    });
  }, [
    viewMode,
    viewerKey,
    canShow3d,
    isInspectResolving,
    activeVariant,
    resolvedInspectLink,
    theoreticalFloat,
    locale,
  ]);

  const isViewerLoading =
    viewMode === "3d" &&
    Boolean(viewerKey) &&
    canShow3d &&
    (isInspectResolving ||
      (Boolean(viewerUrl) &&
        !(viewerFrameState?.url === viewerUrl && viewerFrameState.ready)));
  const isViewerUnavailable =
    viewMode === "3d" &&
    Boolean(viewerKey) &&
    canShow3d &&
    !isInspectResolving &&
    (!viewerUrl ||
      (viewerFrameState?.url === viewerUrl && viewerFrameState.error));

  useEffect(() => {
    let cancelled = false;

    if (!isModalOpen || !isYoupinMarketItem) return;

    const resolveInspectLink = async () => {
      try {
        const response = await fetchWithAuth(
          `${BACKEND_URL}/market/listings/${encodeURIComponent(activeVariant.id)}/inspect`,
        );
        if (!response.ok) {
          if (!cancelled) setResolvedInspect({ id: activeVariant.id, link: null });
          return;
        }
        const data = (await response.json()) as { inspectLink?: unknown };
        const link = typeof data.inspectLink === "string" ? data.inspectLink.trim() : "";
        if (!cancelled) {
          setResolvedInspect({
            id: activeVariant.id,
            link: link && !/%[a-z0-9_:]+%/i.test(link) ? link : null,
          });
        }
      } catch (error) {
        console.warn("[SkinCardModal] Error resolving inspect link:", error);
        if (!cancelled) setResolvedInspect({ id: activeVariant.id, link: null });
      }
    };

    void resolveInspectLink();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, isYoupinMarketItem, activeVariant.id]);

  useEffect(() => {
    if (!isModalOpen || !viewerUrl) return;

    const handleViewerMessage = (event: MessageEvent) => {
      if (
        event.origin !== CS2_VIEWER_ORIGIN ||
        event.source !== viewerIframeRef.current?.contentWindow
      ) {
        return;
      }

      const payload = event.data as { version?: number; type?: string } | null;
      if (!payload || payload.version !== 1) return;

      if (payload.type === "cs2viewer:loading") {
        setViewerFrameState({ url: viewerUrl, ready: false, error: false });
      } else if (
        payload.type === "cs2viewer:ready" ||
        payload.type === "cs2viewer:change"
      ) {
        setViewerFrameState({ url: viewerUrl, ready: true, error: false });
      } else if (payload.type === "cs2viewer:error") {
        setViewerFrameState({ url: viewerUrl, ready: true, error: true });
      }
    };

    window.addEventListener("message", handleViewerMessage);
    return () => {
      window.removeEventListener("message", handleViewerMessage);
    };
  }, [isModalOpen, viewerUrl]);

  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, setIsModalOpen]);

  if (!isModalOpen) return null;

  const isAlreadyInCart = items.some((item) => item.skin.id === activeVariant.id);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="skin-modal-title"
        className="relative w-full max-w-[1160px] bg-[#100d1b] border border-white/[0.08] rounded-2xl flex flex-col max-h-[92vh] md:h-[680px] shadow-[0_28px_72px_-12px_rgba(0,0,0,0.88)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar: Wear Tabs (FN / MW / FT / WW / BS) + Selectable ST™ */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-[#151124] border-b border-white/[0.06] px-5 sm:px-7 py-3.5 shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 min-w-0 flex-1">
            <span className="text-xs font-semibold tracking-wide text-[#b5b0cc] shrink-0">
              {t("skinCard.modal.itemDetails")}
            </span>

            {hasExteriorOptions && (
              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  role="tablist"
                  aria-label={t("filters.exterior")}
                  className="inline-flex items-center gap-1 bg-[#0b0914] p-1 rounded-xl"
                >
                  {MODAL_EXTERIOR_OPTIONS.map((option) => {
                    const hasVariant = sortedVariants.some((variant) => {
                      if (effectiveStatTrakOnly && !variant.isStatTrak) return false;
                      return getVariantExteriorAbbr(variant) === option.abbr;
                    });
                    const isSelected = effectiveExterior === option.abbr;

                    return (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        key={option.abbr}
                        disabled={!hasVariant}
                        title={t(option.labelKey)}
                        onClick={() => setSelectedExterior(option.abbr)}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
                          isSelected
                            ? "bg-accent text-white cursor-pointer"
                            : hasVariant
                              ? "bg-transparent text-[#a39ec0] hover:text-white hover:bg-white/[0.06] cursor-pointer"
                              : "bg-transparent text-white/20 cursor-not-allowed"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            isSelected ? "bg-white" : option.dotClass
                          } ${hasVariant ? "opacity-95" : "opacity-25"}`}
                        />
                        {option.abbr}
                      </button>
                    );
                  })}
                </div>

                {hasAnyStatTrak && (
                  <button
                    type="button"
                    aria-pressed={effectiveStatTrakOnly}
                    disabled={!hasAnyStandard}
                    onClick={() => setStatTrakOnly((prev) => !prev)}
                    title={t("filters.statTrak")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-[#cf6a32] focus-visible:outline-offset-2 ${
                      effectiveStatTrakOnly
                        ? "bg-[#cf6a32]/20 text-[#f59e0b] ring-1 ring-[#cf6a32]/50"
                        : "bg-[#0b0914] text-[#a39ec0] hover:text-white hover:bg-white/[0.06]"
                    } ${!hasAnyStandard ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
                  >
                    <span
                      className={`flex items-center justify-center h-3.5 w-3.5 rounded-[4px] border transition-colors ${
                        effectiveStatTrakOnly
                          ? "border-[#f59e0b] bg-[#f59e0b] text-[#0b0914]"
                          : "border-white/25 bg-transparent"
                      }`}
                    >
                      {effectiveStatTrakOnly && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    ST™
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setIsModalOpen(false)}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[#b5b0cc] hover:text-white transition-colors cursor-pointer border-none flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* Left Showcase Stage: 2D/3D Viewer + Bottom Controls & Wear Bar */}
          <div className="w-full md:w-[62%] bg-[#0c0a16] p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="relative h-[300px] sm:h-[360px] md:flex-1 md:min-h-0 flex items-center justify-center rounded-2xl bg-[#131021] overflow-hidden">
              {viewMode === "3d" && canShow3d && viewerUrl && !isViewerUnavailable && (
                <iframe
                  ref={viewerIframeRef}
                  key={viewerUrl}
                  src={viewerUrl}
                  title={`${activeVariant.weapon} ${activeVariant.name} 3D`}
                  allow="fullscreen"
                  onLoad={() =>
                    setViewerFrameState((prev) =>
                      prev?.url === viewerUrl ? prev : { url: viewerUrl, ready: true, error: false },
                    )
                  }
                  onError={() =>
                    setViewerFrameState({ url: viewerUrl, ready: true, error: true })
                  }
                  className="w-full h-full border-0 block relative z-10"
                />
              )}

              {(viewMode === "2d" || !canShow3d || !viewerKey || isViewerLoading || isViewerUnavailable) && (
                <div className="absolute inset-0 flex items-center justify-center px-6 py-6 pointer-events-none">
                  <SkinImage
                    src={activeVariant.imageUrl}
                    alt={activeVariant.name}
                    width={480}
                    height={320}
                    className={`max-h-full w-auto max-w-[460px] object-contain drop-shadow-[0_24px_32px_rgba(0,0,0,0.75)] transition-opacity duration-200 ${
                      viewMode === "3d" && (!viewerKey || isViewerLoading || isViewerUnavailable)
                        ? "opacity-35"
                        : "opacity-100"
                    }`}
                  />
                </div>
              )}

              {viewMode === "3d" && canShow3d && !viewerKey && (
                <div className="relative z-10 max-w-xs mx-auto rounded-xl bg-[#0b0914]/90 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-[#d4d0e6] leading-relaxed">
                    {t("skinCard.modal.viewerMissingKey")}
                  </p>
                </div>
              )}

              {viewMode === "3d" && canShow3d && viewerKey && isViewerLoading && (
                <div className="relative z-10 inline-flex items-center gap-2 rounded-xl bg-[#0b0914]/90 px-3.5 py-2 text-xs font-semibold text-white">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span>{t("skinCard.modal.loading3d")}</span>
                </div>
              )}

              {viewMode === "3d" && canShow3d && viewerKey && isViewerUnavailable && (
                <div className="relative z-10 max-w-xs mx-auto rounded-xl bg-[#0b0914]/90 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-[#d4d0e6]">
                    {t("skinCard.modal.viewerUnavailable")}
                  </p>
                </div>
              )}
            </div>

            {(theoreticalFloat !== undefined || canShow3d) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-[#151124] rounded-xl p-3.5 sm:px-4 shrink-0">
                {theoreticalFloat !== undefined && (
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 h-5">
                      <span className="text-xs font-semibold text-[#b5b0cc] whitespace-nowrap">
                        {t("skinCard.modal.floatValue")}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {translateExterior(activeVariant.exterior, "Factory New")}
                      </span>
                    </div>

                    {/* 5-Zone CS2 Wear Track */}
                    <div className="relative h-2.5 w-full rounded-full bg-[#0a0812] overflow-hidden flex gap-[2px] p-[2px]">
                      {MODAL_EXTERIOR_OPTIONS.map((zone) => {
                        const isActiveZone = zone.abbr === exteriorAbbr;
                        return (
                          <div
                            key={zone.abbr}
                            style={{ width: `${zone.rangeWidth}%` }}
                            className={`h-full rounded-full transition-opacity duration-200 ${zone.dotClass} ${
                              isActiveZone ? "opacity-100" : "opacity-20"
                            }`}
                          />
                        );
                      })}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-1.5 rounded-full bg-white ring-2 ring-[#151124] transition-all duration-300 ${getFloatColorClass(theoreticalFloat)}`}
                        style={{ left: `calc(${Math.min(98, Math.max(2, theoreticalFloat * 100))}% - 3px)` }}
                      />
                    </div>
                  </div>
                )}

                {canShow3d && (
                  <div
                    role="group"
                    aria-label={t("skinCard.modal.itemDetails")}
                    className={`shrink-0 flex items-center justify-end ${
                      theoreticalFloat !== undefined
                        ? "sm:pl-4 sm:border-l sm:border-white/[0.06]"
                        : "w-full"
                    }`}
                  >
                    <div className="inline-flex items-center gap-1 rounded-xl bg-[#0b0914] p-1">
                      <button
                        type="button"
                        aria-pressed={viewMode === "2d"}
                        onClick={() => setViewMode("2d")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-none ${
                          viewMode === "2d"
                            ? "bg-accent text-white"
                            : "bg-transparent text-[#a39ec0] hover:text-white"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{t("skinCard.modal.view2d")}</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={viewMode === "3d"}
                        onClick={() => setViewMode("3d")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-none ${
                          viewMode === "3d"
                            ? "bg-accent text-white"
                            : "bg-transparent text-[#a39ec0] hover:text-white"
                        }`}
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>{t("skinCard.modal.view3d")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Purchase & Specs Column */}
          <div className="w-full md:w-[38%] bg-[#131021] p-6 sm:p-7 flex flex-col justify-between gap-6 md:overflow-y-auto custom-scrollbar shrink-0 md:shrink border-t md:border-t-0 md:border-l border-white/[0.05]">
            <div className="flex flex-col gap-6">
              {/* Item Title */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  {activeVariant.weapon}
                </span>
                <h2
                  id="skin-modal-title"
                  className="text-2xl sm:text-[28px] font-black text-white tracking-tight leading-[1.1]"
                >
                  {activeVariant.name}{" "}
                  {activeVariant.phase && (
                    <span className="text-accent font-extrabold">| {activeVariant.phase}</span>
                  )}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`text-xs font-semibold ${rarityDetails.color}`}>
                    {rarityDetails.label}
                  </span>
                  {activeVariant.isStatTrak && (
                    <span className="bg-[#cf6a32]/15 text-[#f59e0b] text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                      StatTrak™
                    </span>
                  )}
                  {activeVariant.isSouvenir && (
                    <span className="bg-[#eab308]/15 text-[#fde047] text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                      Souvenir
                    </span>
                  )}
                </div>
              </div>

              {/* Clean Technical Specifications (single tonal surface, no repeated condition) */}
              <dl className="grid grid-cols-3 gap-3 bg-[#1a162b] rounded-xl p-4">
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium text-[#9e99b8] truncate">
                    {t("skinCard.modal.category")}
                  </dt>
                  <dd className="text-sm font-bold text-white capitalize mt-1 truncate">
                    {activeVariant.category || activeVariant.weapon}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium text-[#9e99b8] truncate">
                    {t("skinCard.modal.condition")}
                  </dt>
                  <dd className="text-sm font-bold text-white mt-1 truncate">
                    {exteriorAbbr || translateExterior(activeVariant.exterior, "Factory New")}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium text-[#9e99b8] truncate">
                    {t("skinCard.modal.stock")}
                  </dt>
                  <dd className="text-sm font-bold text-accent tabular-nums mt-1 truncate">
                    {matchingVariants.length}{" "}
                    {matchingVariants.length === 1 ? "unidad" : "unidades"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Price & Primary Actions */}
            <div className="flex flex-col gap-5 pt-6 border-t border-white/[0.06] shrink-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9e99b8] shrink-0">
                  {t("common.price")}
                </span>
                <Money
                  amountUsd={activeVariant.price}
                  className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums whitespace-nowrap"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAlreadyInCart) {
                      addToCart({
                        ...activeVariant,
                        isSpecific: false,
                        float: undefined,
                        pattern: undefined,
                      });
                    }
                    setIsModalOpen(false);
                  }}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer border-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>{isAlreadyInCart ? t("cart.title") : t("nav.buy")}</span>
                </button>

                <div className="h-11">
                  {resolvedInspectLink && !/%[a-z0-9_:]+%/i.test(resolvedInspectLink) ? (
                    <a
                      href={resolvedInspectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-11 px-4 flex items-center justify-center gap-2 bg-[#1a162b] hover:bg-[#231e38] text-[#d4d0e6] hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer no-underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>{t("skinCard.inspectInGame")}</span>
                    </a>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="w-full h-11 px-4 flex items-center justify-center gap-2 bg-[#1a162b]/40 text-white/25 text-xs font-bold uppercase tracking-wider rounded-xl select-none whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>{t("skinCard.inspectInGame")}</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-[#8f8aad] text-center">
                {t("skinCard.modal.syncRealTime")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
export default SkinCardModal;
