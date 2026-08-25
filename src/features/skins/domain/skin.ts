export type SkinRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "mythical"
  | "legendary"
  | "ancient"
  | "immortal";

export type CatalogItemType =
  | "pistol"
  | "knife"
  | "rifle"
  | "smg"
  | "sniper_rifle"
  | "shotgun"
  | "machinegun"
  | "gloves"
  | "equipment"
  | "sticker"
  | "container"
  | "agent"
  | "charm"
  | "graffiti"
  | "patch"
  | "music_kit"
  | "collectible"
  | "pass"
  | "key"
  | "gift"
  | "tool"
  | "tag"
  | "other";

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
  /** Indica si el tipo de artículo tiene stock individual consultable por float. */
  supportsFloatStock?: boolean;
  /** Clasificación canónica del artículo enviada por el backend. */
  catalogItemType?: CatalogItemType;
  /** Solo las armas y cuchillos participan del rango de precio público. */
  priceFilterEligible?: boolean;
  /** Variantes exactas cuando el catálogo viene agrupado desde backend. */
  variants?: Skin[];
  isSpecific?: boolean;
  /** market_hash_name del listing al que pertenece este float (para validación contra API) */
  listingId?: string;
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
  facets?: {
    categories: Record<string, number>;
  };
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
