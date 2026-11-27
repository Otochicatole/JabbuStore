import { Skin } from "../../skins/domain/skin";

export const MAX_CART_ITEM_QUANTITY = 99;

export interface CartItem {
  skin: Skin;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export function supportsMultipleQuantity(skin: Skin): boolean {
  return (
    (skin.provider === "youpin" || skin.isImmediate === false) &&
    skin.isSpecific !== true &&
    !skin.id.startsWith("youpin-")
  );
}

export function normalizeCartQuantity(skin: Skin, quantity: number): number {
  if (!supportsMultipleQuantity(skin)) return 1;
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(MAX_CART_ITEM_QUANTITY, Math.trunc(quantity)));
}

export function toValidationId(skin: Skin): string {
  if (skin.provider !== "youpin") return skin.id;
  if (skin.id.startsWith("youpin-")) return skin.id;
  return `market-${skin.id}`;
}
