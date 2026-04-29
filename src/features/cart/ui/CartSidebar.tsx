"use client";

import { useCart } from "../context/CartContext";
import { Button } from "@/shared/components/Button";
import Image from "next/image";

export const CartSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { items, total, removeFromCart } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md border-l border-white/5 bg-[#0d0d0d] p-8 transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">Your <span className="text-[#ff9d00]">Cart</span></h2>
            <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-white/30">
                <p className="text-lg">Your cart is empty</p>
                <Button variant="ghost" onClick={onClose} className="mt-4">Continue Shopping</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.skin.id} className="glass flex items-center gap-4 p-3">
                    <div className="relative h-16 w-16 flex-shrink-0 bg-black/20 rounded-md">
                      <Image src={item.skin.imageUrl} alt={item.skin.name} fill className="object-contain" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white">{item.skin.name}</h4>
                      <p className="text-xs text-white/40">{item.skin.weapon} × {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#ff9d00]">${(item.skin.price * item.quantity).toLocaleString()}</p>
                      <button 
                        onClick={() => removeFromCart(item.skin.id)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-white/5 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-white/60">Total</span>
              <span className="text-3xl font-black text-white">${total.toLocaleString()}</span>
            </div>
            <Button className="w-full" size="lg" disabled={items.length === 0}>
              Checkout Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
