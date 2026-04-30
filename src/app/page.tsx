"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/shared/components/Navbar";
import { Button } from "@/shared/components/Button";
import { CartProvider } from "@/features/cart/context/CartContext";
import { CartSidebar } from "@/features/cart/ui/CartSidebar";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen">
        <Navbar onOpenCart={() => setIsCartOpen(true)} />
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        
        <main className="mx-auto max-w-full px-6 pt-24 pb-20">
          <section className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="relative mb-10 h-64 w-full max-w-2xl">
              <Image 
                src="/skin.webp" 
                alt="Featured Skin" 
                fill 
                className="object-contain drop-shadow-[0_0_80px_rgba(255,75,75,0.2)]"
                priority
              />
            </div>
            <h1 className="mb-6 text-5xl font-black tracking-tight text-white md:text-8xl uppercase leading-none">
              The Future of <br/> <span className="text-accent">Skin Trading</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted">
              Experience the fastest, most secure way to trade your Counter-Strike 2 items. 
              Join thousands of players who trust JabbuStore for their instant swaps.
            </p>
            <div className="flex gap-4">
              <Link href="/buy">
                <Button size="lg" className="px-10 h-14">Start Trading</Button>
              </Link>
              <Link href="/inventory">
                <Button variant="secondary" size="lg" className="px-10 h-14">View Inventory</Button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/5 py-10">
          <div className="mx-auto max-w-full px-6 text-center text-sm text-white/40">
            © 2026 JabbuStore. Not affiliated with Valve Corporation.
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
