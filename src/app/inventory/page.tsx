"use client";

import { useState } from "react";
import { Navbar } from "@/shared/components/Navbar";
import { InventoryGrid } from "@/features/inventory/ui/InventoryGrid";
import { CartProvider } from "@/features/cart/context/CartContext";
import { CartSidebar } from "@/features/cart/ui/CartSidebar";

import { InventoryProvider } from "@/features/inventory/context/InventoryContext";

export default function InventoryPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <InventoryProvider>
        <div className="min-h-screen bg-background">
          <Navbar onOpenCart={() => setIsCartOpen(true)} />
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          
          <main className="mx-auto max-w-full px-6 pt-24 pb-20">
            <section>
              <header className="mb-12 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mi <span className="text-accent">Inventario</span></h1>
                  <p className="text-muted">Gestiona y visualiza tu colección de skins.</p>
                </div>
                <div className="bg-card border border-white/5 p-4 px-6 rounded-2xl flex items-center gap-6 shadow-lg shadow-black/20">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Valor Total</p>
                    <p className="text-xl font-black text-white tracking-tighter">$12,620.00 <span className="text-[10px] text-muted ml-0.5">USDT</span></p>
                  </div>
                  <div className="h-10 w-[1px] bg-white/5" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Items</p>
                    <p className="text-xl font-black text-accent tracking-tighter">8</p>
                  </div>
                </div>
              </header>

              <div className="mb-6">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Skins en tu posesión</span>
              </div>
              <InventoryGrid variant="simple" />
            </section>
          </main>
        </div>
      </InventoryProvider>
    </CartProvider>
  );
}
