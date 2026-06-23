export const rarityColors: Record<string, string> = {
  common: "bg-[#b0c3d9]",
  uncommon: "bg-[#5e98d9]",
  rare: "bg-[#4b69ff]",
  mythical: "bg-[#8847ff]",
  legendary: "bg-[#d32ce6]",
  ancient: "bg-[#eb4b4b]",
  immortal: "bg-[#e4ae39]",
};

export const rarityHexColors: Record<string, string> = {
  common: "#b0c3d9",
  uncommon: "#5e98d9",
  rare: "#4b69ff",
  mythical: "#8847ff",
  legendary: "#d32ce6",
  ancient: "#eb4b4b",
  immortal: "#e4ae39",
};

export const getConditionLabelKey = (float?: number) => {
  if (float === undefined) return "filters.condition.factoryNew";
  if (float < 0.07) return "filters.condition.factoryNew";
  if (float < 0.15) return "filters.condition.minimalWear";
  if (float < 0.38) return "filters.condition.fieldTested";
  if (float < 0.45) return "filters.condition.wellWorn";
  return "filters.condition.battleScarred";
};

/** Devuelve el rango de float [min, max] según el exterior (para market listings sin float individual) */
export const getFloatRangeFromExterior = (
  exterior: string | null | undefined,
): [number, number] | null => {
  if (!exterior) return null;
  const ext = exterior.toLowerCase();
  if (ext.includes("factory") || ext.includes("fn") || ext.includes("recién"))
    return [0.0, 0.07];
  if (ext.includes("minimal") || ext.includes("mw") || ext.includes("casi"))
    return [0.07, 0.15];
  if (ext.includes("field") || ext.includes("ft") || ext.includes("algo"))
    return [0.15, 0.38];
  if (ext.includes("well") || ext.includes("ww") || ext.includes("bastante"))
    return [0.38, 0.45];
  if (
    ext.includes("battle") ||
    ext.includes("bs") ||
    ext.includes("deplorable")
  )
    return [0.45, 1.0];
  return null;
};

export const getFloatColorClass = (float?: number) => {
  if (float === undefined) return "bg-[#10b981]"; // Green
  if (float < 0.07) return "bg-[#10b981]"; // Factory New (Green)
  if (float < 0.15) return "bg-[#84cc16]"; // Minimal Wear (Lime)
  if (float < 0.38) return "bg-[#eab308]"; // Field-Tested (Yellow)
  if (float < 0.45) return "bg-[#f97316]"; // Well-Worn (Orange)
  return "bg-[#ef4444]"; // Battle-Scarred (Red)
};

export const getRangeColorClass = (min: number): string => {
  if (min < 0.07) return "bg-[#10b981]";
  if (min < 0.15) return "bg-[#84cc16]";
  if (min < 0.38) return "bg-[#eab308]";
  if (min < 0.45) return "bg-[#f97316]";
  return "bg-[#ef4444]";
};

export const getExteriorLabelKey = (exterior: string | null | undefined) => {
  if (!exterior) return null;
  const ext = exterior.toLowerCase();
  if (ext.includes("factory") || ext.includes("fn") || ext.includes("recién"))
    return "filters.condition.factoryNew";
  if (ext.includes("minimal") || ext.includes("mw") || ext.includes("casi"))
    return "filters.condition.minimalWear";
  if (ext.includes("field") || ext.includes("ft") || ext.includes("algo"))
    return "filters.condition.fieldTested";
  if (ext.includes("well") || ext.includes("ww") || ext.includes("bastante"))
    return "filters.condition.wellWorn";
  if (ext.includes("battle") || ext.includes("bs") || ext.includes("deplorable"))
    return "filters.condition.battleScarred";
  return null;
};
