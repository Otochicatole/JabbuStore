import { Skin } from "../../skins/domain/skin";

export interface CartItem {
  skin: Skin;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}
