"use client";

import { useCart } from "../../context/CartContext";
import { Button } from "@/shared/components/Button";
import Image from "next/image";
import { X, ShoppingBag, Trash2, Minus, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchWithAuth, BACKEND_URL } from "@/shared/lib/api";
import { useRouter } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

export const CartSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { items, total, removeFromCart, clearCart, validateCartItems } = useCart();
  const router = useRouter();
  const { t } = useI18n();
  const localizePath = useLocalizedPath();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status when sidebar mounts or opens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchWithAuth(`${BACKEND_URL}/users/me`)
        .then(res => {
          setIsLoggedIn(res.ok);
        })
        .catch(() => setIsLoggedIn(false));
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      setError(null);

      // Validate items in cart exist in DB
      const isValid = await validateCartItems(items);
      if (!isValid) {
        return; // Validation failed, items removed, checkout aborted
      }

      // Prevent checkout if not logged in
      const meRes = await fetchWithAuth(`${BACKEND_URL}/users/me`);
      if (!meRes.ok) {
        setIsLoggedIn(false);
        setError(t("cart.loginRequired"));
        return;
      }
      
      // Cerrar sidebar y navegar a la página de checkout
      onClose();
      router.push(localizePath("/checkout?type=buy"));
      
    } catch (err: unknown) {
      console.error("Error initiating checkout:", err);
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md border-l border-white/5 bg-card p-4 sm:p-8 transition-transform duration-500 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="mb-6 sm:mb-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-accent" />
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">{t("cart.title")}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white cursor-pointer transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-white/10" />
                </div>
                <p className="text-muted font-bold">{t("cart.empty")}</p>
                <button onClick={onClose} className="mt-4 text-xs font-black uppercase tracking-widest text-accent hover:underline underline-offset-4">{t("cart.continueShopping")}</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.skin.id} className="group relative flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-background/50 border border-white/5 hover:border-white/10 transition-all">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center p-2">
                      <Image src={item.skin.imageUrl} alt={item.skin.name} fill className="object-contain p-2" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-black uppercase text-white leading-tight line-clamp-2 sm:line-clamp-none">
                          {item.skin.weapon} | <span className="text-[#aaaaff]">{item.skin.name}</span>
                        </h4>
                        <p className="text-[9px] font-bold text-[#84849b] uppercase break-words">
                          {item.skin.exterior || "Factory New"}
                          {item.skin.isSpecific !== false && item.skin.float !== undefined && ` • Float: ${item.skin.float.toFixed(5)}`}
                        </p>
                        
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-sm font-black text-white tracking-tighter">${(item.skin.price * item.quantity).toLocaleString()}</p>
                        <button 
                          onClick={() => removeFromCart(item.skin.id)}
                          className="mt-1 text-[10px] font-bold text-red-400/50 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">{t("cart.estimatedTotal")}</span>
                <span className="text-3xl font-black text-white tracking-tighter">${total.toLocaleString()} <span className="text-sm text-muted">USDT</span></span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            {isLoggedIn ? (
              <button 
                onClick={handleCheckout}
                className="w-full h-14 bg-accent text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all disabled:opacity-50 disabled:grayscale active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                disabled={items.length === 0 || isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("checkout.processing")}
                  </>
                ) : (
                  t("cart.checkout")
                )}
              </button>
            ) : (
              <button 
                onClick={() => {
                  window.location.href = `${BACKEND_URL}/auth/steam`;
                }}
                className="w-full h-14 bg-card text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-xl border border-accent/40 hover:border-accent shadow-lg hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3 relative overflow-hidden group"
                disabled={items.length === 0}
              >
                {/* Subtle shine effect */}
                <div className="absolute -left-full top-0 h-full w-1/2 skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-500 group-hover:left-[150%]" />
                
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-white/80 group-hover:text-white transition-colors duration-300" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .002C5.372.002 0 5.374 0 12c0 1.034.133 2.036.381 2.991l5.483 2.27c.224-.134.484-.216.761-.216.14 0 .272.023.398.061l2.508-3.66a3.11 3.11 0 0 1-.035-3.136c.038-.07.078-.139.123-.205.81-1.18 2.39-1.488 3.528-.688 1.139.8 1.436 2.36.626 3.539-.374.545-.929.89-1.54.996l-1.077 4.195c.002.016.006.03.006.046 0 1.258-1.018 2.278-2.275 2.278-.293 0-.57-.058-.823-.16L2.35 20.916C4.832 22.84 7.95 24 11.34 24 18.332 24 24 18.332 24 11.34S18.332-.002 11.34-.002h.66zm-.92 14.507c.803 0 1.453.651 1.453 1.454a1.454 1.454 0 1 1-1.453-1.454zm1.378-4.577a1.64 1.64 0 1 0-3.279.002 1.64 1.64 0 0 0 3.279-.002z" />
                </svg>
                <span>{t("cart.loginToBuy")}</span>
              </button>
            )}
            <p className="text-[9px] text-center text-muted mt-4 font-bold uppercase tracking-widest">{t("cart.securePayment")}</p>
          </div>
        </div>
      </div>
    </>
  );
};
