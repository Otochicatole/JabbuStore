"use client";

import { useCart } from "@/features/cart/context/CartContext";
import { Button } from "./Button";
import { SteamLoginButton } from "./SteamLoginButton";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";

const NAV_LINKS = [
  { name: 'Inicio', path: '/' },
  { name: 'Comprar', path: '/buy' },
  { name: 'Vender', path: '/sell' },
  { name: 'Inventario', path: '/inventory' }
];

import { useState, useRef, useEffect } from "react";

// ... inside Navbar component
export const Navbar = ({ onOpenCart }: { onOpenCart: () => void }) => {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = NAV_LINKS.findIndex(link => link.path === pathname);
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const el = navRefs.current[activeIndex];
      setPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        opacity: 1
      });
    }
  }, [pathname]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('auth_token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    window.location.reload();
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-white no-underline cursor-pointer group">
          <div className="h-8 w-8 rounded-[4px] bg-accent flex items-center justify-center font-black text-white text-xs transition-transform group-hover:scale-110">
            JS
          </div>
          <span className="text-lg font-black tracking-tight uppercase">
            Jabbu<span className="text-accent">Store</span>
          </span>
        </Link>
        
        <div className="hidden relative items-center md:flex">
          {/* Persistent Sliding Pill using CSS Transitions for maximum stability */}
          <div
            style={{
              left: `${pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
            }}
            className="absolute h-8 bg-accent rounded-full shadow-[0_0_20px_rgba(217,70,239,0.3)] z-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
          />

          {NAV_LINKS.map((link, index) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path}
                ref={el => { navRefs.current[index] = el; }}
                href={link.path} 
                className={`
                  relative px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 cursor-pointer z-10
                  ${isActive ? 'text-white' : 'text-white/40 hover:text-white'}
                `}
              >
                {link.name}
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

          {/* Auth Button */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
                <User className="h-4 w-4 text-accent" />
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          ) : (
            <SteamLoginButton />
          )}
        </div>
      </div>
    </nav>
  );
};
