"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Skin, SkinRarity } from '../../skins/domain/skin';
import { fetchWithAuth, BACKEND_URL } from '@/shared/lib/api';

export interface SteamInventoryItem {
  assetId: string;
  classId: string;
  name: string;
  type: string;
  iconUrl: string;
  tradable: boolean;
  marketable: boolean;
}

interface InventoryContextType {
  inventoryItems: Skin[];
  loading: boolean;
  error: string | null;
  selectedItems: Skin[];
  addToSellList: (skin: Skin) => void;
  removeFromSellList: (id: string) => void;
  clearSellList: () => void;
  totalValue: number;
  refetchInventory: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

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

// Map the backend SteamInventoryItem structure to the UI-compatible Skin interface deterministically
function mapSteamItemToSkin(item: SteamInventoryItem): Skin {
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

  // Determine Rarity based on description 'type' or fallback to deterministic hash index
  let rarity: SkinRarity = 'common';
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

  // Generate deterministic price based on rarity tier and a percentage variance based on assetId
  let basePrice = 5;
  if (rarity === 'ancient') basePrice = 1200;
  else if (rarity === 'legendary') basePrice = 280;
  else if (rarity === 'mythical') basePrice = 85;
  else if (rarity === 'rare') basePrice = 30;
  else if (rarity === 'uncommon') basePrice = 12;

  const variance = (Math.abs(hashCode(item.assetId)) % 100) / 100; // 0.0 to 1.0
  const finalPrice = Math.round(basePrice * (0.8 + variance * 0.4) * 100) / 100; // variance of +/-20%

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
    pattern: Math.abs(hashCode(item.assetId)) % 1000
  };
}

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [inventoryItems, setInventoryItems] = useState<Skin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Skin[]>([]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setError("Inicia sesión para ver tu inventario");
      setInventoryItems([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/users/me/inventory`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
          setInventoryItems([]);
          return;
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Error del servidor (${response.status})`);
      }

      const data = (await response.json()) as SteamInventoryItem[];
      
      if (Array.isArray(data)) {
        const skins = data.map(mapSteamItemToSkin);
        setInventoryItems(skins);
      } else {
        throw new Error("El formato del inventario devuelto no es válido");
      }
    } catch (err: any) {
      console.error("Error fetching inventory:", err);
      setError(err.message || "Error al conectar con el servidor de inventario");
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addToSellList = (skin: Skin) => {
    if (!selectedItems.find(item => item.id === skin.id)) {
      setSelectedItems(prev => [...prev, skin]);
    }
  };

  const removeFromSellList = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const clearSellList = () => setSelectedItems([]);

  const totalValue = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <InventoryContext.Provider value={{ 
      inventoryItems,
      loading,
      error,
      selectedItems, 
      addToSellList, 
      removeFromSellList, 
      clearSellList, 
      totalValue,
      refetchInventory: fetchInventory
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
