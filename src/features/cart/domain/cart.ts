import { Skin } from "../../skins/domain/skin";

export interface CartItem {
  skin: Skin;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export function toValidationId(skin: Skin): string {
  if (skin.provider !== "youpin") return skin.id;
  if (skin.id.startsWith("youpin-")) return skin.id;
  return `market-${skin.id}`;
}
