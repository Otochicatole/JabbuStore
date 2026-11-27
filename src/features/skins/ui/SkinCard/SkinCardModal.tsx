import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingCart, Eye } from "lucide-react";
import { Skin } from "../../domain/skin";
import { CartItem } from "../../../cart/domain/cart";
import { SkinImage } from "@/shared/components/SkinImage";
import type { TranslationParams } from "@/shared/i18n/types";
import { getFloatColorClass } from "./helpers";
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

const getRarityDetails = (rarity: string) => {
  const r = rarity?.toLowerCase() || "";
  switch (r) {
    case "immortal":
      return { label: "Contrabando", color: "text-[#e0a814]" };
    case "ancient":
      return { label: "Encubierto (Covert)", color: "text-[#eb4b4b]" };
    case "legendary":
      return { label: "Clasificado (Classified)", color: "text-[#d32ce6]" };
    case "mythical":
      return { label: "Restringido (Restricted)", color: "text-[#8847ff]" };
    case "rare":
      return { label: "Grado Militar (Mil-Spec)", color: "text-[#4b69ff]" };
    case "uncommon":
      return { label: "Grado Industrial", color: "text-[#5e98d9]" };
    case "common":
    default:
      return { label: "Grado De Consumo", color: "text-[#b0c3d9]" };
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

const getExteriorAbbreviation = (exterior: string | null | undefined): string => {
  const ext = exterior?.toLowerCase() || "";
  if (ext.includes("factory new") || ext === "fn") return "FN";
  if (ext.includes("minimal wear") || ext === "mw") return "MW";
  if (ext.includes("field-tested") || ext === "ft") return "FT";
  if (ext.includes("well-worn") || ext === "ww") return "WW";
  if (ext.includes("battle-scarred") || ext === "bs") return "BS";
  return "";
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
  const theoreticalFloat = getTheoreticalFloat(skin.exterior);
  const exteriorAbbr = getExteriorAbbreviation(skin.exterior);

  const isYoupinMarketItem =
    skin.provider === "youpin" || skin.isImmediate === false;
  const [resolvedInspect, setResolvedInspect] = useState<{
    id: string;
    link: string | null;
  } | null>(null);
  const resolvedInspectLink =
    resolvedInspect?.id === skin.id
      ? resolvedInspect.link
      : skin.inspectLink ?? null;

  useEffect(() => {
    let cancelled = false;

    if (!isModalOpen || !isYoupinMarketItem) return;

    const resolveInspectLink = async () => {
      try {
        const response = await fetchWithAuth(
          `${BACKEND_URL}/market/listings/${encodeURIComponent(skin.id)}/inspect`,
        );
        if (!response.ok) {
          if (!cancelled) setResolvedInspect({ id: skin.id, link: null });
          return;
        }
        const data = (await response.json()) as { inspectLink?: unknown };
        const link = typeof data.inspectLink === "string" ? data.inspectLink.trim() : "";
        if (!cancelled) {
          setResolvedInspect({
            id: skin.id,
            link: link && !/%[a-z0-9_:]+%/i.test(link) ? link : null,
          });
        }
      } catch (error) {
        console.warn("[SkinCardModal] Error resolving inspect link:", error);
      }
    };

    void resolveInspectLink();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, isYoupinMarketItem, skin.id]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="relative w-full max-w-4xl bg-[#0e0d15]/95 border border-white/10 rounded-2xl flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(217,70,239,0.15)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 sm:px-6 h-[60px]">
          <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider sm:tracking-widest text-accent">
            {t("skinCard.modal.itemDetails")}
          </span>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer border-none flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* Left Column: Image */}
          <div className="w-full md:w-[55%] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col justify-center items-center bg-[#151322]/20">
            <div className="flex-1 flex items-center justify-center min-h-[250px] md:min-h-[300px]">
              <SkinImage
                src={skin.imageUrl}
                alt={skin.name}
                width={350}
                height={230}
                className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] animate-fade-in"
              />
            </div>
          </div>

          {/* Right Column: General Info */}
          <div className="w-full md:w-[45%] bg-[#151322]/40 p-6 lg:p-8 flex flex-col gap-6 md:overflow-y-auto custom-scrollbar justify-between shrink-0 md:shrink">
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-black uppercase text-accent tracking-widest font-mono">
                  {skin.weapon}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight mt-0.5">
                  {skin.name}{" "}
                  {skin.phase && (
                    <span className="text-accent">| {skin.phase}</span>
                  )}
                </h2>
                <span className="text-xs font-black text-white/50 uppercase tracking-wider mt-1 block">
                  {translateExterior(skin.exterior, "Factory New")}
                </span>
              </div>

              {/* StatTrak & Souvenir Badges */}
              {(skin.isStatTrak || skin.isSouvenir) && (
                <div className="flex flex-wrap gap-2">
                  {skin.isStatTrak && (
                    <span className="bg-[#cf6a32]/10 border border-[#cf6a32]/30 text-[#cf6a32] text-[9px] font-black uppercase px-2.5 py-0.5 rounded font-mono tracking-wider shadow-[0_0_10px_rgba(207,106,50,0.1)]">
                      StatTrak™
                    </span>
                  )}
                  {skin.isSouvenir && (
                    <span className="bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[9px] font-black uppercase px-2.5 py-0.5 rounded font-mono tracking-wider shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                      Souvenir
                    </span>
                  )}
                </div>
              )}

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#151322]/60 rounded-xl p-4 border border-white/5 font-mono">
                <div>
                  <span className="text-[9px] font-black text-[#84849b] uppercase block tracking-wider">
                    {t("skinCard.modal.category")}
                  </span>
                  <span className="text-xs font-bold text-white uppercase mt-1 block truncate">
                    {skin.category || skin.weapon}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#84849b] uppercase block tracking-wider">
                    {t("skinCard.modal.rarity")}
                  </span>
                  <span className={`text-xs font-bold uppercase mt-1 block truncate ${getRarityDetails(skin.rarity).color}`}>
                    {getRarityDetails(skin.rarity).label}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#84849b] uppercase block tracking-wider">
                    {t("skinCard.modal.condition")}
                  </span>
                  <span className="text-xs font-bold text-white uppercase mt-1 block truncate">
                    {translateExterior(skin.exterior, "Factory New")}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#84849b] uppercase block tracking-wider">
                    {t("skinCard.modal.stock")}
                  </span>
                  <span className="text-xs font-bold text-accent uppercase mt-1 block font-sans">
                    {skinsInGroup.length} {skinsInGroup.length === 1 ? "unidad" : "unidades"}
                  </span>
                </div>
              </div>

              {/* Float Bar (Theoretical/Approximate, not a real item float) */}
              {theoreticalFloat !== undefined && (
                <div className="flex flex-col gap-2 mt-2 bg-[#151322]/60 rounded-xl p-4 border border-white/5 font-mono">
                  <div className="flex items-center justify-between text-[9px] font-black text-[#84849b] uppercase tracking-wider">
                    <span>{t("skinCard.modal.floatValue")}</span>
                    {exteriorAbbr && (
                      <span className="text-white font-bold font-mono">{exteriorAbbr}</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-[#151322]/80 rounded-full overflow-hidden relative border border-white/5 mt-1">
                    <div className="absolute inset-y-0 left-[7%] w-px bg-white/20" />
                    <div className="absolute inset-y-0 left-[15%] w-px bg-white/20" />
                    <div className="absolute inset-y-0 left-[38%] w-px bg-white/20" />
                    <div className="absolute inset-y-0 left-[45%] w-px bg-white/20" />
                    <div
                      className={`h-full ${getFloatColorClass(theoreticalFloat)} rounded-full`}
                      style={{ width: `${Math.min(100, theoreticalFloat * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Price and Helper info */}
            <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  {t("common.price")}
                </span>
                <Money amountUsd={skin.price} className="text-3xl font-black text-white font-mono" />
              </div>

              {/* Buy and Inspect Actions */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const isAlreadyInCart = items.some((item) => item.skin.id === skin.id);
                    if (!isAlreadyInCart) {
                      addToCart({ ...skin, isSpecific: false, float: undefined, pattern: undefined });
                    }
                    setIsModalOpen(false);
                  }}
                  className="flex-1 h-12 bg-accent hover:brightness-110 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  {items.some((item) => item.skin.id === skin.id) ? t("cart.title") : t("nav.buy")}
                </button>

                {resolvedInspectLink && !/%[a-z0-9_:]+%/i.test(resolvedInspectLink) && (
                  <a
                    href={resolvedInspectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-6 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer no-underline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t("skinCard.inspectInGame")}
                  </a>
                )}
              </div>

              <span className="text-[9px] text-[#84849b]/50 text-center tracking-wide">
                {t("skinCard.modal.syncRealTime")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
export default SkinCardModal;
