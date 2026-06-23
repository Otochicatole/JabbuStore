import React from "react";
import { Skin } from "../../domain/skin";
import { SkinImage } from "@/shared/components/SkinImage";
import { rarityHexColors } from "./helpers";

interface SkinCardImageProps {
  skin: Skin;
  isMultiple: boolean;
  priority?: boolean;
  skinsInGroupCount: number;
  t: (key: string) => string;
}

export const SkinCardImage = ({
  skin,
  isMultiple,
  priority,
  skinsInGroupCount,
  t,
}: SkinCardImageProps) => {
  return (
    <div className="relative aspect-[4/3] w-full flex items-center justify-center mt-2 mb-0 bg-transparent overflow-hidden">
      {/* Immediate Trade or Resell Status Badge */}
      {skin.isImmediate !== false ? (
        <div className="absolute top-2 left-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-2 py-0.5 text-[7px] font-black uppercase text-emerald-400 tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.15)] flex items-center gap-1 z-10 select-none">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
          ⚡ {t("filters.instantTrade")}
        </div>
      ) : (
        <div className="absolute top-2 left-2 bg-indigo-500/20 border border-indigo-500/40 rounded-full px-2 py-0.5 text-[8px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1 z-10 select-none">
          <span className="w-1 h-1 rounded-full bg-indigo-400"></span>⏳ {t("skinCard.onRequest")}
        </div>
      )}

      {/* Spotlight beam coming from below (from the rarity bar upwards - perfectly scaled) */}
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto w-full h-[100%] opacity-0 translate-y-6 group-hover:opacity-35 group-hover:translate-y-0 transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at bottom, ${rarityHexColors[skin.rarity] || "#ffffff"} 0%, transparent 70%)`,
        }}
      />

      <SkinImage
        src={skin.imageUrl}
        alt={skin.name}
        priority={priority}
        className="transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
      />

      {/* Absolute count badge positioned next to the image (transparent design) */}
      {isMultiple && (
        <div className="absolute bottom-2 right-2 bg-transparent select-none animate-fade-in z-10">
          <span className="text-[11px] font-black text-white/50 font-mono">
            x{skinsInGroupCount}
          </span>
        </div>
      )}
    </div>
  );
};
