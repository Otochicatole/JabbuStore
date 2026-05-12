"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { Skin } from '../../skins/domain/skin';
import { CartItem } from '../domain/cart';

interface CartContextType {
  items: CartItem[];
  addToCart: (skin: Skin) => void;
  removeFromCart: (skinId: string) => void;
  updateQuantity: (skinId: string, delta: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (skin: Skin) => {
    setItems(prev => {
      const existing = prev.find(item => item.skin.id === skin.id);
      if (existing) return prev; // Strictly cap at 1 of this unique physical asset
      return [...prev, { skin, quantity: 1 }];
    });
  };

  const updateQuantity = (skinId: string, delta: number) => {
    // Each unique asset is limited to quantity 1, so updateQuantity is not needed to increase
    // But we keep it as a no-op or simple removal helper to avoid breaking any other callers
    if (delta < 0) {
      removeFromCart(skinId);
    }
  };

  const removeFromCart = (skinId: string) => {
    setItems(prev => prev.filter(item => item.skin.id !== skinId));
  };

  const clearCart = () => setItems([]);

  const total = useMemo(() => 
    items.reduce((sum, item) => sum + (item.skin.price * item.quantity), 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
