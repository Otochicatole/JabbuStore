"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Skin } from "../domain/skin";
import { useCart } from "../../cart/context/CartContext";
import { ShoppingCart, Plus, Minus, X, Eye, Check, Trash2 } from "lucide-react";
import { FloatsModal } from "./components/FloatsModal";

interface SkinCardProps {
  skinsInGroup: Skin[];
}

const rarityColors: Record<string, string> = {
  common: "bg-[#b0c3d9]",
  uncommon: "bg-[#5e98d9]",
  rare: "bg-[#4b69ff]",
  mythical: "bg-[#8847ff]",
  legendary: "bg-[#d32ce6]",
  ancient: "bg-[#eb4b4b]",
  immortal: "bg-[#e4ae39]",
};

const rarityHexColors: Record<string, string> = {
  common: "#b0c3d9",
  uncommon: "#5e98d9",
  rare: "#4b69ff",
  mythical: "#8847ff",
  legendary: "#d32ce6",
  ancient: "#eb4b4b",
  immortal: "#e4ae39",
};

const getConditionLabel = (float?: number) => {
  if (float === undefined) return "Recién fabricado";
  if (float < 0.07) return "Recién fabricado";
  if (float < 0.15) return "Casi nuevo";
  if (float < 0.38) return "Algo desgastado";
  if (float < 0.45) return "Bastante desgastado";
  return "Deplorable";
};

/** Devuelve el rango de float [min, max] según el exterior (para market listings sin float individual) */
const getFloatRangeFromExterior = (
  exterior: string | null | undefined,
): [number, number] | null => {
  if (!exterior) return null;
  const ext = exterior.toLowerCase();
  if (ext.includes("factory") || ext.includes("fn") || ext.includes("recién"))
    return [0.0, 0.07];
  if (ext.includes("minimal") || ext.includes("mw") || ext.includes("casi"))
    return [0.07, 0.15];
  if (ext.includes("field") || ext.includes("ft") || ext.includes("algo"))
    return [0.15, 0.38];
  if (ext.includes("well") || ext.includes("ww") || ext.includes("bastante"))
    return [0.38, 0.45];
  if (
    ext.includes("battle") ||
    ext.includes("bs") ||
    ext.includes("deplorable")
  )
    return [0.45, 1.0];
  return null;
};

const getFloatColorClass = (float?: number) => {
  if (float === undefined) return "bg-[#10b981]"; // Green
  if (float < 0.07) return "bg-[#10b981]"; // Factory New (Green)
  if (float < 0.15) return "bg-[#84cc16]"; // Minimal Wear (Lime)
  if (float < 0.38) return "bg-[#eab308]"; // Field-Tested (Yellow)
  if (float < 0.45) return "bg-[#f97316]"; // Well-Worn (Orange)
  return "bg-[#ef4444]"; // Battle-Scarred (Red)
};

const getRangeColorClass = (min: number): string => {
  if (min < 0.07) return "bg-[#10b981]";
  if (min < 0.15) return "bg-[#84cc16]";
  if (min < 0.38) return "bg-[#eab308]";
  if (min < 0.45) return "bg-[#f97316]";
  return "bg-[#ef4444]";
};

