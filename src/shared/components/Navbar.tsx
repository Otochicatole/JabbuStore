"use client";

import { useCart } from "@/features/cart/context/CartContext";
import { Button } from "./Button";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";

export const Navbar = ({ onOpenCart }: { onOpenCart: () => void }) => {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-[#13121d]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2 text-white no-underline">
          <div className="h-8 w-8 rounded-[4px] bg-[#ff4b4b] flex items-center justify-center font-black text-white text-xs">
            JS
          </div>
          <span className="text-lg font-black tracking-tight uppercase">
            Jabbu<span className="text-[#ff4b4b]">Store</span>
          </span>
        </div>
        
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-bold text-white/70 hover:text-white transition-colors uppercase tracking-widest text-[10px]">Home</Link>
          <Link href="/buy" className="text-sm font-bold text-white/70 hover:text-white transition-colors uppercase tracking-widest text-[10px]">Buy</Link>
          <Link href="/inventory" className="text-sm font-bold text-white/70 hover:text-white transition-colors uppercase tracking-widest text-[10px]">Inventory</Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative mr-2 cursor-pointer text-white/70 hover:text-white group" onClick={onOpenCart}>
            <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-[#ff4b4b]" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff4b4b] text-[8px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Login
          </Button>
          <Button variant="primary" size="sm">Sign Up</Button>
        </div>
      </div>
    </nav>
  );
};
