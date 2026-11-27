import React from "react";
import { Skin } from "../../domain/skin";
import {
  getFloatRangeFromExterior,
  getRangeColorClass,
  getExteriorAbbreviation,
} from "./helpers";

interface SkinCardInfoPanelProps {
  skin: Skin;
  isMultiple: boolean;
  distinctExteriors?: string[];
  conditionLabel: string;
  translateExterior: (exterior: string | null | undefined, fallback: string) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const SkinCardInfoPanel = ({
  skin,
  isMultiple,
  distinctExteriors = [],
  conditionLabel,
  translateExterior,
  t,
}: SkinCardInfoPanelProps) => {
  const floatRange = getFloatRangeFromExterior(skin.exterior);
  const hasMultipleExteriors = distinctExteriors.length > 1;
  const hasFloat = floatRange !== null || hasMultipleExteriors;

  return (
    <div className="flex flex-col gap-1 p-2 rounded-[8px] mb-3 bg-transparent font-mono text-[9px] h-[42px] justify-center">
      {!hasFloat ? null : (
        <>
          {/* Exterior + seed/seed-range */}
          <div className="flex items-center justify-between">
            <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">
              {hasMultipleExteriors
                ? t("skinCard.multipleExteriors", { count: distinctExteriors.length })
                : translateExterior(skin.exterior, conditionLabel)}
            </span>
            {skin.pattern !== undefined && !isMultiple ? (
              <span className="text-[#84849b] text-[8px]">
                {t("checkout.seed")}:{" "}
                <span className="text-white font-bold">
                  {skin.pattern}
                </span>
              </span>
            ) : (
              <span className="text-[#84849b] text-[8px]">
                {t("checkout.seed")}:{" "}
                <span className="text-white/60 font-bold">0 - 999</span>
              </span>
            )}
          </div>

          {/* Generic Float Range */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between text-[#84849b] text-[8px]">
              <span>Float</span>
              <span className="text-white/75 font-black uppercase text-[8.5px]">
                {hasMultipleExteriors
                  ? `${distinctExteriors[0]} - ${distinctExteriors[distinctExteriors.length - 1]}`
                  : getExteriorAbbreviation(skin.exterior)}
              </span>
            </div>
            <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-[7%] w-[1px] bg-white/20" />
              <div className="absolute top-0 bottom-0 left-[15%] w-[1px] bg-white/20" />
              <div className="absolute top-0 bottom-0 left-[38%] w-[1px] bg-white/20" />
              <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-white/20" />
              {hasMultipleExteriors ? (
                <div className="h-full w-full bg-gradient-to-r from-[#10b981] via-[#eab308] to-[#ef4444] rounded-full opacity-60" />
              ) : floatRange ? (
                <div
                  className={`h-full ${getRangeColorClass(floatRange[0])} rounded-full opacity-60`}
                  style={{
                    marginLeft: `${floatRange[0] * 100}%`,
                    width: `${(floatRange[1] - floatRange[0]) * 100}%`,
                  }}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
