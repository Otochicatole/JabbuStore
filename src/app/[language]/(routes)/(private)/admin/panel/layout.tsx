"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  DollarSign,
  Gift,
  TicketPlus,
  Star,
  Trophy,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ExternalLink,
  ArrowRight,
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

import type { AdminUser } from "@/features/admin/types";

interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  group: string;
  matchPrefixes?: string[];
}

interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

function isNavItemActive(normalizedPathname: string, item: AdminNavItem) {
  if (normalizedPathname === item.href) return true;
  if (normalizedPathname.startsWith(`${item.href}/`)) return true;
  if (item.matchPrefixes?.some((prefix) => normalizedPathname.startsWith(prefix))) {
    return true;
  }
  return false;
}

function SidebarNav({
  pathname,
  groups,
  collapsed,
  setIsSidebarOpen,
}: {
  pathname: string;
  groups: AdminNavGroup[];
  collapsed: boolean;
  setIsSidebarOpen: (o: boolean) => void;
}) {
  const localizePath = useLocalizedPath();
  const normalizedPathname = stripLocaleFromPathname(pathname);

  return (
    <nav className="space-y-5" aria-label="Admin navigation">
      {groups.map((group) => (
        <div key={group.id} className="space-y-1">
          {!collapsed && (
            <p className="px-2.5 pb-1 text-[11px] font-semibold text-[#746e8d]">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(normalizedPathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={localizePath(item.href)}
                  onClick={() => setIsSidebarOpen(false)}
                  title={collapsed ? item.name : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                    collapsed ? "justify-center px-2" : ""
                  } ${
                    active
                      ? "bg-accent text-white font-semibold"
                      : "text-[#a39db9] font-medium hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const localizePath = useLocalizedPath();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem("jabbu.admin.sidebarCollapsed");
        if (saved === "1") setSidebarCollapsed(true);
      } catch {
        // Ignore storage access errors
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("jabbu.admin.sidebarCollapsed", next ? "1" : "0");
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuickOpen((prev) => !prev);
      } else if (event.key === "Escape") {
        setQuickOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const navGroups = useMemo<AdminNavGroup[]>(() => {
    const opsLabel = t("admin.nav.group.operations");
    const catLabel = t("admin.nav.group.catalog");
    const eventsLabel = t("admin.nav.group.events");
    const sysLabel = t("admin.nav.group.system");

    return [
      {
        id: "operations",
        label: opsLabel,
        items: [
          {
            name: t("admin.purchaseRequests"),
            href: "/admin/panel/purchases",
            icon: ShoppingBag,
            group: opsLabel,
            matchPrefixes: ["/admin/panel/orders/purchase"],
          },
          {
            name: t("admin.sellRequests"),
            href: "/admin/panel/listings",
            icon: Tag,
            group: opsLabel,
            matchPrefixes: ["/admin/panel/orders/listing"],
          },
          {
            name: t("admin.quotes"),
            href: "/admin/panel/quotes",
            icon: DollarSign,
            group: opsLabel,
          },
          {
            name: t("tickets.adminNav"),
            href: "/admin/panel/tickets",
            icon: MessageSquare,
            group: opsLabel,
          },
          {
            name: t("admin.reviews.nav"),
            href: "/admin/panel/reviews",
            icon: Star,
            group: opsLabel,
          },
        ],
      },
      {
        id: "catalog",
        label: catLabel,
        items: [
          {
            name: t("admin.inventoryBots"),
            href: "/admin/panel/inventory",
            icon: Database,
            group: catLabel,
          },
          {
            name: t("admin.marketCatalog"),
            href: "/admin/panel/market",
            icon: Globe,
            group: catLabel,
          },
          {
            name: t("admin.botManagement"),
            href: "/admin/panel/bots",
            icon: Bot,
            group: catLabel,
          },
        ],
      },
      {
        id: "events",
        label: eventsLabel,
        items: [
          {
            name: t("admin.raffles"),
            href: "/admin/panel/raffles",
            icon: Gift,
            group: eventsLabel,
          },
          {
            name: t("admin.rafflePurchases"),
            href: "/admin/panel/raffle-purchases",
            icon: TicketPlus,
            group: eventsLabel,
            matchPrefixes: ["/admin/panel/raffle-purchases/"],
          },
          {
            name: t("admin.participationDraws"),
            href: "/admin/panel/participation-draws",
            icon: Trophy,
            group: eventsLabel,
          },
        ],
      },
      {
        id: "system",
        label: sysLabel,
        items: [
          {
            name: t("admin.globalSettings"),
            href: "/admin/panel/settings",
            icon: Settings,
            group: sysLabel,
          },
        ],
      },
    ];
  }, [t]);

  const allNavItems = useMemo(() => navGroups.flatMap((group) => group.items), [navGroups]);
  const normalizedPathname = stripLocaleFromPathname(pathname);
  const activeItem = allNavItems.find((item) => isNavItemActive(normalizedPathname, item));

  const filteredQuickItems = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return allNavItems;
    return allNavItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q),
    );
  }, [allNavItems, quickQuery]);

  const navigateQuick = (href: string) => {
    setQuickOpen(false);
    setQuickQuery("");
    router.push(localizePath(href));
  };

  return (
    <NotificationProvider actor="ADMIN" enabled={!!adminUser}>
      <TicketNotificationProvider actor="ADMIN" enabled={!!adminUser}>
        <div className="min-h-screen min-w-0 bg-[#0b0914] text-white flex flex-col md:flex-row overflow-x-hidden">
          {/* Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-[60] flex flex-col border-r border-white/[0.07] bg-[#120f22] transition-all duration-200 ${
              sidebarCollapsed ? "md:w-[72px]" : "md:w-64"
            } w-64 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
          >
            {/* Brand Header */}
            <div
              className={`flex h-14 shrink-0 items-center border-b border-white/[0.07] px-4 ${
                sidebarCollapsed ? "md:justify-center md:px-2" : "justify-between"
              }`}
            >
              <Link
                href={localizePath("/admin/panel/purchases")}
                onClick={() => setIsSidebarOpen(false)}
                className="flex min-w-0 items-center gap-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
                  JS
                </span>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white leading-tight">
                      JabbuStore
                    </span>
                    <span className="block truncate text-[11px] text-[#8e88a6]">
                      {t("admin.controlPanel")}
                    </span>
                  </div>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-[#a39db9] hover:bg-white/[0.05] hover:text-white md:hidden cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
              <Suspense
                fallback={
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-9 rounded-md bg-white/[0.03]" />
                    ))}
                  </div>
                }
              >
                <SidebarNav
                  pathname={pathname}
                  groups={navGroups}
                  collapsed={sidebarCollapsed}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              </Suspense>
            </div>

            {/* Sidebar Footer */}
            <div className="shrink-0 border-t border-white/[0.07] p-3 space-y-2">
              <button
                type="button"
                onClick={toggleCollapsed}
                title={sidebarCollapsed ? t("admin.nav.expandSidebar") : t("admin.nav.collapseSidebar")}
                className={`hidden md:flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-[#9e98b6] hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer ${
                  sidebarCollapsed ? "justify-center px-2" : ""
                }`}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t("admin.nav.collapseSidebar")}</span>
                  </>
                )}
              </button>

              {adminUser && (
                <div
                  className={`flex items-center gap-2.5 rounded-md border border-white/[0.07] bg-[#17132b] p-2 ${
                    sidebarCollapsed ? "md:flex-col md:p-1.5" : "justify-between"
                  }`}
                >
                  <div className={`flex min-w-0 items-center gap-2.5 ${sidebarCollapsed ? "md:justify-center" : ""}`}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/15 border border-accent/25 text-xs font-semibold text-fuchsia-200">
                      {adminUser.username?.[0]?.toUpperCase() || "A"}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">
                          @{adminUser.username}
                        </span>
                        <span className="block truncate text-[11px] text-[#8e88a6]">
                          {adminUser.role}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title={t("admin.logout")}
                    aria-label={t("admin.logout")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Main Workspace Column */}
          <div
            className={`flex min-w-0 flex-1 flex-col transition-all duration-200 ${
              sidebarCollapsed ? "md:pl-[72px]" : "md:pl-64"
            }`}
          >
            {/* Unified Topbar */}
            <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#120f22]/95 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#1a1630] text-white md:hidden cursor-pointer"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex items-center gap-2 text-xs sm:text-sm">
                  {activeItem ? (
                    <>
                      <span className="hidden sm:inline text-[#8e88a6] truncate">
                        {activeItem.group}
                      </span>
                      <span className="hidden sm:inline text-white/20">/</span>
                      <span className="truncate font-semibold text-white">
                        {activeItem.name}
                      </span>
                    </>
                  ) : (
                    <span className="truncate font-semibold text-white">
                      {t("admin.brand")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickOpen(true)}
                  className="hidden sm:inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-[#1a1630] px-2.5 text-xs text-[#a39db9] hover:border-white/20 hover:text-white transition-colors cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{t("admin.nav.quickJump")}</span>
                  <kbd className="rounded border border-white/10 bg-[#0d0a18] px-1.5 py-0.5 text-[10px] font-medium text-[#8e88a6]">
                    Ctrl K
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickOpen(true)}
                  aria-label={t("admin.nav.quickJump")}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#1a1630] text-[#a39db9] hover:text-white sm:hidden cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>

                <Link
                  href={localizePath("/")}
                  className="hidden lg:inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-[#1a1630] px-2.5 text-xs font-medium text-[#c2bdd6] hover:border-white/20 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{t("admin.nav.viewStore")}</span>
                </Link>

                {adminUser && <NotificationBell />}
                <LanguageSwitcher compact />
              </div>
            </header>

            <div className="min-w-0 flex-1">{children}</div>
          </div>

          {/* Mobile Drawer Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-[55] bg-black/70 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Quick Jump Palette (Ctrl+K) */}
          {quickOpen && (
            <div
              className="fixed inset-0 z-[140] flex items-start justify-center p-4 pt-20"
              role="dialog"
              aria-modal="true"
            >
              <div
                className="fixed inset-0 bg-black/75"
                onClick={() => setQuickOpen(false)}
                aria-hidden="true"
              />
              <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#141124] shadow-2xl">
                <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4 py-3">
                  <Search className="h-4 w-4 text-[#8e88a6]" />
                  <input
                    type="text"
                    autoFocus
                    value={quickQuery}
                    onChange={(e) => setQuickQuery(e.target.value)}
                    placeholder={t("admin.nav.quickJumpPlaceholder")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#746e8d]"
                  />
                  <button
                    type="button"
                    onClick={() => setQuickOpen(false)}
                    className="rounded p-1 text-[#8e88a6] hover:bg-white/5 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                  {filteredQuickItems.length === 0 ? (
                    <p className="px-3 py-8 text-center text-xs text-[#8e88a6]">
                      {t("admin.nav.noMatchingRoutes")}
                    </p>
                  ) : (
                    filteredQuickItems.map((item) => {
                      const Icon = item.icon;
                      const active = isNavItemActive(normalizedPathname, item);
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => navigateQuick(item.href)}
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition-colors cursor-pointer ${
                            active
                              ? "bg-accent/15 text-white"
                              : "text-[#c2bdd6] hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-[#8e88a6]"}`} />
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-medium">{item.name}</span>
                              <span className="block truncate text-[11px] text-[#7d7698]">{item.group}</span>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#746e8d]" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </TicketNotificationProvider>
    </NotificationProvider>
  );
}
