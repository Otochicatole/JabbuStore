import { InventoryItem, InventoryRepository } from "../domain/inventory-item";

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_1',
    skin: {
      id: 'skin_101',
      name: 'Dragon Lore',
      weapon: 'AWP',
      rarity: 'ancient',
      price: 15000,
      imageUrl: '/skin.webp',
    },
    acquiredAt: new Date(),
    isTradeable: true,
  },
  {
    id: 'inv_2',
    skin: {
      id: 'skin_102',
      name: 'Asiimov',
      weapon: 'M4A4',
      rarity: 'legendary',
      price: 120,
      imageUrl: '/skin.webp',
    },
    acquiredAt: new Date(),
    isTradeable: true,
  },
  {
    id: 'inv_3',
    skin: {
      id: 'skin_103',
      name: 'Fade',
      weapon: 'Karambit',
      rarity: 'ancient',
      price: 2500,
      imageUrl: '/skin.webp',
    },
    acquiredAt: new Date(),
    isTradeable: false,
  }
];

export class MockInventoryRepository implements InventoryRepository {
  async getInventory(): Promise<InventoryItem[]> {
    return MOCK_INVENTORY;
  }
}
