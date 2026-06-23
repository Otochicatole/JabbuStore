import React from "react";

interface SkinCardPriceProps {
  price: number;
}

export const SkinCardPrice = ({ price }: SkinCardPriceProps) => {
  return (
    <div className="flex flex-col gap-0.5 mb-3 mt-auto pt-3 border-t border-white/5">
      <div className="text-lg font-black text-white tracking-tight leading-none">
        ${price.toLocaleString()}{" "}
        <span className="text-[10px] text-[#84849b] ml-0.5">USD</span>
      </div>
    </div>
  );
};
