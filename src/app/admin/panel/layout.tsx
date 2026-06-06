"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "inventory";

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
      console.error("Error al cerrar sesión:", err);
    }
    window.location.href = "/admin/login";
  };

  const navItems = [
    {
      name: "Inventario Bots",
      href: "/admin/panel/dashboard?tab=inventory",
      icon: Database,
    },
    {
      name: "Catálogo de Mercado",
      href: "/admin/panel/dashboard?tab=market",
      icon: Globe,
    },
    {
      name: "Solicitudes de Compra",
      href: "/admin/panel/dashboard?tab=purchases",
      icon: ShoppingBag,
    },
    {
      name: "Solicitudes de Venta",
      href: "/admin/panel/dashboard?tab=listings",
      icon: Tag,
    },
    { name: "Gestión de Bots", href: "/admin/panel/bots", icon: Bot },
    {
      name: "Configuración Global",
      href: "/admin/panel/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0818] text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0f0d1e] border-b border-white/5">
        <div className="flex flex-col">
          <h1 className="text-sm font-black uppercase tracking-wider">
            Jabbu Admin
          </h1>
          {adminUser && (
            <span className="text-[9px] text-[#84849b]">
              @{adminUser.username}
            </span>
          )}
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0f0d1e] border-r border-white/5 p-6 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:fixed md:translate-x-0
      `}
      >
        <div>
          <div className="mb-10 hidden md:block">
            <h1 className="text-lg font-black uppercase tracking-wider text-white">
              Jabbu Store
            </h1>
            <p className="text-[10px] font-bold text-[#84849b] uppercase tracking-widest mt-0.5">
              Panel de Control
            </p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const itemPath = item.href.split("?")[0];
              const itemTab = new URLSearchParams(item.href.split("?")[1]).get(
                "tab",
              );

              const isActive =
                pathname === itemPath && (!itemTab || currentTab === itemTab);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-2.5 px-3.5 py-2.5 rounded-[3px] text-xs font-bold transition-colors
                    ${
                      isActive
                        ? "bg-accent text-white shadow-[0_0_20px_rgba(217,70,239,0.15)]"
                        : "text-[#84849b] hover:text-white hover:bg-white/[0.02]"
                    }
                  `}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-white/5 pt-4">
          {adminUser && (
            <div className="bg-white/[0.02] border border-white/5 rounded-[3px] p-3 mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[3px] bg-accent/10 border border-accent/20 flex items-center justify-center font-sans font-black text-xs text-accent">
                  {adminUser.username?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <span className="text-sm font-black text-white block">
                    @{adminUser.username}
                  </span>
                  <span className="text-[10px] font-bold text-[#84849b] uppercase tracking-wider block">
                    {adminUser.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-[3px] text-xs font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:pl-64">{children}</div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
