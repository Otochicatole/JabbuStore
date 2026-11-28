import React from "react";
import { Money } from "@/features/currency/ui/Money";

interface SkinCardPriceProps {
  price: number;
  priceFromLabel?: string;
}

export const SkinCardPrice = ({ price, priceFromLabel }: SkinCardPriceProps) => {
  return (
    <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-white/5">
      {priceFromLabel && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9e99b8] leading-none">
          {priceFromLabel}
        </span>
      )}
      <Money amountUsd={price} className="text-lg font-black text-white tracking-tight leading-none" />
    </div>
  );
};
