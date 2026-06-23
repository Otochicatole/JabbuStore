"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Skin } from '../../skins/domain/skin';
import { CartItem } from '../domain/cart';
import { BACKEND_URL } from '@/shared/lib/api';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

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
  const [removedItemsNames, setRemovedItemsNames] = useState<string[]>([]);
  const [isRemovedModalOpen, setIsRemovedModalOpen] = useState(false);

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
        const namesArray = removedItems.map(item => `${item.skin.weapon} | ${item.skin.name}`);
        
        setItems(prev => prev.filter(item => !data.invalidIds.includes(item.skin.id)));
        setRemovedItemsNames(namesArray);
        setIsRemovedModalOpen(true);
        return false;
      }
    } catch (err) {
      console.error("Error validating cart items:", err);
    }
    return true;
  }, []);

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

      <AnimatePresence>
        {isRemovedModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            {/* Backdrop click closes modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRemovedModalOpen(false)}
              className="absolute inset-0 cursor-default"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md overflow-hidden bg-[#110f1e]/90 border border-amber-500/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-xl z-10"
            >
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsRemovedModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer border-none"
                aria-label={t("common.close") || "Close"}
              >
                <X size={16} />
              </button>

              {/* Content */}
              <div className="flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
                  {t("cart.itemsRemovedTitle") || "Artículos no disponibles"}
                </h3>

                {/* Description */}
                <p className="text-xs text-[#84849b] leading-relaxed mb-4 max-w-xs font-medium">
                  {t("cart.itemsRemovedDescription") || "Los siguientes artículos ya no están disponibles en la tienda y fueron removidos de tu carrito:"}
                </p>

                {/* Items List */}
                <div className="w-full max-h-48 overflow-y-auto mb-6 bg-black/40 border border-white/5 rounded-2xl p-4 text-left custom-scrollbar">
                  <ul className="m-0 p-0 list-none flex flex-col gap-2">
                    {removedItemsNames.map((name, idx) => (
                      <li key={idx} className="text-xs font-bold text-white flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <button
                  onClick={() => setIsRemovedModalOpen(false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-500/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer border-none"
                >
                  {t("common.confirm") || "Aceptar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
