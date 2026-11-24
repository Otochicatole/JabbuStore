import { OrderItem } from "@/features/admin/domain/types";

export const rarityColors: Record<string, string> = {
  common: "border-[#b0c3d9]/35",
  uncommon: "border-[#5e98d9]/35",
  rare: "border-[#4b69ff]/35",
  mythical: "border-[#8847ff]/35",
  legendary: "border-[#d32ce6]/35",
  ancient: "border-[#eb4b4b]/35",
};

export const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getItemExterior = (item: OrderItem) => {
  if (item.exterior) return item.exterior;
  const name = item.name.toLowerCase();
  if (name.includes('factory new') || name.includes('(fn)')) return 'Factory New';
  if (name.includes('minimal wear') || name.includes('(mw)')) return 'Minimal Wear';
  if (name.includes('field-tested') || name.includes('(ft)')) return 'Field-Tested';
  if (name.includes('well-worn') || name.includes('(ww)')) return 'Well-Worn';
  if (name.includes('battle-scarred') || name.includes('(bs)')) return 'Battle-Scarred';
  return null;
};

export const getItemRarity = (item: OrderItem) => {
  if (item.rarity) return item.rarity;
  const name = item.name.toLowerCase();
  if (name.includes('★') || name.includes('karambit') || name.includes('m9') || name.includes('butterfly') || name.includes('knife') || name.includes('gloves')) {
    return 'ancient';
  }
  if (name.includes('doppler') || name.includes('fade') || name.includes('vulcan') || name.includes('asiimov')) {
    return 'ancient';
  }
  return 'common';
};
