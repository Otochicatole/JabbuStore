"use client";

import { useCart } from "../context/CartContext";
import { Button } from "@/shared/components/Button";
import Image from "next/image";
import { X, ShoppingBag, Trash2, Minus, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { fetchWithAuth, BACKEND_URL } from "@/shared/lib/api";

export const CartSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { items, total, removeFromCart, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      setError(null);
      
      const itemIds = items.map(item => item.skin.id);
      
      const response = await fetchWithAuth(`${BACKEND_URL}/orders`, {
        method: 'POST',
        body: JSON.stringify({ itemIds })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Error al procesar la compra');
      }

      const order = await response.json();
      
      // Limpiar carrito y cerrar sidebar
      clearCart();
      onClose();
      
      alert(`¡Orden creada exitosamente! ID: ${order.id}. En producción, aquí serás redirigido al pago.`);
      
    } catch (err: any) {
      console.error("Error creating order:", err);
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md border-l border-white/5 bg-card p-8 transition-transform duration-500 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Tu <span className="text-accent">Carrito</span></h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white cursor-pointer transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-white/10" />
                </div>
                <p className="text-muted font-bold">Tu carrito está vacío</p>
                <button onClick={onClose} className="mt-4 text-xs font-black uppercase tracking-widest text-accent hover:underline underline-offset-4">Explorar Skins</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.skin.id} className="group relative flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-white/5 hover:border-white/10 transition-all">
                    <div className="relative h-20 w-20 flex-shrink-0 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center p-2">
                      <Image src={item.skin.imageUrl} alt={item.skin.name} fill className="object-contain p-2" />
                    </div>
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-black uppercase text-white leading-tight">
                          {item.skin.weapon} | <span className="text-[#aaaaff]">{item.skin.name}</span>
                        </h4>
                        <p className="text-[9px] font-bold text-[#84849b] uppercase">
                          {item.skin.exterior || 'Recién fabricado'}
                          {item.skin.float !== undefined && ` • Float: ${item.skin.float.toFixed(5)}`}
                        </p>
                        
                        {/* Quantity (fixed to 1 since it is a unique item) */}
                        <p className="mt-2 text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block">
                          Único en Stock
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white tracking-tighter">${(item.skin.price * item.quantity).toLocaleString()}</p>
                        <button 
                          onClick={() => removeFromCart(item.skin.id)}
                          className="mt-1 text-[10px] font-bold text-red-400/50 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Total Estimado</span>
                <span className="text-3xl font-black text-white tracking-tighter">${total.toLocaleString()} <span className="text-sm text-muted">USDT</span></span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button 
              onClick={handleCheckout}
              className="w-full h-14 bg-accent text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all disabled:opacity-50 disabled:grayscale active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              disabled={items.length === 0 || isCheckingOut}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Finalizar Compra'
              )}
            </button>
            <p className="text-[9px] text-center text-muted mt-4 font-bold uppercase tracking-widest">Pago seguro garantizado</p>
          </div>
        </div>
      </div>
    </>
  );
};
