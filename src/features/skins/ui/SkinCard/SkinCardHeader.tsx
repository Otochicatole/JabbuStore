import React from "react";
import { Skin } from "../../domain/skin";

interface SkinCardHeaderProps {
  skin: Skin;
}

export const SkinCardHeader = ({ skin }: SkinCardHeaderProps) => {
  return (
    <div className="mb-2 min-h-[24px]">
      <h2 className="text-[9.5px] font-black text-white leading-tight line-clamp-2 uppercase tracking-tight">
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
  );
};
