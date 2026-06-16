export type SkinRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "mythical"
  | "legendary"
  | "ancient"
  | "immortal";

export interface Skin {
  id: string;
  name: string;
  weapon: string;
  rarity: SkinRarity;
  price: number;
  imageUrl: string;
  float?: number;
  pattern?: number;
  exterior?: string | null;
  category?: string;
  isStatTrak?: boolean;
  isSouvenir?: boolean;
  phase?: string;
  isImmediate?: boolean;
  /** 'bot' = ítem físico de Steam | 'youpin' = catálogo de mercado externo */
  provider?: "bot" | "youpin";
  /** Para market listings: precio ask en YouPin */
  youpinAsk?: number | null;
  /** Volumen de stock en YouPin */
  youpinVolume?: number | null;
}

export interface SkinRepository {
  getSkins(): Promise<Skin[]>;
  getSkinById(id: string): Promise<Skin | null>;
}
