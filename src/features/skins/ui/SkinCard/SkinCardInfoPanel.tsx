import React from "react";
import { Skin } from "../../domain/skin";
import {
  getFloatRangeFromExterior,
  getFloatColorClass,
  getRangeColorClass,
} from "./helpers";

interface SkinCardInfoPanelProps {
  skin: Skin;
  skinsInGroup: Skin[];
  isMultiple: boolean;
  showFloatsModalTrigger: boolean;
  conditionLabel: string;
  translateExterior: (exterior: string | null | undefined, fallback: string) => string;
  setIsFloatsModalOpen: (open: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  t: (key: string, params?: any) => string;
}

export const SkinCardInfoPanel = ({
  skin,
  skinsInGroup,
  isMultiple,
  showFloatsModalTrigger,
  conditionLabel,
  translateExterior,
  setIsFloatsModalOpen,
  setIsModalOpen,
  t,
}: SkinCardInfoPanelProps) => {
  if (!isMultiple) {
    const floatRange =
      skin.isImmediate === false && skin.float === undefined
        ? getFloatRangeFromExterior(skin.exterior)
        : null;
    const hasFloat = skin.float !== undefined || floatRange !== null;

    return (
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
        {!hasFloat ? null : (
          <>
            {/* Exterior + seed/seed-range */}
            <div className="flex items-center justify-between">
              <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">
                {translateExterior(skin.exterior, conditionLabel)}
              </span>
              {skin.pattern !== undefined ? (
                <span className="text-[#84849b] text-[8px]">
                  {t("checkout.seed")}:{" "}
                  <span className="text-white font-bold">
                    {skin.pattern}
                  </span>
                </span>
              ) : skin.isImmediate === false ? (
                <span className="text-[#84849b] text-[8px]">
                  {t("checkout.seed")}:{" "}
                  <span className="text-white/60 font-bold">0 - 999</span>
                </span>
              ) : null}
            </div>

            {/* Float exacto (bot) o rango (market) */}
            {skin.float !== undefined ? (
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
        )}
      </div>
    );
  }

  // Premium grouped items info panel
  return (
    <div
      onClick={() => setIsModalOpen(true)}
      className="flex flex-col gap-1 p-2 rounded-[8px] mb-3 bg-transparent hover:bg-white/[0.02] font-mono text-[9px] cursor-pointer transition-colors h-[42px] justify-center"
    >
      <div className="flex items-center justify-between">
        <span className="font-sans font-black text-white/80 uppercase text-[8px] tracking-wider">
          {translateExterior(skin.exterior, conditionLabel)}
        </span>
        <span className="text-[#84849b] text-[8px] font-bold uppercase tracking-wider text-accent">
          {t("skinCard.multipleFloats")}
        </span>
      </div>

      <div className="flex flex-col gap-1 mt-1 text-[8px] text-[#84849b]">
        <div className="flex items-center justify-between">
          <span>{t("skinCard.floatRange")}:</span>
          <span className="text-white font-bold">
            {Math.min(...skinsInGroup.map((s) => s.float || 0)).toFixed(4)} -{" "}
            {Math.max(...skinsInGroup.map((s) => s.float || 0)).toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};
