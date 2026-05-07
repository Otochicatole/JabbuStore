import { Skin, SkinRepository, SkinRarity } from "../domain/skin";
import { BACKEND_URL } from "@/shared/lib/api";

export interface StoreItem {
  assetId: string;
  classId: string;
  name: string;
  type: string;
  iconUrl: string | null;
  tradable: boolean;
  marketable: boolean;
  botSteamId: string;
  price?: number;
  rarity?: string;
  exterior?: string | null;
  category?: string;
  isStatTrak?: boolean;
  isSouvenir?: boolean;
}

// Helper function to create deterministic hash codes from strings
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Map the backend StoreItem structure to the UI-compatible Skin interface deterministically
function mapStoreItemToSkin(item: StoreItem): Skin {
  let weapon = "Item";
  let skinName = item.name;
  
  if (item.name.includes(" | ")) {
    const parts = item.name.split(" | ");
    weapon = parts[0];
    skinName = parts[1];
  }
  
  // Clean up skinName wear suffix (e.g. "Redline (Field-Tested)" -> "Redline")
  let cleanSkinName = skinName;
  if (skinName.includes(" (")) {
    cleanSkinName = skinName.split(" (")[0];
  }

  // Determine Rarity based on description 'type' or fallback to database field
  let rarity: SkinRarity = 'common';
  if (item.rarity) {
    const normalized = item.rarity.toLowerCase();
    if (['common', 'uncommon', 'rare', 'mythical', 'legendary', 'ancient', 'immortal'].includes(normalized)) {
      rarity = normalized as SkinRarity;
    }
  } else {
    const typeLower = item.type.toLowerCase();
    if (
      typeLower.includes("encubierto") || 
      typeLower.includes("covert") || 
      typeLower.includes("cuchillo") || 
      typeLower.includes("knife") || 
      typeLower.includes("guantes") || 
      typeLower.includes("gloves") || 
      typeLower.includes("extraordinario") || 
      typeLower.includes("contrabando")
    ) {
      rarity = 'ancient';
    } else if (typeLower.includes("clasificado") || typeLower.includes("classified")) {
      rarity = 'legendary';
    } else if (typeLower.includes("restringido") || typeLower.includes("restricted")) {
      rarity = 'mythical';
    } else if (typeLower.includes("militar") || typeLower.includes("mil-spec")) {
      rarity = 'rare';
    } else if (typeLower.includes("industrial")) {
      rarity = 'uncommon';
    } else if (typeLower.includes("consumo") || typeLower.includes("consumer")) {
      rarity = 'common';
    } else {
      const rarities: SkinRarity[] = ['common', 'uncommon', 'rare', 'mythical', 'legendary', 'ancient'];
      const index = Math.abs(hashCode(item.classId)) % rarities.length;
      rarity = rarities[index];
    }
  }

  // Generate deterministic price based on rarity tier and a percentage variance based on assetId
  let basePrice = 5;
  if (rarity === 'ancient') basePrice = 1200;
  else if (rarity === 'legendary') basePrice = 280;
  else if (rarity === 'mythical') basePrice = 85;
  else if (rarity === 'rare') basePrice = 30;
  else if (rarity === 'uncommon') basePrice = 12;

  const variance = (Math.abs(hashCode(item.assetId)) % 100) / 100; // 0.0 to 1.0
  const finalPrice = item.price && item.price > 0
    ? item.price
    : Math.round(basePrice * (0.8 + variance * 0.4) * 100) / 100; // variance of +/-20% as fallback

  // Generate deterministic float value based on name wear tags
  let floatVal = 0.15; // default field tested
  const lowerName = item.name.toLowerCase();
  if (lowerName.includes("recién fabricado") || lowerName.includes("factory new") || lowerName.includes("fn")) {
    floatVal = 0.01 + (Math.abs(hashCode(item.assetId)) % 500) / 10000; // 0.01 - 0.06
  } else if (lowerName.includes("desgaste mínimo") || lowerName.includes("minimal wear") || lowerName.includes("mw")) {
    floatVal = 0.07 + (Math.abs(hashCode(item.assetId)) % 700) / 10000; // 0.07 - 0.14
  } else if (lowerName.includes("probado en el campo") || lowerName.includes("field-tested") || lowerName.includes("ft")) {
    floatVal = 0.15 + (Math.abs(hashCode(item.assetId)) % 2200) / 10000; // 0.15 - 0.37
  } else if (lowerName.includes("bien desgastado") || lowerName.includes("well-worn") || lowerName.includes("ww")) {
    floatVal = 0.38 + (Math.abs(hashCode(item.assetId)) % 600) / 10000; // 0.38 - 0.44
  } else if (lowerName.includes("de batalla") || lowerName.includes("battle-scarred") || lowerName.includes("bs")) {
    floatVal = 0.45 + (Math.abs(hashCode(item.assetId)) % 5400) / 10000; // 0.45 - 0.99
  } else {
    // Deterministic random float
    floatVal = Math.round(((Math.abs(hashCode(item.assetId)) % 1000) / 1000) * 1000) / 1000;
  }

  return {
    id: item.assetId,
    name: cleanSkinName,
    weapon,
    rarity,
    price: finalPrice,
    imageUrl: item.iconUrl || '/skin.webp',
    float: floatVal,
    pattern: Math.abs(hashCode(item.assetId)) % 1000,
    exterior: item.exterior || null,
    category: item.category || 'other',
    isStatTrak: item.isStatTrak || false,
    isSouvenir: item.isSouvenir || false
  };
}

export class ApiSkinRepository implements SkinRepository {
  async getSkins(): Promise<Skin[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/store/items`, {
        headers: {
          'X-Tunnel-Skip-AntiPhishing-Page': 'true',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch skins: ${response.statusText}`);
      }
      const data = (await response.json()) as StoreItem[];
      if (Array.isArray(data)) {
        return data.map(mapStoreItemToSkin);
      }
      return [];
    } catch (error) {
      console.error("Error in ApiSkinRepository.getSkins:", error);
      return [];
    }
  }

  async getSkinById(id: string): Promise<Skin | null> {
    try {
      const skins = await this.getSkins();
      return skins.find(s => s.id === id) || null;
    } catch (error) {
      console.error("Error in ApiSkinRepository.getSkinById:", error);
      return null;
    }
  }
}
