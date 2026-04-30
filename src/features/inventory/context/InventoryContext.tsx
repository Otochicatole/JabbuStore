"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Skin } from '../../skins/domain/skin';

interface InventoryContextType {
  selectedItems: Skin[];
  addToSellList: (skin: Skin) => void;
  removeFromSellList: (id: string) => void;
  clearSellList: () => void;
  totalValue: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [selectedItems, setSelectedItems] = useState<Skin[]>([]);

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
      selectedItems, 
      addToSellList, 
      removeFromSellList, 
      clearSellList, 
      totalValue 
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
