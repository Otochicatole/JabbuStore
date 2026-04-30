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
      if (existing) {
        return prev.map(item => 
          item.skin.id === skin.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { skin, quantity: 1 }];
    });
  };

  const updateQuantity = (skinId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.skin.id === skinId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
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
