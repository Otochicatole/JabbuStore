"use client";

import { useState } from "react";
import { Navbar } from "@/shared/components/Navbar";
import { InventoryGrid } from "@/features/inventory/ui/InventoryGrid";
import { CartProvider } from "@/features/cart/context/CartContext";
import { CartSidebar } from "@/features/cart/ui/CartSidebar";

export default function InventoryPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#13121d]">
        <Navbar onOpenCart={() => setIsCartOpen(true)} />
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        
        <main className="mx-auto max-w-7xl px-6 pt-24 pb-20">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">My Inventory</h1>
              <p className="text-[#84849b]">Manage and trade your CS2 collection.</p>
            </div>
            <div className="bg-[#1b1a26] border border-white/5 p-4 rounded-[4px] flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/30 uppercase">Inventory Value</p>
                <p className="text-xl font-black text-white">$17,620.00</p>
              </div>
              <div className="h-10 w-[1px] bg-white/5" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/30 uppercase">Items</p>
                <p className="text-xl font-black text-white">3</p>
              </div>
            </div>
          </header>

          <section>
            <InventoryGrid />
          </section>
        </main>
      </div>
    </CartProvider>
  );
}
