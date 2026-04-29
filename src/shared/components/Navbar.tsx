"use client";

import { useCart } from "@/features/cart/context/CartContext";
import { Button } from "./Button";

export const Navbar = ({ onOpenCart }: { onOpenCart: () => void }) => {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-[#13121d]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2 text-white no-underline">
          <div className="h-8 w-8 rounded-[4px] bg-[#ff4b4b] flex items-center justify-center font-black text-white text-xs">
            SS
          </div>
          <span className="text-lg font-black tracking-tight">
            TIENDA<span className="text-[#ff4b4b]">CS2</span>
          </span>
        </div>
        
        <div className="hidden items-center gap-8 md:flex">
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Catalog</a>
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Inventory</a>
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Support</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative mr-2 cursor-pointer text-white/70 hover:text-white" onClick={onOpenCart}>
            <span className="text-lg">🛒</span>
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff9d00] text-[10px] font-bold text-black">
                {itemCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm">Login</Button>
          <Button variant="primary" size="sm">Sign Up</Button>
        </div>
      </div>
    </nav>
  );
};
