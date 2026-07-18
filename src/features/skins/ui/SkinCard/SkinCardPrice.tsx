import React from "react";
import { Money } from "@/features/currency/ui/Money";

interface SkinCardPriceProps {
  price: number;
}

export const SkinCardPrice = ({ price }: SkinCardPriceProps) => {
  return (
    <div className="flex flex-col gap-0.5 mb-3 mt-auto pt-3 border-t border-white/5">
      <Money amountUsd={price} className="text-lg font-black text-white tracking-tight leading-none" />
    </div>
  );
};
