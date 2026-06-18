/**
 * Asset YouPin indexado (un float = una fila en catálogo).
 * Misma forma que GET /market/listings (admin y tienda /buy reventa).
 */
export interface MarketStoreAsset {
  id: string;
  floatItemId: string;
  assetId: string;
  listingId: string;
  name: string;
  provider: "youpin";
  youpinAsk: number | null;
  youpinVolume: number | null;
  /** Precio base del float (USD). */
  price: number;
  /** Precio con marketModifier de admin. */
  displayPrice: number;
  float: number;
  pattern: number;
  inspectLink: string | null;
  externalId: string | null;
  iconUrl: string | null;
  rarity: string;
  exterior: string | null;
  category: string;
  isStatTrak: boolean;
  isSouvenir: boolean;
}

/** @deprecated Usar MarketStoreAsset — alias legacy del panel admin. */
export type MarketListing = MarketStoreAsset;
