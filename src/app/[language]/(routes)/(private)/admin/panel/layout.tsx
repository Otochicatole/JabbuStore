"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bot,
  Settings,
  LogOut,
  Menu,
  X,
  Database,
  ShoppingBag,
  Tag,
  Globe,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { TicketNotificationProvider } from "@/features/tickets/ui/TicketNotificationProvider";
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import { NotificationBell } from "@/features/notifications/ui/NotificationBell";
import { stripLocaleFromPathname } from "@/shared/i18n/routing";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

import type { AdminUser, NavItem } from "@/features/admin/types";

function SidebarNav({
  pathname,
  navItems,
  setIsSidebarOpen,
}: {
  pathname: string;
  navItems: NavItem[];
  setIsSidebarOpen: (o: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "inventory";
  const localizePath = useLocalizedPath();
  const normalizedPathname = stripLocaleFromPathname(pathname);

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const itemPath = item.href.split("?")[0];
        const itemTab = new URLSearchParams(item.href.split("?")[1]).get(
          "tab",
        );

        const isActive =
          normalizedPathname === itemPath && (!itemTab || currentTab === itemTab);

        return (
          <Link
            key={item.href}
            href={localizePath(item.href)}
            onClick={() => setIsSidebarOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-[3px] text-xs font-bold transition-all
              ${
                isActive
                  ? "bg-accent text-white shadow-[0_0_20px_rgba(217,70,239,0.15)] font-black"
                  : "text-[#84849b] hover:text-white hover:bg-white/[0.02]"
              }
            `}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const pathname = usePathname();
  const { t } = useI18n();
  const localizePath = useLocalizedPath();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/admins/me`, {
          headers: {
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAdminUser(data.admin);
        }
      } catch (error) {
        console.error("Error fetching admin user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    window.location.href = localizePath("/admin/login");
  };

  const navItems = [
    {
      name: t("admin.inventoryBots"),
      href: "/admin/panel/dashboard?tab=inventory",
      icon: Database,
    },
    {
      name: t("admin.marketCatalog"),
      href: "/admin/panel/dashboard?tab=market",
      icon: Globe,
    },
    {
      name: t("admin.purchaseRequests"),
      href: "/admin/panel/dashboard?tab=purchases",
      icon: ShoppingBag,
    },
    {
      name: t("admin.sellRequests"),
      href: "/admin/panel/dashboard?tab=listings",
      icon: Tag,
    },
    {
      name: t("tickets.adminNav"),
      href: "/admin/panel/dashboard?tab=tickets",
      icon: MessageSquare,
    },
    { name: t("admin.botManagement"), href: "/admin/panel/bots", icon: Bot },
    {
      name: t("admin.globalSettings"),
      href: "/admin/panel/settings",
      icon: Settings,
    },
  ];

  return (
    <NotificationProvider actor="ADMIN" enabled={!!adminUser}>
      <TicketNotificationProvider actor="ADMIN" enabled={!!adminUser}>
        <div className="min-h-screen min-w-0 bg-[#0b0818] text-white flex flex-col md:flex-row overflow-x-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0f0d1e] border-b border-white/5 shrink-0 z-50 fixed top-0 left-0 w-full h-14 shadow-lg shadow-[#000]/40">
          <div className="flex flex-col">
            <h1 className="text-xs font-black uppercase tracking-wider text-white">
              {t("admin.brand")}
            </h1>
            {adminUser && (
              <span className="text-[9px] text-[#84849b] font-mono">
                @{adminUser.username}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 px-2">
            {adminUser && <NotificationBell />}
            <LanguageSwitcher compact />
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 -mr-2 cursor-pointer hover:bg-white/5 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-[60] w-64 bg-[#0f0d1e] border-r border-white/5 p-5 flex flex-col justify-between
          transform transition-transform duration-300 ease-in-out shadow-2xl shadow-black/80
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        >
          <div>
            <div className="mb-8 hidden md:block">
              <h1 className="text-lg font-black uppercase tracking-wider text-white">
                Jabbu Store
              </h1>
              <p className="text-[10px] font-bold text-[#84849b] uppercase tracking-widest mt-0.5">
                {t("admin.controlPanel")}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <LanguageSwitcher compact />
                {adminUser && <NotificationBell align="left" />}
              </div>
            </div>

            <Suspense fallback={
              <div className="space-y-2.5 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-10 bg-white/[0.02] rounded-[3px] w-full border border-white/5" />
                ))}
              </div>
            }>
              <SidebarNav pathname={pathname} navItems={navItems} setIsSidebarOpen={setIsSidebarOpen} />
            </Suspense>
          </div>

          {/* User Info & Logout */}
          <div className="border-t border-white/5 pt-4 mt-4">
            {adminUser && (
              <div className="bg-white/[0.02] border border-white/5 rounded-[3px] p-3 mb-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[3px] bg-accent/10 border border-accent/20 flex items-center justify-center font-sans font-black text-xs text-accent shrink-0">
                    {adminUser.username?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-white block truncate">
                      @{adminUser.username}
                    </span>
                    <span className="text-[10px] font-bold text-[#84849b] uppercase tracking-wider block truncate">
                      {adminUser.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[3px] text-xs font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("admin.logout")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-x-hidden md:pl-64 pt-14 md:pt-0 flex flex-col">{children}</div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        </div>
      </TicketNotificationProvider>
    </NotificationProvider>
  );
}
