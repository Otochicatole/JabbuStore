import { Skin } from "../../skins/domain/skin";

export interface InventoryItem {
  id: string;
  skin: Skin;
  acquiredAt: Date;
  isTradeable: boolean;
}

export interface InventoryRepository {
  getInventory(): Promise<InventoryItem[]>;
}
