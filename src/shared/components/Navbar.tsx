"use client";

import { useCart } from "@/features/cart/context/CartContext";
import { SteamLoginButton } from "./SteamLoginButton";
import Link from "next/link";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { fetchWithAuth, BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";

const NAV_LINKS = [
  { labelKey: "nav.home", path: "/" },
  { labelKey: "nav.buy", path: "/buy" },
  { labelKey: "nav.sell", path: "/sell" },
];

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  steamId: string | null;
  avatar: string | null;
  profileUrl: string | null;
}

export const Navbar = ({ onOpenCart }: { onOpenCart: () => void }) => {
  const pathname = usePathname();
  const { t } = useI18n();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Verificar sesión directamente contra el backend usando la cookie HTTP-Only a través del proxy
    fetchWithAuth(`${BACKEND_URL}/users/me`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
        setIsLoggedIn(false);
      });
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/user-logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setIsLoggedIn(false);
    setProfile(null);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-white no-underline cursor-pointer group"
        >
          <div className="h-8 w-8 rounded-sm bg-accent flex items-center justify-center font-black text-white text-xs transition-transform group-hover:scale-110">
            JS
          </div>
          <span className="hidden sm:inline text-lg font-black tracking-tight uppercase">
            Jabbu<span className="text-accent">Store</span>
          </span>
        </Link>

        <div className="hidden relative items-center md:flex gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`
                  relative rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 cursor-pointer
                  ${isActive ? "bg-accent text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]" : "text-white/40 hover:text-white"}
                `}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {!isLoggedIn && (
            <div className="hidden sm:block">
              <LanguageSwitcher compact />
            </div>
          )}

          <button
            type="button"
            aria-label={t("nav.cart")}
            className="relative mr-1 sm:mr-2 cursor-pointer text-white/70 hover:text-white group"
            onClick={onOpenCart}
          >
            <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-accent" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          {/* Auth Button */}
          {isLoggedIn ? (
            <div className="relative min-w-0" ref={dropdownRef}>
              {/* Avatar Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex min-w-0 items-center gap-2 sm:gap-2.5 rounded-full border border-white/5 hover:border-accent/40 bg-white/[0.01] hover:bg-white/[0.03] p-1.5 sm:pr-4 transition-all duration-300 shadow-lg cursor-pointer focus:outline-none"
              >
                <div className="relative h-7 w-7 overflow-hidden rounded-full border border-accent/20">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name || "Steam User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-accent/15 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-accent" />
                    </div>
                  )}
                </div>
                <span className="hidden max-w-[120px] truncate sm:inline text-[9px] font-black uppercase tracking-[0.15em] text-white/90 leading-none">
                  {profile?.name || t("nav.loading")}
                </span>
                <svg
                  className={`w-3 h-3 text-white/40 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Floating Dropdown Card */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] max-w-64 rounded-2xl border border-white/5 bg-card p-4 shadow-2xl shadow-black/80 z-50 flex flex-col gap-3 font-sans animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-accent/30 flex-shrink-0">
                      {profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="User Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-accent/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-accent" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-xs font-black text-white uppercase tracking-wider truncate">
                        {profile?.name || t("nav.steamUser")}
                      </p>
                      <p className="text-[9px] text-muted truncate font-mono">
                        ID: {profile?.steamId || t("nav.notLinked")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/40">
                      {t("language.label")}
                    </span>
                    <LanguageSwitcher compact />
                  </div>

                  {/* Links and Options */}
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href="/inventory"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] text-xs font-semibold text-white/60 hover:text-white transition-all duration-300"
                    >
                      <svg
                        className="w-4 h-4 text-accent/80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      {t("nav.inventory")}
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] text-xs font-semibold text-white/60 hover:text-white transition-all duration-300"
                    >
                      <svg
                        className="w-4 h-4 text-accent/80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {t("nav.profile")}
                    </Link>

                    <Link
                      href="/purchases"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] text-xs font-semibold text-white/60 hover:text-white transition-all duration-300"
                    >
                      <svg
                        className="w-4 h-4 text-accent/80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      {t("nav.purchases")}
                    </Link>

                    <Link
                      href="/sell"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] text-xs font-semibold text-white/60 hover:text-white transition-all duration-300"
                    >
                      <svg
                        className="w-4 h-4 text-accent/80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {t("nav.sell")}
                    </Link>

                    {profile?.profileUrl && (
                      <a
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] text-xs font-semibold text-white/60 hover:text-white transition-all duration-300"
                      >
                        <svg
                          className="w-4 h-4 text-accent/80"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Steam
                      </a>
                    )}
                  </div>

                  {/* Logout Action */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 mt-1.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-xs font-black text-red-400 transition-all duration-300 w-full text-left uppercase tracking-wider cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <SteamLoginButton />
          )}

          {/* Mobile Hamburguer Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex shrink-0 items-center justify-center p-2 rounded-[3px] border border-white/5 bg-white/[0.01] hover:bg-white/5 text-white/70 hover:text-white transition-all md:hidden cursor-pointer focus:outline-none"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Sliding Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-white/5 bg-background/95 backdrop-blur-lg md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-2">
              {!isLoggedIn && (
                <div className="flex justify-center pb-2">
                  <LanguageSwitcher compact />
                </div>
              )}
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      w-full py-3.5 px-4 text-center rounded-[3px] text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border
                      ${
                        isActive
                          ? "bg-accent/15 border-accent/20 text-white shadow-[0_0_15px_rgba(217,70,239,0.15)]"
                          : "border-transparent text-white/55 hover:bg-white/[0.02] hover:text-white"
                      }
                    `}
                  >
                    {t(link.labelKey)}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
