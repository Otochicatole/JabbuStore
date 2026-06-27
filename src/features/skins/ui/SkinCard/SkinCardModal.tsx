import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Skin } from "../../domain/skin";
import { InspectInGameButton } from "./InspectInGameButton";
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
  translateExterior: (exterior: string | null | undefined, fallback: string) => string;
  t: (key: string, params?: any) => string;
}

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
  return createPortal(
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
              <span className="text-[#84849b] text-[8px] uppercase font-bold tracking-wider">
                {t("skinCard.variantsCount", { count: skinsInGroup.length })}
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
                      {translateExterior(s.exterior, t("filters.condition.factoryNew"))}
                    </span>
                    {s.pattern !== undefined && (
                      <span className="text-[#84849b] text-[9px] font-mono">
                        {t("checkout.seed")}:{" "}
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
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <span className="text-[#84849b] uppercase font-bold text-[8px] block">
                      {t("common.price")}
                    </span>
                    <span className="text-sm font-black text-white">
                      ${s.price.toLocaleString()}
                    </span>
                  </div>

                  {s.inspectLink && (
                    <InspectInGameButton
                      href={s.inspectLink}
                      title={t("skinCard.inspectInGame")}
                    />
                  )}

                  {!isThisInCart ? (
                    <button
                      onClick={() => addToCart(s)}
                      className="h-8 px-4 flex items-center justify-center bg-accent text-white hover:brightness-110 active:scale-95 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer border-none shadow-[0_0_15px_rgba(217,70,239,0.25)]"
                    >
                      {t("common.add")}
                    </button>
                  ) : (
                    <button
                      onClick={() => removeFromCart(s.id)}
                      className="h-8 px-4 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer"
                    >
                      {t("common.remove")}
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
            {t("skinCard.selectedVariants", { count: totalQuantityInCart })}
          </span>
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border-none"
          >
            {t("skinCard.done")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
export default SkinCardModal;
