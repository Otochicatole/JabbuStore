import { Skin, SkinRepository, SkinCatalogResult } from "../domain/skin";

const MOCK_SKINS: Skin[] = [
  {
    id: '1',
    name: 'Dragon Lore',
    weapon: 'AWP',
    rarity: 'ancient',
    price: 15000,
    imageUrl: '/skin.webp',
  },
  {
    id: '2',
    name: 'Asiimov',
    weapon: 'M4A4',
    rarity: 'legendary',
    price: 120,
    imageUrl: '/skin.webp',
  },
  {
    id: '3',
    name: 'Fade',
    weapon: 'Karambit',
    rarity: 'ancient',
    price: 2500,
    imageUrl: '/skin.webp',
  },
  {
    id: '4',
    name: 'Primal Saber',
    weapon: 'UMP-45',
    rarity: 'legendary',
    price: 15,
    imageUrl: '/skin.webp',
  },
  {
    id: '5',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '6',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '7',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '8',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '9',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '10',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '11',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '12',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
  {
    id: '13',
    name: 'Case Hardened',
    weapon: 'AK-47',
    rarity: 'legendary',
    price: 450,
    imageUrl: '/skin.webp',
  },
];

export class MockSkinRepository implements SkinRepository {
  async getSkins(): Promise<SkinCatalogResult> {
    return {
      items: MOCK_SKINS,
      pagination: {
        page: 1,
        limit: MOCK_SKINS.length,
        total: MOCK_SKINS.length,
        totalPages: 1,
      },
    };
  }

  async getSkinById(id: string): Promise<Skin | null> {
    return MOCK_SKINS.find(skin => skin.id === id) || null;
  }
}
