"use client";

import { useCart } from "@/features/cart/context/CartContext";
import { Button } from "./Button";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { name: 'Inicio', path: '/' },
  { name: 'Comprar', path: '/buy' },
  { name: 'Vender', path: '/sell' },
  { name: 'Inventario', path: '/inventory' }
];

export const Navbar = ({ onOpenCart }: { onOpenCart: () => void }) => {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-white no-underline cursor-pointer group">
          <div className="h-8 w-8 rounded-[4px] bg-accent flex items-center justify-center font-black text-white text-xs transition-transform group-hover:scale-110">
            JS
          </div>
          <span className="text-lg font-black tracking-tight uppercase">
            Jabbu<span className="text-accent">Store</span>
          </span>
        </Link>
        
        <div className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path}
                href={link.path} 
                className={`
                  relative px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 cursor-pointer
                  ${isActive ? 'text-white' : 'text-white/40 hover:text-white'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-accent rounded-full shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative mr-2 cursor-pointer text-white/70 hover:text-white group" onClick={onOpenCart}>
            <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-accent" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
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
