"use client";

import React, { useState, useMemo } from 'react';
import { AdminBotsPanel } from '@/features/marketplace/ui/AdminBotsPanel';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BACKEND_URL } from '@/shared/lib/api';
import { 
  LogOut, 
  RefreshCw, 
  TrendingUp, 
  Database, 
  Cpu, 
  Search, 
  SlidersHorizontal, 
  ExternalLink,
  ShieldAlert,
  Loader2,
  CalendarDays,
  Tags
} from 'lucide-react';

interface StoreItem {
  assetId: string;
  classId: string;
  name: string;
  type: string;
  iconUrl: string | null;
  tradable: boolean;
  marketable: boolean;
  botSteamId: string;
  price: number;
  rarity: string;
  exterior: string | null;
  category: string;
  isStatTrak: boolean;
  isSouvenir: boolean;
  float: number | null;
  pattern: number | null;
}

interface OrderItem {
  id: string;
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
}

interface Order {
  id: string;
  userId: string;
  user: { name: string | null; steamId: string | null; avatar: string | null };
  type: string;
  status: string;
  totalPrice: number;
  items: OrderItem[];
  createdAt: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AdminDashboardClientProps {
  initialItems: StoreItem[];
  adminUser: AdminUser;
}

const rarityColors: Record<string, string> = {
  common: 'border-l-4 border-l-[#b0c3d9]',
  uncommon: 'border-l-4 border-l-[#5e98d9]',
  rare: 'border-l-4 border-l-[#4b69ff]',
  mythical: 'border-l-4 border-l-[#8847ff]',
  legendary: 'border-l-4 border-l-[#d32ce6]',
  ancient: 'border-l-4 border-l-[#eb4b4b]',
  immortal: 'border-l-4 border-l-[#e4ae39]',
};

export function AdminDashboardClient({ initialItems, adminUser }: AdminDashboardClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [currentTab, setCurrentTab] = useState<'inventory' | 'purchases' | 'bots' | 'settings'>('inventory');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'float_asc' | 'float_desc'>('price_desc');

  const fetchStoreItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/store/items`, {
        headers: {
          'X-Tunnel-Skip-AntiPhishing-Page': 'true',
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar los artículos de la tienda.');
      }
      const data = await response.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Petición al BFF del frontend para que borre la cookie local de forma segura
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
    
    router.push('/admin/login');
    router.refresh(); // Refrescar para disparar la redirección del Server Component
  };
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/all`, {
        headers: {
          'X-Tunnel-Skip-AntiPhishing-Page': 'true',
        },
        credentials: 'include'
      });
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!response.ok) throw new Error('Error al cargar las órdenes.');
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar órdenes.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Tunnel-Skip-AntiPhishing-Page': 'true',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Error actualizando estado.');
      fetchOrders(); // Refresh orders
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTabChange = (tab: 'inventory' | 'orders') => {
    setCurrentTab(tab);
    if (tab === 'orders') {
      fetchOrders();
    } else {
      fetchStoreItems();
    }
  };
  const triggerSync = async () => {
    setSyncing(true);
    // Simular un trigger manual para regenerar y sincronizar data
    setTimeout(() => {
      fetchStoreItems();
      setSyncing(false);
    }, 1500);
  };

  // Compute Statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const inventoryValue = items.reduce((sum, item) => sum + item.price, 0);
    const uniqueTypes = new Set(items.map(item => item.name)).size;
    const botsConnected = new Set(items.map(item => item.botSteamId)).size;

    return {
      totalItems,
      inventoryValue,
      uniqueTypes,
      botsConnected: botsConnected || 2,
    };
  }, [items]);

  // Filter and Sort Items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                              item.type.toLowerCase().includes(search.toLowerCase());
        const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
        return matchesSearch && matchesRarity;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'float_asc') return (a.float || 0) - (b.float || 0);
        if (sortBy === 'float_desc') return (b.float || 0) - (a.float || 0);
        return 0;
      });
  }, [items, search, selectedRarity, sortBy]);

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#0b0818]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center font-sans font-black text-xs text-accent">
              JS
            </div>
            <div>
              <span className="text-sm font-black tracking-tight block uppercase">
                Jabbu<span className="text-accent">Store</span> Admin
              </span>
              <span className="text-[9px] font-black font-mono text-[#84849b] uppercase tracking-wider block">
                Sesión Validada por JWT (HttpOnly Cookie)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-black text-white block">@{adminUser?.username || 'admin_master'}</span>
              <span className="text-[9px] font-bold text-accent font-mono uppercase tracking-wider block">
                {adminUser?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-white/5 bg-[#0b0818]/60 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
          <button 
            onClick={() => handleTabChange('inventory')}
            className={`py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
              currentTab === 'inventory' 
                ? 'border-accent text-white' 
                : 'border-transparent text-[#84849b] hover:text-white'
            }`}
          >
            Inventario Tienda
          </button>
          <button 
            onClick={() => handleTabChange('purchases')}
            className={`py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              currentTab === 'purchases' 
                ? 'border-accent text-white' 
                : 'border-transparent text-[#84849b] hover:text-white'
            }`}
          >
            Órdenes y Compras
            {orders.length > 0 && currentTab === 'purchases' && (
              <span className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[9px]">{orders.length}</span>
            )}
          </button>
          <button 
            onClick={() => setCurrentTab('bots')}
            className={`py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              currentTab === 'bots' 
                ? 'border-accent text-white' 
                : 'border-transparent text-[#84849b] hover:text-white'
            }`}
          >
            Gestión de Bots
          </button>
          <button 
            onClick={() => setCurrentTab('settings')}
            className={`py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              currentTab === 'settings' 
                ? 'border-accent text-white' 
                : 'border-transparent text-[#84849b] hover:text-white'
            }`}
          >
            Configuración Global
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {currentTab === 'inventory' && (
          <>
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Stat 1: Total Stock */}
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-2xl rounded-full group-hover:bg-accent/10 transition-colors pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">Stock Total</span>
                <span className="text-3xl font-black block mt-2 tracking-tight">
                  {loading ? (
                    <Loader2 className="w-7 h-7 animate-spin text-white/40" />
                  ) : (
                    stats.totalItems.toLocaleString()
                  )}
                </span>
                <span className="text-[10px] text-[#84849b] block mt-1">Artículos sincronizados</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(217,70,239,0.05)]">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Stat 2: Inventory Value */}
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">Valor Total</span>
                <span className="text-3xl font-black block mt-2 text-green-400 tracking-tight">
                  {loading ? (
                    <Loader2 className="w-7 h-7 animate-spin text-green-400/40" />
                  ) : (
                    `$${stats.inventoryValue.toLocaleString()}`
                  )}
                </span>
                <span className="text-[10px] text-[#84849b] block mt-1">USD Estimados en stock</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.05)]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Stat 3: Bots Connected */}
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">Bots de Steam</span>
                <span className="text-3xl font-black block mt-2 text-blue-400 tracking-tight">
                  {stats.botsConnected}
                </span>
                <span className="text-[10px] text-[#84849b] block mt-1">Sincronizadores activos</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.05)]">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Stat 4: Sync Scheduler */}
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-2xl rounded-full group-hover:bg-yellow-500/10 transition-colors pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">Cronjob Sync</span>
                <span className="text-lg font-black block mt-3 text-yellow-400 tracking-tight flex items-center gap-1.5 uppercase font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Activo
                </span>
                <span className="text-[10px] text-[#84849b] block mt-2">Próxima sincronización en ~5m</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.05)]">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
          </div>

        </div>

        {/* Sync Controls and Notifications */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#110f1e]/30 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl text-[#84849b]">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Servidor de Precios CS2.sh</p>
              <p className="text-[10px] text-[#84849b] font-medium font-mono">Última recarga automática de inventario de Steam exitosa</p>
            </div>
          </div>

          <button
            onClick={triggerSync}
            disabled={syncing || loading}
            className="px-4 py-2.5 bg-white hover:bg-white/95 text-black text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,255,255,0.05)] cursor-pointer disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Forzar Sync Inventario</span>
              </>
            )}
          </button>
        </div>

        {/* Database Items List View */}
        <div className="bg-[#110f1e]/20 border border-white/5 rounded-2xl p-6 space-y-6">
          
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-md font-black uppercase tracking-wider font-sans">Artículos en la Tienda</h2>
              <p className="text-xs text-[#84849b] font-medium mt-0.5">Listado de items que el usuario ve en el frontend</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar arma, diseño..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#161426]/40 border border-white/5 rounded-xl text-xs placeholder-white/20 focus:outline-none focus:border-accent/30 transition-all text-white"
                />
              </div>

              {/* Rarity select */}
              <div className="relative">
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="px-3.5 py-2 bg-[#161426]/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-accent/30 transition-all uppercase font-mono tracking-wider font-bold cursor-pointer"
                >
                  <option value="all">Todas las rarezas</option>
                  <option value="ancient">Encubierto (Rojo)</option>
                  <option value="legendary">Clasificado (Rosa)</option>
                  <option value="mythical:">Restringido (Morado)</option>
                  <option value="rare">Militar (Azul)</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3.5 py-2 bg-[#161426]/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-accent/30 transition-all uppercase font-mono tracking-wider font-bold cursor-pointer"
                >
                  <option value="price_desc">Precio: Mayor a menor</option>
                  <option value="price_asc">Precio: Menor a mayor</option>
                  <option value="float_asc">Float: Menor a mayor</option>
                  <option value="float_desc">Float: Mayor a menor</option>
                </select>
              </div>

            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-xs text-[#84849b] font-mono uppercase tracking-wider">Cargando base de datos...</p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-3">
              <ShieldAlert className="w-10 h-10 text-red-500/80" />
              <div>
                <p className="text-sm font-black uppercase text-white">Error de carga</p>
                <p className="text-xs text-[#84849b] mt-1">{error}</p>
              </div>
              <button
                onClick={fetchStoreItems}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-[#84849b] text-xs font-mono uppercase">
              No se encontraron artículos que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                    <th className="pb-3 pl-4">Artículo</th>
                    <th className="pb-3">Desgaste / Semilla</th>
                    <th className="pb-3">Float</th>
                    <th className="pb-3">Bot Conectado</th>
                    <th className="pb-3 text-right pr-4">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredItems.map((item) => (
                    <tr 
                      key={item.assetId} 
                      className={`hover:bg-white/[0.01] transition-colors group ${rarityColors[item.rarity] || ''}`}
                    >
                      {/* Name & Icon */}
                      <td className="py-3 pl-4 flex items-center gap-3.5">
                        <div className="w-12 h-9 relative bg-white/[0.01] border border-white/[0.02] rounded-lg p-1 flex items-center justify-center">
                          {item.iconUrl ? (
                            <Image
                              src={item.iconUrl}
                              alt={item.name}
                              width={40}
                              height={30}
                              className="object-contain"
                            />
                          ) : (
                            <span className="text-[8px] text-[#84849b] font-mono">No Image</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            {item.isStatTrak && (
                              <span className="text-[#cf6a32] text-[8px] font-mono border border-[#cf6a32]/20 bg-[#cf6a32]/5 px-1 rounded-sm">
                                ST™
                              </span>
                            )}
                            {item.isSouvenir && (
                              <span className="text-[#e4ae39] text-[8px] font-mono border border-[#e4ae39]/20 bg-[#e4ae39]/5 px-1 rounded-sm">
                                SV
                              </span>
                            )}
                            <span className="line-clamp-1">{item.type} | {item.name}</span>
                          </div>
                          <div className="text-[9px] text-[#84849b] font-semibold mt-0.5 font-sans">
                            AssetID: <span className="font-mono">{item.assetId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Wear Condition & Seed */}
                      <td className="py-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">
                          {item.exterior || 'N/A'}
                        </span>
                        {item.pattern !== null && (
                          <span className="text-[9px] text-[#84849b] font-mono block mt-0.5">
                            Semilla: <span className="text-white font-bold">{item.pattern}</span>
                          </span>
                        )}
                      </td>

                      {/* Float range indicator */}
                      <td className="py-3">
                        {item.float !== null ? (
                          <div className="max-w-[120px] w-full">
                            <span className="text-[10px] font-bold font-mono text-white block">
                              {item.float.toFixed(8)}
                            </span>
                            {/* Visual line condition */}
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                              <div 
                                className="h-full bg-accent rounded-full" 
                                style={{ width: `${Math.min(100, item.float * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/35 font-mono">N/A</span>
                        )}
                      </td>

                      {/* Bot account */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 text-[#84849b] text-[10px]">
                          <span className="font-mono text-white/70">{item.botSteamId.slice(-6)}</span>
                          <a 
                            href={`https://steamcommunity.com/profiles/${item.botSteamId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-accent transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* Price tag */}
                      <td className="py-3 text-right pr-4">
                        <span className="text-xs font-black text-white font-sans">${item.price.toLocaleString()}</span>
                        <span className="text-[9px] text-[#84849b] block font-semibold">USD</span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Bot Accounts Profile Section */}
        <div className="bg-[#110f1e]/10 border border-white/5 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-sans">Vendedores / Cuentas de Bots Registradas</h3>
            <p className="text-xs text-[#84849b] font-medium mt-0.5">Cuentas configuradas en storeAccounts.ts que alimentan el catálogo de venta</p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#110f1e]/40 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    B1
                  </div>
                  <div>
                    <span className="text-xs font-black block">Bot Cuenta #1</span>
                    <span className="text-[9px] text-[#84849b] font-mono block mt-0.2">SteamID: 76561199649767651</span>
                  </div>
                </div>
                <a 
                  href="https://steamcommunity.com/profiles/76561199649767651" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Perfil</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#110f1e]/40 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    B2
                  </div>
                  <div>
                    <span className="text-xs font-black block">Bot Cuenta #2</span>
                    <span className="text-[9px] text-[#84849b] font-mono block mt-0.2">SteamID: 76561199439383804</span>
                  </div>
                </div>
                <a 
                  href="https://steamcommunity.com/profiles/76561199439383804" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Perfil</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
          </>
        )}

        {currentTab === 'purchases' && (
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-8 relative overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                  Órdenes de Compra
                </h2>
                <p className="text-xs text-[#84849b] mt-1 font-medium">Revisa las compras generadas por los usuarios y aprueba sus trades.</p>
              </div>
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="flex items-center gap-2 h-10 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin text-accent' : ''}`} />
                Actualizar
              </button>
            </div>

            {loadingOrders ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.02] rounded-xl border border-white/5">
                <p className="text-[#84849b] font-bold">No hay órdenes creadas todavía.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-background/50 border border-white/5 rounded-xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Order ID</span>
                        <span className="font-mono font-bold text-sm">{order.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Comprador</span>
                        <div className="flex items-center gap-2">
                          {order.user?.avatar && (
                            <img src={order.user.avatar} className="w-5 h-5 rounded-sm" />
                          )}
                          <span className="text-sm font-bold">{order.user?.name || 'Usuario desconocido'}</span>
                          <span className="text-[10px] text-accent font-mono">({order.user?.steamId})</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Total</span>
                        <span className="text-emerald-400 font-black text-lg">${order.totalPrice.toLocaleString()} USDT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Estado</span>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'PENDING_PAYMENT' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          order.status === 'PAID' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          order.status === 'TRADE_PENDING' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block mb-1">Acciones (Admin)</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'PAID')}
                            className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase transition-colors"
                          >
                            Pagado
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'TRADE_PENDING')}
                            className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold uppercase transition-colors"
                          >
                            Trade
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase transition-colors"
                          >
                            Completar
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-[10px] font-bold uppercase transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#84849b] font-black uppercase tracking-widest">Ítems de la orden ({order.items.length})</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-3 bg-[#110f1e] p-2 rounded-lg border border-white/5">
                            {item.iconUrl && (
                              <img src={item.iconUrl} className="w-10 h-10 object-contain drop-shadow-md" alt={item.name} />
                            )}
                            <div>
                              <span className="text-[11px] font-bold block truncate">{item.name}</span>
                              <span className="text-[10px] text-accent font-black">${item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-8">
            <h2 className="text-xl font-black tracking-tight text-white mb-6">Configuración del Marketplace</h2>
            <div className="w-full h-[600px] border border-white/10 rounded overflow-hidden">
              <iframe src="/admin/panel/settings" className="w-full h-full bg-transparent" />
            </div>
          </div>
        )}

        {currentTab === 'bots' && (
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-8">
            <AdminBotsPanel />
          </div>
        )}

      </main>
    </div>
  );
}
