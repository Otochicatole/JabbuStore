import React from "react";
import { Money } from "@/features/currency/ui/Money";

interface SkinCardPriceProps {
  price: number;
  priceFromLabel?: string;
}

export const SkinCardPrice = ({ price, priceFromLabel }: SkinCardPriceProps) => {
  return (
    <div className="flex flex-col gap-0.5 mt-auto pt-3 border-t border-white/5">
      {priceFromLabel && (
        <span className="text-[8px] font-black uppercase tracking-widest text-[#84849b] leading-none">
          {priceFromLabel}
        </span>
      )}
      <Money amountUsd={price} className="text-lg font-black text-white tracking-tight leading-none" />
    </div>
  );
};
