"use client";

import { Skin } from "@/features/skins/domain/skin";
import { FilterState } from "@/features/filters/context/FilterContext";

// Maps sidebar condition labels → float ranges (same as card labels)
const CONDITION_FLOAT_MAP: Record<string, [number, number]> = {
  "De Fábrica":       [0,    0.07],
  "Desgaste Mínimo":  [0.07, 0.15],
  "Probado En Campo": [0.15, 0.38],
  "Bastante Usado":   [0.38, 0.45],
  "Muy Desgastado":   [0.45, 1.01],
};

// Category keywords matched against skin.weapon
const CATEGORY_WEAPON_MAP: Record<string, string[]> = {
  "Knives":         ["Karambit","Bayonet","Knife","Navaja","Stiletto","Ursus","Talon","Huntsman","Falchion","Shadow","Gut","M9","Flip","Butterfly","Skeleton","Classic"],
  "Gloves":         ["Gloves","Wraps","Glove"],
  "Pistols":        ["USP","Glock","P250","P2000","Desert Eagle","Five-SeveN","CZ75","Tec-9","Dual Berettas","R8","Deagle"],
  "SMGs":           ["MP5","MP7","MP9","MAC-10","PP-Bizon","P90","UMP-45"],
  "Assault Rifles": ["AK-47","M4A4","M4A1-S","FAMAS","Galil","AUG","SG 553"],
  "Sniper Rifles":  ["AWP","SSG 08","SCAR-20","G3SG1"],
  "Shotguns":       ["Nova","XM1014","MAG-7","Sawed-Off"],
  "Machineguns":    ["M249","Negev"],
  "Agents":         ["Agent","Commander","Officer","Operator","Master"],
  "Containers":     ["Case","Package","Capsule","Patch Pack","Graffiti Box","Souvenir"],
  "Music Kits":     ["Music Kit"],
  "Patches":        ["Patch"],
  "Stickers":       ["Sticker"],
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
    case "Más recientes":
      // id is assetId; higher numeric id = newer item
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
      break;
    case "Populares":
      // Use rarity as a popularity proxy: ancient > legendary > ...
      const rarityOrder: Record<string, number> = {
        ancient: 6, immortal: 5, legendary: 4, mythical: 3, rare: 2, uncommon: 1, common: 0,
      };
      result.sort((a, b) => (rarityOrder[b.rarity] ?? 0) - (rarityOrder[a.rarity] ?? 0));
      break;
  }

  return result;
}
