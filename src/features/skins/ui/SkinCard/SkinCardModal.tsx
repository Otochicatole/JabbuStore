import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingCart, Trash2, Eye } from "lucide-react";
import { Skin } from "../../domain/skin";
import { InspectInGameButton } from "./InspectInGameButton";
import { SkinImage } from "@/shared/components/SkinImage";
import { getFloatColorClass } from "./helpers";

interface SkinCardModalProps {
  skin: Skin;
  skinsInGroup: Skin[];
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  totalQuantityInCart: number;
  addToCart: (skin: Skin) => void;
  removeFromCart: (id: string) => void;
  items: any[];
  translateExterior: (
    exterior: string | null | undefined,
    fallback: string,
  ) => string;
  t: (key: string, params?: any) => string;
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
  totalQuantityInCart,
  addToCart,
  removeFromCart,
  items,
  translateExterior,
  t,
}: SkinCardModalProps) => {
  const [activeTab, setActiveTab] = useState<"details" | "stock">("details");
  const theoreticalFloat = getTheoreticalFloat(skin.exterior);
  const exteriorAbbr = getExteriorAbbreviation(skin.exterior);

  useEffect(() => {
    if (isModalOpen) {
      setActiveTab("details");
    }
  }, [isModalOpen]);

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

  const avgPrice =
    skinsInGroup.length > 0
      ? skinsInGroup.reduce((sum, s) => sum + s.price, 0) / skinsInGroup.length
      : skin.price;

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
        <div className="flex items-center justify-between border-b border-white/5 px-4 sm:px-6">
          <div className="flex gap-4 sm:gap-8 h-[60px]">
            <button
              onClick={() => setActiveTab("details")}
              className={`h-full border-b-2 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider sm:tracking-widest bg-transparent transition-all cursor-pointer border-none ${
                activeTab === "details"
                  ? "border-accent text-accent"
                  : "border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              {t("skinCard.modal.itemDetails")}
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`h-full border-b-2 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider sm:tracking-widest bg-transparent transition-all cursor-pointer border-none ${
                activeTab === "stock"
                  ? "border-accent text-accent"
                  : "border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              {t("skinCard.modal.availableStock")}
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer border-none flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeTab === "details" ? (
          /* DETAILS TAB (2-Column general info, no specific float, average price) */
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
                    {t("skinCard.modal.averagePrice")}
                  </span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-black text-white">
                      $
                      {avgPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-[#84849b] font-bold">
                      USD
                    </span>
                  </div>
                </div>

                {/* Buy and Inspect Actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {}}
                    className="flex-1 h-12 bg-accent hover:brightness-110 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    {t("nav.buy")}
                  </button>

                  {skin.inspectLink && (
                    <a
                      href={skin.inspectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-6 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer no-underline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t("common.view")}
                    </a>
                  )}
                </div>

                <span className="text-[9px] text-[#84849b]/50 text-center tracking-wide">
                  {t("skinCard.modal.syncRealTime")}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* STOCK TAB (List of all specific items in stock with floats & buy buttons) */
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 custom-scrollbar bg-[#151322]/20 min-h-[350px]">
            {skinsInGroup.map((s) => {
              const isThisInCart = !!items.find(
                (item) => item.skin.id === s.id,
              );
              return (
                <div
                  key={s.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4 border-b ${
                    isThisInCart ? "border-accent" : "border-white/10"
                  }`}
                >
                  <div className="flex sm:flex-row flex-col items-center gap-10 flex-1 min-w-0">
                    {/* Thumbnail Image (No border box, larger) */}
                    <div className="relative w-16 h-12 flex items-center justify-center shrink-0">
                      <SkinImage
                        src={s.imageUrl}
                        alt={s.name}
                        width={80}
                        height={80}
                        maxWidth={80}
                        maxHeight={80}
                        className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                      />
                    </div>

                    {/* Left side details */}
                    <div className="flex flex-col gap-1.5 w-full min-w-0 pr-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">
                          {translateExterior(s.exterior, "Factory New")}
                        </span>
                        {s.pattern !== undefined && (
                          <span className="text-[#84849b] text-[10px] font-mono">
                            {t("checkout.seed")}:{" "}
                            <span className="text-white font-bold">
                              {s.pattern}
                            </span>
                          </span>
                        )}
                        <div className="flex gap-2 items-center justify-center font-mono">
                          <span className="text-[#84849b] uppercase font-bold text-[9px]">
                            {t("common.price")}:
                          </span>
                          <span className="text-sm font-black text-white">
                            ${s.price.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {s.float !== undefined && (
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between text-[9px] font-mono text-[#84849b]">
                            <span>Float:</span>
                            <span className="text-white font-bold">
                              {s.float.toFixed(8)}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 w-full bg-[#151322]/80 rounded-full overflow-hidden relative border border-white/5">
                            <div className="absolute inset-y-0 left-[7%] w-px bg-white/20" />
                            <div className="absolute inset-y-0 left-[15%] w-px bg-white/20" />
                            <div className="absolute inset-y-0 left-[38%] w-px bg-white/20" />
                            <div className="absolute inset-y-0 left-[45%] w-px bg-white/20" />
                            <div
                              className={`h-full ${getFloatColorClass(s.float)} rounded-full`}
                              style={{
                                width: `${Math.min(100, s.float * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side Price & Actions */}
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    {s.inspectLink && (
                      <InspectInGameButton
                        href={s.inspectLink}
                        title={t("skinCard.inspectInGame")}
                      />
                    )}

                    {!isThisInCart ? (
                      <button
                        onClick={() => addToCart(s)}
                        className="h-9 px-5 flex items-center justify-center bg-accent text-white hover:brightness-110 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer border-none shadow-[0_0_15px_rgba(217,70,239,0.25)] shrink-0"
                      >
                        {t("common.add")}
                      </button>
                    ) : (
                      <button
                        onClick={() => removeFromCart(s.id)}
                        className="h-9 px-5 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer shrink-0"
                      >
                        {t("common.remove")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
export default SkinCardModal;
