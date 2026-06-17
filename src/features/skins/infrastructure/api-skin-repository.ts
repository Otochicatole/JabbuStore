import { Skin, SkinRepository, SkinRarity } from "../domain/skin";
import { BACKEND_URL } from "@/shared/lib/api";

// ─── Tipos de respuesta del backend ───────────────────────────────────────────

export interface StoreItem {
  assetId: string;
  classId: string;
  name: string;
  type: string;
  iconUrl: string | null;
  tradable: boolean;
  marketable: boolean;
  price?: number;
  displayPrice?: number;
  rarity?: string;
  exterior?: string | null;
  category?: string;
  isStatTrak?: boolean;
  isSouvenir?: boolean;
  float?: number | null;
  pattern?: number | null;
  inspectLink?: string | null;
}

export interface MarketStoreAssetItem {
  id: string;
  floatItemId: string;
  assetId: string;
  listingId: string;
  name: string;
  provider: "youpin";
  youpinAsk: number | null;
  youpinVolume: number | null;
  price: number;
  displayPrice?: number;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSkinRarity(raw: string | undefined): SkinRarity {
  const normalized = (raw || "common").toLowerCase();
  const valid: SkinRarity[] = [
    "common",
    "uncommon",
    "rare",
    "mythical",
    "legendary",
    "ancient",
    "immortal",
  ];
  return valid.includes(normalized as SkinRarity)
    ? (normalized as SkinRarity)
    : "common";
}

function parseName(fullName: string): {
  weapon: string;
  skinName: string;
  phase?: string;
} {
  if (fullName.includes(" | ")) {
    const parts = fullName.split(" | ");
    const weapon = parts[0] || "Item";
    let skinName = parts[1] || "";
    const phase = parts.length > 2 ? parts[2] : undefined;
    // Quitar desgaste del nombre: "Redline (Field-Tested)" → "Redline"
    if (skinName.includes(" (")) skinName = skinName.split(" (")[0] || skinName;
    return { weapon, skinName, phase };
  }
  return { weapon: "Item", skinName: fullName };
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

/**
 * Convierte un ítem físico de bot Steam al formato Skin.
 * Mantiene float y seed reales del inventario de Steam.
 */
function mapBotItemToSkin(item: StoreItem): Skin {
  const { weapon, skinName, phase } = parseName(item.name);
  const price =
    item.displayPrice && item.displayPrice > 0
      ? item.displayPrice
      : item.price || 0;

  return {
    id: item.assetId,
    name: skinName,
    weapon,
    rarity: toSkinRarity(item.rarity),
    price,
    imageUrl: item.iconUrl || "/skin.webp",
    float: item.float ?? undefined,
    pattern: item.pattern ?? undefined,
    exterior: item.exterior || null,
    category: item.category || "other",
    isStatTrak: item.isStatTrak || false,
    isSouvenir: item.isSouvenir || false,
    phase,
    isImmediate: true,
    provider: "bot",
    inspectLink: item.inspectLink ?? null,
  };
}

/**
 * Convierte un asset YouPin individual (con float) al formato Skin.
 */
function mapMarketStoreAssetToSkin(item: MarketStoreAssetItem): Skin {
  const { weapon, skinName, phase } = parseName(item.name);
  const price =
    item.displayPrice && item.displayPrice > 0 ? item.displayPrice : item.price;

  return {
    id: item.id,
    name: skinName,
    weapon,
    rarity: toSkinRarity(item.rarity),
    price,
    imageUrl: item.iconUrl || "/skin.webp",
    float: item.float,
    pattern: item.pattern,
    exterior: item.exterior || null,
    category: item.category || "other",
    isStatTrak: item.isStatTrak || false,
    isSouvenir: item.isSouvenir || false,
    phase,
    isImmediate: false,
    provider: item.provider,
    youpinAsk: item.youpinAsk,
    youpinVolume: item.youpinVolume,
    inspectLink: item.inspectLink,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class ApiSkinRepository implements SkinRepository {
  async getSkins(): Promise<Skin[]> {
    try {
      // Fetch paralelo de bots (trade inmediato) y mercado (YouPin)
      const [botRes, marketRes] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/store/items`, {
          headers: {
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
            Accept: "application/json",
          },
          credentials: "include",
        }),
        fetch(`${BACKEND_URL}/market/listings`, {
          headers: {
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
            Accept: "application/json",
          },
          credentials: "include",
        }),
      ]);

      let botSkins: Skin[] = [];
      let marketSkins: Skin[] = [];

      if (botRes.status === "fulfilled" && botRes.value.ok) {
        const data = (await botRes.value.json()) as StoreItem[];
        if (Array.isArray(data)) botSkins = data.map(mapBotItemToSkin);
      }

      if (marketRes.status === "fulfilled" && marketRes.value.ok) {
        const data = (await marketRes.value.json()) as MarketStoreAssetItem[];
        if (Array.isArray(data)) marketSkins = data.map(mapMarketStoreAssetToSkin);
      }

      // Bots primero (trade inmediato), market listings después
      return [...botSkins, ...marketSkins];
    } catch (error) {
      console.error("Error in ApiSkinRepository.getSkins:", error);
      return [];
    }
  }

  async getSkinById(id: string): Promise<Skin | null> {
    try {
      const skins = await this.getSkins();
      return skins.find((s) => s.id === id) || null;
    } catch (error) {
      console.error("Error in ApiSkinRepository.getSkinById:", error);
      return null;
    }
  }
}
