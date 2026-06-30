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
  /** Enlace steam:// para inspeccionar in-game (ítems de bot) */
  inspectLink?: string | null;
  /** Variantes exactas cuando el catálogo viene agrupado desde backend. */
  variants?: Skin[];
  isSpecific?: boolean;
}

export interface SkinPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SkinCatalogResult {
  items: Skin[];
  pagination: SkinPagination;
}

export interface SkinCatalogQuery {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  categories?: string[];
  conditions?: string[];
  sort?: string;
  immediate?: boolean;
  group?: boolean;
}

export interface SkinRepository {
  getSkins(query?: SkinCatalogQuery): Promise<SkinCatalogResult>;
  getSkinById(id: string): Promise<Skin | null>;
}
