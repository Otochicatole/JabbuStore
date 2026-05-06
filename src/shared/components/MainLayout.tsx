"use client";

import { useState } from "react";
import { Navbar } from "@/shared/components/Navbar";
import { CartProvider } from "@/features/cart/context/CartContext";
import { InventoryProvider } from "@/features/inventory/context/InventoryContext";
import { CartSidebar } from "@/features/cart/ui/CartSidebar";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <InventoryProvider>
        <div className="min-h-screen">
          <Navbar onOpenCart={() => setIsCartOpen(true)} />
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          {children}
        </div>
      </InventoryProvider>
    </CartProvider>
  );
};
