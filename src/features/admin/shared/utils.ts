import { OrderItem } from "@/features/admin/domain/types";

export const rarityColors: Record<string, string> = {
  common: 'border-l-4 border-l-[#b0c3d9]',
  uncommon: 'border-l-4 border-l-[#5e98d9]',
  rare: 'border-l-4 border-l-[#4b69ff]',
  mythical: 'border-l-4 border-l-[#8847ff]',
  legendary: 'border-l-4 border-l-[#d32ce6]',
  ancient: 'border-l-4 border-l-[#eb4b4b]',
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
