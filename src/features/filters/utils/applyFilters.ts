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

  // 4. Conditions
  if (filters.selectedConditions.length > 0) {
    result = result.filter(skin => {
      if (skin.float === undefined) return false;
      return filters.selectedConditions.some(cond => {
        const range = CONDITION_FLOAT_MAP[cond];
        if (!range) return false;
        return skin.float! >= range[0] && skin.float! < range[1];
      });
    });
  }

  // 5. Sort
  switch (filters.sortOption) {
    case "Precio: Mayor a Menor":
      result.sort((a, b) => b.price - a.price);
      break;
    case "Precio: Menor a Mayor":
      result.sort((a, b) => a.price - b.price);
      break;
    case "Float: Menor a Mayor":
      result.sort((a, b) => (a.float ?? 0) - (b.float ?? 0));
      break;
    case "Float: Mayor a Menor":
      result.sort((a, b) => (b.float ?? 0) - (a.float ?? 0));
      break;
    case "Más recientes":
      // id is assetId; higher numeric id = newer item
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
      break;
  }

  return result;
}
