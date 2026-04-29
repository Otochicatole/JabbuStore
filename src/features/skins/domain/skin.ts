export type SkinRarity = 'common' | 'uncommon' | 'rare' | 'mythical' | 'legendary' | 'ancient' | 'immortal';

export interface Skin {
  id: string;
  name: string;
  weapon: string;
  rarity: SkinRarity;
  price: number;
  imageUrl: string;
  float?: number;
  pattern?: number;
}

export interface SkinRepository {
  getSkins(): Promise<Skin[]>;
  getSkinById(id: string): Promise<Skin | null>;
}