export const SkinCard = ({ skinsInGroup }: SkinCardProps) => {
  const { addToCart, items, removeFromCart } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFloatsModalOpen, setIsFloatsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!skinsInGroup || skinsInGroup.length === 0) return null;

  // Representative skin is the first one in the sorted group
  const skin = skinsInGroup[0]!;
  const conditionLabel = getConditionLabel(skin.float);
  const isMultiple = skinsInGroup.length >= 2;

  // Determine if this item can have floats or is a non-float item like stickers, music kits, keys, etc.
  const floatCompatibleCategories = [
    "knife",
    "gloves",
    "rifle",
    "pistol",
    "smg",
    "heavy",
  ];
  const isStickerOrOther =
    skin.weapon?.toLowerCase().includes("sticker") ||
    skin.weapon?.toLowerCase().includes("pegatina") ||
    skin.weapon?.toLowerCase().includes("music kit") ||
    skin.weapon?.toLowerCase().includes("graffiti") ||
    skin.weapon?.toLowerCase().includes("key") ||
    skin.weapon?.toLowerCase().includes("pin") ||
    skin.weapon?.toLowerCase().includes("pass") ||
    !skin.category ||
    !floatCompatibleCategories.includes(skin.category.toLowerCase());
  const showFloatsModalTrigger =
    skin.isImmediate === false && !isStickerOrOther;

  // Calculate prices
  const prices = skinsInGroup.map((s) => s.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasDifferentPrices = minPrice !== maxPrice;

  // Determine cart states for this group
  const cartItemsInGroup = items.filter((item) =>
    skinsInGroup.some((s) => s.id === item.skin.id),
  );
  const totalQuantityInCart = cartItemsInGroup.length;
  const isInCart = totalQuantityInCart > 0;

  const handleActionClick = () => {
    if (showFloatsModalTrigger) {
      setIsFloatsModalOpen(true);
    } else if (isMultiple) {
      setIsModalOpen(true);
    } else {
      if (isInCart) {
        removeFromCart(skin.id);
      } else {
        addToCart(skin);
      }
    }
  };

  const handleIncrement = () => {
    // Find the first skin in skinsInGroup that is not already in the cart
    const nextAvailable = skinsInGroup.find(
      (s) => !items.some((item) => item.skin.id === s.id),
    );
    if (nextAvailable) {
      addToCart(nextAvailable);
    }
  };

  const handleDecrement = () => {
    // Find the last added skin from this group that is in the cart
    const lastAddedInCart = [...cartItemsInGroup].reverse()[0];
    if (lastAddedInCart) {
      removeFromCart(lastAddedInCart.skin.id);
    }
  };

  return (
    <div
      className={`
      group relative flex w-full flex-col bg-card rounded-2xl p-4 border transition-all duration-500
      ${
        isInCart
          ? "border-accent shadow-[0_0_25px_rgba(217,70,239,0.2)]"
          : "border-white/5 hover:border-white/10"
      }
    `}
    >
      {/* Item Name at the very top */}
      <div className="mb-2">
        <h2 className="text-[9.5px] font-black text-white leading-tight line-clamp-1 uppercase tracking-tight">
          {skin.isStatTrak && (
            <span className="text-[#cf6a32] font-black mr-1 border border-[#cf6a32]/30 px-1 py-0.2 rounded-[3px] bg-[#cf6a32]/10 text-[9px]">
              ST™
            </span>
          )}
          {skin.isSouvenir && (
            <span className="text-[#e4ae39] font-black mr-1 border border-[#e4ae39]/30 px-1 py-0.2 rounded-[3px] bg-[#e4ae39]/10 text-[9px]">
              SV
            </span>
          )}
          {skin.weapon} | <span className="text-[#aaaaff]">{skin.name}</span>
          {skin.phase && (
            <span className="text-[#d946ef] font-black ml-1">
              | {skin.phase}
            </span>
          )}
        </h2>
      </div>

      {/* Info Panel */}
      {!isMultiple ? (
        // Standard single item info panel (mantiene altura h-[42px] fija para evitar que se desplace el contenido si no tiene float)
        <div
          onClick={
            showFloatsModalTrigger
              ? () => setIsFloatsModalOpen(true)
              : undefined
          }
          className={`flex flex-col gap-1 p-2 rounded-[8px] mb-3 bg-transparent font-mono text-[9px] h-[42px] justify-center ${
            showFloatsModalTrigger
              ? "cursor-pointer hover:bg-white/[0.02] transition-colors"
              : ""
          }`}
        >
          {(() => {
            const isMarket = skin.isImmediate === false;
            const floatRange = isMarket
              ? getFloatRangeFromExterior(skin.exterior)
              : null;
            const hasFloat = skin.float !== undefined || floatRange !== null;

            if (!hasFloat) {
              // Si no tiene float (pegatinas, cajas, consumibles), dejamos el contenedor vacío pero conservamos la altura
              return null;
            }

            return (
              <>
                {/* Exterior + seed/seed-range */}
                <div className="flex items-center justify-between">
                  <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">
                    {skin.exterior || conditionLabel}
                  </span>
                  {isMarket ? (
                    <span className="text-[#84849b] text-[8px]">
                      Semilla:{" "}
                      <span className="text-white/60 font-bold">0 - 999</span>
                    </span>
                  ) : (
                    skin.pattern !== undefined && (
                      <span className="text-[#84849b] text-[8px]">
                        Semilla:{" "}
                        <span className="text-white font-bold">
                          {skin.pattern}
                        </span>
                      </span>
                    )
                  )}
                </div>

                {/* Float exacto (bot) o rango (market) */}
                {skin.float !== undefined ? (
                  // Bot item: float exacto
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center justify-between text-[#84849b] text-[8px]">
                      <span>Float</span>
                      <span className="text-white font-bold">
                        {skin.float.toFixed(6)}
                      </span>
                    </div>
                    <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 left-[7%] w-[1px] bg-white/20" />
                      <div className="absolute top-0 bottom-0 left-[15%] w-[1px] bg-white/20" />
                      <div className="absolute top-0 bottom-0 left-[38%] w-[1px] bg-white/20" />
                      <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-white/20" />
                      <div
                        className={`h-full ${getFloatColorClass(skin.float)} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, skin.float * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : floatRange ? (
                  // Market listing: rango de float según exterior
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center justify-between text-[#84849b] text-[8px]">
                      <span>Float</span>
                      <span className="text-white/70 font-bold">
                        {floatRange[0].toFixed(2)} — {floatRange[1].toFixed(2)}
                      </span>
                    </div>
                    <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 left-[7%] w-[1px] bg-white/20" />
                      <div className="absolute top-0 bottom-0 left-[15%] w-[1px] bg-white/20" />
                      <div className="absolute top-0 bottom-0 left-[38%] w-[1px] bg-white/20" />
                      <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-white/20" />
                      {/* Barra que muestra el rango completo del exterior, no un punto */}
                      <div
                        className={`h-full ${getRangeColorClass(floatRange[0])} rounded-full opacity-60`}
                        style={{
                          marginLeft: `${floatRange[0] * 100}%`,
                          width: `${(floatRange[1] - floatRange[0]) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
      ) : (
        // Premium grouped items info panel (mantiene altura h-[42px] fija)
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col gap-1 p-2 rounded-[8px] mb-3 bg-transparent hover:bg-white/[0.02] font-mono text-[9px] cursor-pointer transition-colors h-[42px] justify-center"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">
              {skin.exterior || conditionLabel}
            </span>
            <span className="text-[#84849b] text-[8px] font-bold uppercase tracking-wider text-accent">
              Múltiples Floats
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1 text-[8px] text-[#84849b]">
            <div className="flex items-center justify-between">
              <span>Rango Floats:</span>
              <span className="text-white font-bold">
                {Math.min(...skinsInGroup.map((s) => s.float || 0)).toFixed(4)}{" "}
                -{" "}
                {Math.max(...skinsInGroup.map((s) => s.float || 0)).toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Image Container (transparent & borderless - stuck to rarity divider) */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center mt-2 mb-0 bg-transparent overflow-hidden">
        {/* Immediate Trade or Resell Status Badge */}
        {skin.isImmediate !== false ? (
          <div className="absolute top-2 left-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-2 py-0.5 text-[8px] font-black uppercase text-emerald-400 tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.15)] flex items-center gap-1 z-10 select-none">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
            ⚡ Trade Inmediato
          </div>
        ) : (
          <div className="absolute top-2 left-2 bg-indigo-500/20 border border-indigo-500/40 rounded-full px-2 py-0.5 text-[8px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1 z-10 select-none">
            <span className="w-1 h-1 rounded-full bg-indigo-400"></span>⏳ Bajo
            Pedido
          </div>
        )}

        {/* Spotlight beam coming from below (from the rarity bar upwards - perfectly scaled) */}
        <div
          className="absolute bottom-0 left-0 right-0 mx-auto w-full h-[100%] opacity-0 translate-y-6 group-hover:opacity-35 group-hover:translate-y-0 transition-all duration-700 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at bottom, ${rarityHexColors[skin.rarity] || "#ffffff"} 0%, transparent 70%)`,
          }}
        />

        <Image
          src={skin.imageUrl}
          alt={skin.name}
          width={180}
          height={130}
          className="object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        />

        {/* Stock Badge positioned at the bottom-right of the image container (only on re-sale / under-order catalog items) */}
        {/* skin.isImmediate === false &&
          (skin.youpinVolume || 0) > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/40 border border-white/5 backdrop-blur-[2px] rounded-full px-2 py-0.5 text-[7.5px] font-bold text-white/60 uppercase tracking-widest font-mono z-10 select-none">
              Stock:{" "}
              {(
                skin.youpinVolume || 0
              ).toLocaleString()}
            </div>
          ) */}

        {/* Absolute count badge positioned next to the image (transparent design) */}
        {isMultiple && (
          <div className="absolute bottom-2 right-2 bg-transparent select-none animate-fade-in z-10">
            <span className="text-[11px] font-black text-white/50 font-mono">
              x{skinsInGroup.length}
            </span>
          </div>
        )}
      </div>

      {/* Rarity Divider (stuck perfectly to the bottom of the image container) */}
      <div
        className={`h-[2px] w-full mb-3 rounded-full ${rarityColors[skin.rarity] || "bg-white/10"} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
      />

      {/* Price Section */}
      <div className="flex flex-col gap-0.5 mb-3 mt-auto pt-3 border-t border-white/5">
        <div className="text-lg font-black text-white tracking-tight leading-none">
          ${skin.price.toLocaleString()}{" "}
          <span className="text-[10px] text-[#84849b] ml-0.5">USD</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 h-10 w-full shrink-0">
        {!isMultiple ? (
          // Single Item Actions (Comprar o En el Carrito)
          !isInCart ? (
            <>
              <button
                onClick={handleActionClick}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-accent rounded-lg text-white text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:brightness-110 transition-all active:scale-95 cursor-pointer border-none animate-fade-in shrink-0 min-w-0"
              >
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                Comprar
              </button>
              <button
                onClick={
                  showFloatsModalTrigger
                    ? () => setIsFloatsModalOpen(true)
                    : () => addToCart(skin)
                }
                className="w-8 sm:w-10 flex items-center justify-center bg-secondary rounded-lg text-white hover:bg-secondary/80 transition-colors border border-white/5 active:scale-95 cursor-pointer animate-fade-in shrink-0"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleActionClick}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-all active:scale-95 cursor-pointer animate-fade-in shrink-0 min-w-0"
              >
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-emerald-400" />
                Carrito
              </button>
              <button
                onClick={() => removeFromCart(skin.id)}
                className="w-8 sm:w-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-lg transition-colors active:scale-95 cursor-pointer animate-fade-in shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
            </>
          )
        ) : // Grouped Items Actions (With quantity selector and Eye button)
        !isInCart ? (
          <>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-accent rounded-lg text-white text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:brightness-110 transition-all active:scale-95 cursor-pointer border-none shrink-0 min-w-0"
            >
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              Elegir
            </button>
            <button
              onClick={handleIncrement}
              className="w-8 sm:w-10 flex items-center justify-center bg-secondary rounded-lg text-white hover:bg-secondary/80 transition-colors border border-white/5 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </>
        ) : (
          <>
            {/* Quantity increment / decrement selector directly on the card */}
            <div className="flex-1 flex items-center justify-between bg-secondary rounded-lg border border-white/10 overflow-hidden shrink-0 min-w-0">
              <button
                onClick={handleDecrement}
                className="w-7 sm:w-10 h-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-white/50 hover:text-white border-none bg-transparent shrink-0"
              >
                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              </button>
              <span className="text-[8.5px] sm:text-[10px] font-black text-white truncate px-1 shrink-0">
                {totalQuantityInCart} en carro
              </span>
              <button
                onClick={handleIncrement}
                disabled={totalQuantityInCart >= skinsInGroup.length}
                className="w-7 sm:w-10 h-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-white/50 hover:text-white border-none bg-transparent shrink-0"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              </button>
            </div>

            {/* Eye button on the right to view options */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-8 sm:w-10 flex items-center justify-center bg-secondary hover:bg-white/10 text-white hover:text-accent border border-white/5 rounded-lg active:scale-95 transition-all cursor-pointer shrink-0"
              title="Ver todas las opciones"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </>
        )}
      </div>

      {/* Premium React Portal Float Selection Modal */}
      {mounted &&
        isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg bg-[#0e0d15]/95 border border-white/10 rounded-2xl p-6 shadow-[0_0_50px_rgba(217,70,239,0.15)] flex flex-col max-h-[85vh] animate-scale-up overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/5 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-accent tracking-wider">
                    {skin.weapon}
                  </span>
                  <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight mt-0.5">
                    {skin.name}{" "}
                    {skin.phase && (
                      <span className="text-accent">| {skin.phase}</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {skin.isImmediate !== false ? (
                      <span className="bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                        ⚡ Trade Inmediato
                      </span>
                    ) : (
                      <span className="bg-indigo-500/20 border border-indigo-500/35 text-indigo-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                        ⏳ Bajo Pedido
                      </span>
                    )}
                    <span className="text-[#84849b] text-[8px] uppercase font-bold tracking-wider">
                      {skinsInGroup.length} variantes
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Float Options List */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
                {skinsInGroup.map((s) => {
                  const cartItem = items.find((item) => item.skin.id === s.id);
                  const isThisInCart = !!cartItem;

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isThisInCart
                          ? "bg-accent/5 border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]"
                          : "bg-[#151322]/40 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {/* Float info */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-white">
                            {s.exterior || "Recién fabricado"}
                          </span>
                          {s.pattern !== undefined && (
                            <span className="text-[#84849b] text-[9px] font-mono">
                              Semilla:{" "}
                              <span className="text-white font-bold">
                                {s.pattern}
                              </span>
                            </span>
                          )}
                        </div>

                        {s.float !== undefined && (
                          <div className="flex flex-col gap-1 max-w-xs w-full">
                            <div className="flex items-center justify-between text-[9px] font-mono text-[#84849b]">
                              <span>Float:</span>
                              <span className="text-white font-bold">
                                {s.float.toFixed(8)}
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden relative">
                              <div className="absolute top-0 bottom-0 left-[7%] w-[1px] bg-white/20" />
                              <div className="absolute top-0 bottom-0 left-[15%] w-[1px] bg-white/20" />
                              <div className="absolute top-0 bottom-0 left-[38%] w-[1px] bg-white/20" />
                              <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-white/20" />

                              <div
                                className={`h-full ${getFloatColorClass(s.float)} rounded-full transition-all duration-500`}
                                style={{
                                  width: `${Math.min(100, s.float * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price and Button */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[#84849b] uppercase font-bold text-[8px] block">
                            Precio
                          </span>
                          <span className="text-sm font-black text-white">
                            ${s.price.toLocaleString()}
                          </span>
                        </div>

                        {!isThisInCart ? (
                          <button
                            onClick={() => addToCart(s)}
                            className="h-8 px-4 flex items-center justify-center bg-accent text-white hover:brightness-110 active:scale-95 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer border-none shadow-[0_0_15px_rgba(217,70,239,0.25)]"
                          >
                            Agregar
                          </button>
                        ) : (
                          <button
                            onClick={() => removeFromCart(s.id)}
                            className="h-8 px-4 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#84849b] uppercase tracking-wider">
                  Seleccionados: {totalQuantityInCart} variantes en el carrito
                </span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border-none"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {mounted && (
        <FloatsModal
          skin={skin}
          isOpen={isFloatsModalOpen}
          onClose={() => setIsFloatsModalOpen(false)}
        />
      )}
    </div>
  );
};
