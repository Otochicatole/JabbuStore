"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Skin } from '../../skins/domain/skin';
import { CartItem } from '../domain/cart';
import { BACKEND_URL } from '@/shared/lib/api';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface CartContextType {
  items: CartItem[];
  addToCart: (skin: Skin) => void;
  removeFromCart: (skinId: string) => void;
  updateQuantity: (skinId: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  validateCartItems: (currentItems: CartItem[]) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useI18n();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const validateCartItems = useCallback(async (currentItems: CartItem[]): Promise<boolean> => {
    if (currentItems.length === 0) return true;
    try {
      const response = await fetch(`${BACKEND_URL}/orders/validate-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: currentItems.map(i => i.skin.id) }),
      });
      if (!response.ok) return true;
      const data = await response.json();
      if (data.invalidIds && data.invalidIds.length > 0) {
        const removedItems = currentItems.filter(item => data.invalidIds.includes(item.skin.id));
        const removedNames = removedItems.map(item => `${item.skin.weapon} | ${item.skin.name}`).join("\n");
        
        setItems(prev => prev.filter(item => !data.invalidIds.includes(item.skin.id)));
        
        const alertTemplate = t("cart.itemsRemoved");
        const alertMessage = alertTemplate && alertTemplate.includes("{names}")
          ? alertTemplate.replace("{names}", removedNames)
          : alertTemplate || `Algunos artículos de tu carrito ya no están disponibles en la tienda y fueron removidos:\n\n${removedNames}`;
        
        alert(alertMessage);
        return false;
      }
    } catch (err) {
      console.error("Error validating cart items:", err);
    }
    return true;
  }, [t]);

  // Cargar carrito de localStorage en el montaje
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jabbu_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        void validateCartItems(parsed);
      }
    } catch (e) {
      console.error('Error al cargar el carrito de localStorage:', e);
    }
    setIsLoaded(true);
  }, [validateCartItems]);

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
    let wasAdded = false;
    let newItems: CartItem[] = [];

    setItems(prev => {
      const existing = prev.find(item => item.skin.id === skin.id);
      if (existing) return prev; // Estrictamente capado a 1
      wasAdded = true;
      newItems = [...prev, { skin, quantity: 1 }];
      return newItems;
    });

    if (wasAdded) {
      void validateCartItems(newItems);
    }
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
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, validateCartItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
