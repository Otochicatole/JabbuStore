import React from "react";
import { Skin } from "../../domain/skin";
import { ShoppingCart, Plus, Minus, Eye, Check, Trash2 } from "lucide-react";
import { InspectInGameButton } from "./InspectInGameButton";

interface SkinCardActionsProps {
  skin: Skin;
  isInCart: boolean;
  isMultiple: boolean;
  showFloatsModalTrigger: boolean;
  totalQuantityInCart: number;
  skinsInGroupLength: number;
  handleActionClick: () => void;
  handleIncrement: () => void;
  handleDecrement: () => void;
  setIsFloatsModalOpen: (open: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  addToCart: (skin: Skin) => void;
  removeFromCart: (id: string) => void;
  t: (key: string, params?: any) => string;
}

export const SkinCardActions = ({
  skin,
  isInCart,
  isMultiple,
  showFloatsModalTrigger,
  totalQuantityInCart,
  skinsInGroupLength,
  handleActionClick,
  handleIncrement,
  handleDecrement,
  setIsFloatsModalOpen,
  setIsModalOpen,
  addToCart,
  removeFromCart,
  t,
}: SkinCardActionsProps) => {
  return (
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
              {t("nav.buy")}
            </button>
            {skin.inspectLink && (
              <InspectInGameButton
                href={skin.inspectLink}
                title={t("skinCard.inspectInGame")}
                className="w-8 sm:w-10 h-10"
              />
            )}
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
              {t("cart.title")}
            </button>
            {skin.inspectLink && (
              <InspectInGameButton
                href={skin.inspectLink}
                title={t("skinCard.inspectInGame")}
                className="w-8 sm:w-10 h-10"
              />
            )}
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
            {t("skinCard.choose")}
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
              {t("skinCard.inCartCount", { count: totalQuantityInCart })}
            </span>
            <button
              onClick={handleIncrement}
              disabled={totalQuantityInCart >= skinsInGroupLength}
              className="w-7 sm:w-10 h-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-white/50 hover:text-white border-none bg-transparent shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            </button>
          </div>

          {/* Eye button on the right to view options */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-8 sm:w-10 flex items-center justify-center bg-secondary hover:bg-white/10 text-white hover:text-accent border border-white/5 rounded-lg active:scale-95 transition-all cursor-pointer shrink-0"
            title={t("skinCard.viewOptions")}
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </button>
        </>
      )}
    </div>
  );
};
