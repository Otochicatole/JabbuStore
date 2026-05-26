"use client";

import { Skin } from "@/features/skins/domain/skin";
import { FilterState } from "@/features/filters/context/FilterContext";

// Maps sidebar condition labels → float ranges
const CONDITION_FLOAT_MAP: Record<string, [number, number]> = {
  "Recién fabricado":    [0,    0.07],
  "Casi nuevo":           [0.07, 0.15],
  "Algo desgastado":      [0.15, 0.38],
  "Bastante desgastado":  [0.38, 0.45],
  "Deplorable":           [0.45, 1.01],
};

// Category keywords matched against skin.weapon
const CATEGORY_WEAPON_MAP: Record<string, string[]> = {
  "Cuchillos":              ["Karambit","Bayonet","Knife","Navaja","Stiletto","Ursus","Talon","Huntsman","Falchion","Shadow","Gut","M9","Flip","Butterfly","Skeleton","Classic"],
  "Guantes":                ["Gloves","Wraps","Glove"],
  "Pistolas":               ["USP","Glock","P250","P2000","Desert Eagle","Five-SeveN","CZ75","Tec-9","Dual Berettas","R8","Deagle"],
  "Subfusiles":             ["MP5","MP7","MP9","MAC-10","PP-Bizon","P90","UMP-45"],
  "Rifles de asalto":      ["AK-47","M4A4","M4A1-S","FAMAS","Galil","AUG","SG 553"],
  "Rifles de francotirador":["AWP","SSG 08","SCAR-20","G3SG1"],
  "Escopetas":              ["Nova","XM1014","MAG-7","Sawed-Off"],
  "Ametralladoras":         ["M249","Negev"],
  "Agentes":                ["Agent","Commander","Officer","Operator","Master"],
  "Contenedores":           ["Case","Package","Capsule","Patch Pack","Graffiti Box","Souvenir"],
  "Kits musicales":         ["Music Kit"],
  "Parches":                ["Patch"],
  "Pegatinas":              ["Sticker"],
};

// Normaliza el exterior en string al mismo código que CONDITION_FLOAT_MAP label
function exteriorMatchesCondition(exterior: string | null | undefined, cond: string): boolean {
  if (!exterior) return false;
  const ext = exterior.toLowerCase();
  switch (cond) {
    case 'Recién fabricado':    return ext.includes('factory') || ext.includes('fn') || ext.includes('recién');
    case 'Casi nuevo':          return ext.includes('minimal') || ext.includes('mw') || ext.includes('casi');
    case 'Algo desgastado':     return ext.includes('field') || ext.includes('ft') || ext.includes('algo');
    case 'Bastante desgastado': return ext.includes('well') || ext.includes('ww') || ext.includes('bastante');
    case 'Deplorable':          return ext.includes('battle') || ext.includes('bs') || ext.includes('deplorable');
    default: return false;
  }
}

export function applyFilters(skins: Skin[], filters: FilterState): Skin[] {
  let result = [...skins];

  // 1. Search
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.weapon.toLowerCase().includes(q)
    );
  }

  // 2. Price range
  const min = parseFloat(filters.minPrice);
  const max = parseFloat(filters.maxPrice);
  if (!isNaN(min)) result = result.filter(s => s.price >= min);
  if (!isNaN(max)) result = result.filter(s => s.price <= max);

  // 3. Categories
  if (filters.selectedCategories.length > 0) {
    result = result.filter(skin =>
      filters.selectedCategories.some(cat => {
        const keywords = CATEGORY_WEAPON_MAP[cat] ?? [];
        return keywords.some(kw =>
          skin.weapon.toLowerCase().includes(kw.toLowerCase())
        );
      })
    );
  }

  // 4. Conditions — soporta tanto float real (bots) como exterior string (market listings)
  if (filters.selectedConditions.length > 0) {
    result = result.filter(skin => {
      return filters.selectedConditions.some(cond => {
        // Bot items: usar float real
        if (skin.float !== undefined) {
          const range = CONDITION_FLOAT_MAP[cond];
          if (!range) return false;
          return skin.float >= range[0] && skin.float < range[1];
        }
        // Market listings: usar el campo exterior
        return exteriorMatchesCondition(skin.exterior, cond);
      });
    });
  }

  // 5. Sort
  switch (filters.sortOption) {
    case 'Precio: Mayor a Menor':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'Precio: Menor a Mayor':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'Float: Menor a Mayor':
      // Market listings (sin float) van al final
      result.sort((a, b) => {
        if (a.float === undefined && b.float === undefined) return 0;
        if (a.float === undefined) return 1;
        if (b.float === undefined) return -1;
        return a.float - b.float;
      });
      break;
    case 'Float: Mayor a Menor':
      // Market listings (sin float) van al final
      result.sort((a, b) => {
        if (a.float === undefined && b.float === undefined) return 0;
        if (a.float === undefined) return 1;
        if (b.float === undefined) return -1;
        return b.float - a.float;
      });
      break;
    case 'Más recientes':
      // id is assetId; higher numeric id = newer item
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
      break;
  }

  return result;
}
