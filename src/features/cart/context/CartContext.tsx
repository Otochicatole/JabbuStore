"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar carrito de localStorage en el montaje
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jabbu_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error al cargar el carrito de localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('jabbu_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error al guardar el carrito en localStorage:', e);
    }
  }, [items, isLoaded]);

  const addToCart = (skin: Skin) => {
    setItems(prev => {
      const existing = prev.find(item => item.skin.id === skin.id);
      if (existing) return prev; // Estrictamente capado a 1
      return [...prev, { skin, quantity: 1 }];
    });
  };

  const updateQuantity = (skinId: string, delta: number) => {
    if (delta < 0) {
      removeFromCart(skinId);
    }
  };

  const removeFromCart = (skinId: string) => {
    setItems(prev => prev.filter(item => item.skin.id !== skinId));
  };

  const clearCart = useCallback(() => setItems([]), []);

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
