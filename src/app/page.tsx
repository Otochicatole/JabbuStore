"use client";

import { useState } from "react";
import Image from "next/image";
import { Navbar } from "@/shared/components/Navbar";
import { SkinGrid } from "@/features/skins/ui/SkinGrid";
import { CartProvider } from "@/features/cart/context/CartContext";
import { CartSidebar } from "@/features/cart/ui/CartSidebar";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar onOpenCart={() => setIsCartOpen(true)} />
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        
        <main className="mx-auto max-w-7xl px-6 pt-24 pb-20">
          <section className="mb-20 flex flex-col items-center text-center">
            <div className="relative mb-8 h-40 w-full max-w-lg">
              <Image 
                src="/skin.webp" 
                alt="Featured Skin" 
                fill 
                className="object-contain drop-shadow-[0_0_50px_rgba(255,75,75,0.3)]"
                priority
              />
            </div>
            <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-6xl uppercase">
              Trade your <span className="text-[#ff4b4b]">CS2 Skins</span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-[#84849b]">
              The most trusted and secure marketplace to buy, sell and swap Counter-Strike items instantly.
            </p>
          </section>

          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Featured Collection</h2>
              <div className="flex gap-2">
                <span className="glass px-3 py-1 text-xs font-medium text-white/60">All Weapons</span>
                <span className="glass px-3 py-1 text-xs font-medium text-white/60">Knives</span>
                <span className="glass px-3 py-1 text-xs font-medium text-white/60">Gloves</span>
              </div>
            </div>
            
            <SkinGrid />
          </section>
        </main>

        <footer className="border-t border-white/5 py-10">
          <div className="mx-auto max-w-7xl px-6 text-center text-sm text-white/40">
            © 2026 CS SkinMarket. Not affiliated with Valve Corporation.
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
