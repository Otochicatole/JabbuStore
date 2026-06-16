/**
 * Listing de mercado externo (YouPin) obtenido via SteamWebAPI.
 * NO es un ítem físico en inventario de bots.
 */
export interface MarketListing {
  id: string;
  name: string;
  /** Plataforma de reventa */
  provider: 'youpin';
  youpinAsk: number | null;
  youpinVolume: number | null;
  /** Precio base del proveedor seleccionado */
  price: number;
  /** Precio con modificador de admin aplicado */
  displayPrice: number;
  iconUrl: string | null;
  rarity: string;
  exterior: string | null;
  category: string;
  isStatTrak: boolean;
  isSouvenir: boolean;
  isPriceManual: boolean;
  createdAt: string;
  updatedAt: string;
}
