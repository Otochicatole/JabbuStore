"use client";

import { useState } from "react";
import { Navbar } from "@/shared/components/Navbar";
import { CartProvider } from "@/features/cart/context/CartContext";
import { InventoryProvider } from "@/features/inventory/context/InventoryContext";
import { FilterProvider } from "@/features/filters/context/FilterContext";
import { CartSidebar } from "@/features/cart/ui/CartSidebar";
import { usePathname } from "next/navigation";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <CartProvider>
        <FilterProvider>
          <InventoryProvider>
            <div className="min-h-screen min-w-0 bg-background overflow-x-hidden">
              {children}
            </div>
          </InventoryProvider>
        </FilterProvider>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <FilterProvider>
        <InventoryProvider>
          <div className="min-h-screen min-w-0 overflow-x-hidden">
            <Navbar onOpenCart={() => setIsCartOpen(true)} />
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            {children}
          </div>
        </InventoryProvider>
      </FilterProvider>
    </CartProvider>
  );
};
