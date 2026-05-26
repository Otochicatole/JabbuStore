"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { AdminBotsPanel } from '@/features/marketplace/ui/AdminBotsPanel';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Tags,
  ChevronDown,
  Tag,
  XCircle,
  Clock,
  CheckCircle2,
  X,
  Pencil,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Copy,
  Check
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
  isPriceManual?: boolean;
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
  rarity?: string | null;
  exterior?: string | null;
  float?: number | null;
  pattern?: number | null;
  provider?: string | null;
}

interface Order {
  id: string;
  userId: string;
  user: { name: string | null; steamId: string | null; avatar: string | null; tradeUrl?: string | null };
  type: string;
  status: string;
  totalPrice: number;
  items: OrderItem[];
  createdAt: string;
  paymentMethod?: string | null;
  metadata?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    cbu?: string | null;
    cuil?: string | null;
    accountHolder?: string | null;
    walletAddress?: string | null;
    network?: string | null;
  } | null;
}

interface Listing {
  id: string;
  userId: string | null;
  user: { id: string; name: string | null; avatar: string | null; steamId: string | null } | null;
  skinId: string;
  itemName: string | null;
  itemIconUrl: string | null;
  basePrice: number;
  finalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
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
};

const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    let adjustedStart = start;
    let adjustedEnd = end;
    if (currentPage <= 3) {
      adjustedEnd = 4;
    } else if (currentPage >= totalPages - 2) {
      adjustedStart = totalPages - 3;
    }

    for (let i = adjustedStart; i <= adjustedEnd; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
  }

  return pages;
}

const getItemExterior = (item: OrderItem) => {
  if (item.exterior) return item.exterior;
  const name = item.name.toLowerCase();
  if (name.includes('factory new') || name.includes('(fn)')) return 'Factory New';
  if (name.includes('minimal wear') || name.includes('(mw)')) return 'Minimal Wear';
  if (name.includes('field-tested') || name.includes('(ft)')) return 'Field-Tested';
  if (name.includes('well-worn') || name.includes('(ww)')) return 'Well-Worn';
  if (name.includes('battle-scarred') || name.includes('(bs)')) return 'Battle-Scarred';
  return null;
};

const getItemRarity = (item: OrderItem) => {
  if (item.rarity) return item.rarity;
  const name = item.name.toLowerCase();
  if (name.includes('★') || name.includes('karambit') || name.includes('m9') || name.includes('butterfly') || name.includes('knife') || name.includes('gloves')) {
    return 'ancient';
  }
  if (name.includes('doppler') || name.includes('fade') || name.includes('vulcan') || name.includes('asiimov')) {
    return 'ancient';
  }
  return 'common';
};

export function AdminDashboardClient({ initialItems, adminUser }: AdminDashboardClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'inventory' | 'purchases' | 'listings' | 'bots' | 'settings') || 'inventory';

  useEffect(() => {
    if (currentTab === 'purchases') {
      fetchOrders();
    } else if (currentTab === 'inventory') {
      fetchStoreItems();
    } else if (currentTab === 'listings') {
      fetchListings();
    }
  }, [currentTab]);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sell Orders State (orders of type SELL)
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'float_asc' | 'float_desc'>('price_desc');

  // Pagination State for Store Inventory
  const [inventoryPage, setInventoryPage] = useState(1);
  const ITEMS_PER_INVENTORY_PAGE = 50;

  useEffect(() => {
    setInventoryPage(1);
  }, [search, selectedRarity, sortBy]);

  // Price modal states
  const [priceModalItem, setPriceModalItem] = useState<StoreItem | null>(null);
  const [modalManualEnabled, setModalManualEnabled] = useState(false);
  const [modalPriceValue, setModalPriceValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // State for dynamically resolved historical skin details (floats and patterns)
  const [resolvedItemsMap, setResolvedItemsMap] = useState<Record<string, { float: number | null, pattern: number | null, rarity?: string, exterior?: string }>>({});

  const resolveMissingItemDetails = async (ordersList: Order[]) => {
    // Gather all unique assetIds from orders that lack float or pattern details
    const missingAssetIds = new Set<string>();
    ordersList.forEach(order => {
      order.items?.forEach(item => {
        if ((item.float === null || item.float === undefined) && !resolvedItemsMap[item.assetId]) {
          missingAssetIds.add(item.assetId);
        }
      });
    });

    if (missingAssetIds.size === 0) return;

    console.log(`[Admin] Resolving missing details for ${missingAssetIds.size} assets...`);

    const fetchPromises = Array.from(missingAssetIds).map(async (assetId) => {
      try {
        const response = await fetch(`${BACKEND_URL}/admin/marketplace/items/details/${assetId}`, {
          headers: {
            'X-Tunnel-Skip-AntiPhishing-Page': 'true',
          },
          credentials: 'include'
        });
        if (response.ok) {
          const details = await response.json();
          return { assetId, details };
        }
      } catch (err) {
        console.error(`Error resolving details for asset ${assetId}:`, err);
      }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const newResolutions: Record<string, { float: number | null, pattern: number | null, rarity?: string, exterior?: string }> = {};

    results.forEach(res => {
      if (res && res.details) {
        newResolutions[res.assetId] = {
          float: res.details.float,
          pattern: res.details.pattern,
          rarity: res.details.rarity,
          exterior: res.details.exterior
        };
      }
    });

    if (Object.keys(newResolutions).length > 0) {
      setResolvedItemsMap(prev => ({
        ...prev,
        ...newResolutions
      }));
    }
  };

  const handleCopyTradeLink = (tradeLink: string, orderId: string) => {
    navigator.clipboard.writeText(tradeLink);
    setCopiedOrderId(orderId);
    setTimeout(() => {
      setCopiedOrderId(null);
    }, 2000);
  };

  const openPriceModal = (item: StoreItem) => {
    setPriceModalItem(item);
    setModalManualEnabled(item.isPriceManual ?? false);
    setModalPriceValue(item.price.toString());
    setModalError(null);
  };

  const closePriceModal = () => {
    setPriceModalItem(null);
    setModalError(null);
  };

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

  const handleSavePrice = async () => {
    if (!priceModalItem) return;
    const parsedPrice = parseFloat(modalPriceValue);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setModalError('Ingresá un precio numérico válido mayor o igual a 0.');
      return;
    }

    setModalSaving(true);
    setModalError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/store/items/${priceModalItem.assetId}/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Tunnel-Skip-AntiPhishing-Page': 'true',
        },
        body: JSON.stringify({ price: parsedPrice, isPriceManual: modalManualEnabled }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el precio del artículo.');
      }

      setItems(prev => prev.map(item => {
        if (item.assetId === priceModalItem.assetId) {
          return { ...item, price: parsedPrice, isPriceManual: modalManualEnabled };
        }
        return item;
      }));

      closePriceModal();
    } catch (err: any) {
      setModalError(err.message || 'Error de conexión al actualizar el precio.');
    } finally {
      setModalSaving(false);
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
      const data: Order[] = await response.json();
      const filtered = data.filter(o => o.type === 'BUY');
      setOrders(filtered);
      resolveMissingItemDetails(filtered);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar órdenes.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/all`, {
        headers: { 'X-Tunnel-Skip-AntiPhishing-Page': 'true' },
        credentials: 'include',
      });
      if (response.status === 401) { router.push('/admin/login'); return; }
      if (!response.ok) throw new Error('Error al cargar las órdenes de venta.');
      const data: Order[] = await response.json();
      const filtered = data.filter(o => o.type === 'SELL');
      setSellOrders(filtered);
      resolveMissingItemDetails(filtered);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingListings(false);
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

  const totalInventoryPages = Math.ceil(filteredItems.length / ITEMS_PER_INVENTORY_PAGE);
  const currentInventoryPage = inventoryPage > totalInventoryPages ? 1 : inventoryPage;

  const visibleInventoryItems = useMemo(() => {
    const start = (currentInventoryPage - 1) * ITEMS_PER_INVENTORY_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_INVENTORY_PAGE);
  }, [filteredItems, currentInventoryPage]);

  return (
    <div className="min-h-screen bg-[#070510] text-white">




      {/* Main Container */}
      <main className="w-full px-6 py-8 space-y-8">
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
            <>
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
                  {visibleInventoryItems.map((item) => (
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
                      <td className="py-4 text-right pr-6">
                        <div
                          onClick={() => openPriceModal(item)}
                          className="cursor-pointer group/price flex items-center justify-end gap-2.5 hover:text-accent select-none p-1.5 rounded-lg hover:bg-white/[0.02] transition-all inline-flex"
                          title="Clic para editar el precio"
                        >
                          <div className="text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-sm sm:text-base font-extrabold text-white font-sans tracking-tight">${item.price.toLocaleString()}</span>
                              {item.isPriceManual && (
                                <span className="text-[8px] font-black uppercase bg-yellow-500/20 border border-yellow-500/35 text-yellow-400 px-2 py-0.5 rounded-md tracking-wider ml-2 font-mono">
                                  Manual
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#84849b] block font-bold mt-0.5">USD</span>
                          </div>
                          <Pencil className="w-3.5 h-3.5 opacity-0 group-hover/price:opacity-100 transition-opacity text-accent" />
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col items-center gap-6 mt-8 pt-6 border-t border-white/5">
              {/* Counter banner */}
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#84849b] bg-[#161426]/30 border border-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Mostrando items <span className="text-white">{Math.min((currentInventoryPage - 1) * ITEMS_PER_INVENTORY_PAGE + 1, filteredItems.length)} - {Math.min(currentInventoryPage * ITEMS_PER_INVENTORY_PAGE, filteredItems.length)}</span> de <span className="text-white">{filteredItems.length}</span>
              </div>

              {totalInventoryPages > 1 && (
                <nav className="flex items-center gap-2" aria-label="Paginación de inventario">
                  {/* Previous Button */}
                  <button
                    onClick={() => currentInventoryPage > 1 && setInventoryPage(currentInventoryPage - 1)}
                    disabled={currentInventoryPage === 1}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/[0.02] text-[#84849b] transition-all duration-300 ${
                      currentInventoryPage === 1
                        ? 'opacity-40 cursor-not-allowed text-white/20'
                        : 'hover:text-white hover:bg-white/5 hover:border-white/10 active:scale-95 cursor-pointer'
                    }`}
                    title="Página Anterior"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  {getPageNumbers(currentInventoryPage, totalInventoryPages).map((page, index) => {
                    if (page === '...') {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="w-10 h-10 flex items-center justify-center text-xs font-black text-white/30 font-mono select-none"
                        >
                          ...
                        </span>
                      );
                    }

                    const isPageActive = page === currentInventoryPage;

                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => setInventoryPage(Number(page))}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                          isPageActive
                            ? 'bg-gradient-to-r from-accent via-fuchsia-600 to-accent text-white border border-fuchsia-400/40 shadow-[0_0_20px_rgba(217,70,239,0.3)] scale-105'
                            : 'border border-white/5 bg-white/[0.02] text-[#84849b] hover:text-white hover:bg-white/5 hover:border-white/10 active:scale-95'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => currentInventoryPage < totalInventoryPages && setInventoryPage(currentInventoryPage + 1)}
                    disabled={currentInventoryPage === totalInventoryPages}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/[0.02] text-[#84849b] transition-all duration-300 ${
                      currentInventoryPage === totalInventoryPages
                        ? 'opacity-40 cursor-not-allowed text-white/20'
                        : 'hover:text-white hover:bg-white/5 hover:border-white/10 active:scale-95 cursor-pointer'
                    }`}
                    title="Página Siguiente"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              )}
            </div>
            </>
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                  Solicitudes de Compra
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
              <div className="flex justify-center py-20 bg-[#110f1e]/40 border border-white/5 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-[#110f1e]/40 rounded-2xl border border-white/5">
                <p className="text-[#84849b] font-bold">No hay órdenes creadas todavía.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-[#110f1e]/40 border border-white/5 rounded-xl p-6">
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
                        <span className="text-emerald-400 font-black text-lg">${order.totalPrice.toLocaleString()} USD</span>
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

                    {/* Sección Detallada de Cliente y Facturación/Cobro */}
                    <div className="mb-6 bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                        <div className="w-1.5 h-4 bg-accent rounded-full animate-pulse" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
                          Detalles del Cliente y Facturación / Cobro
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                        
                        {/* Columna 1: Datos Personales */}
                        <div className="space-y-3">
                          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                            Datos del Cliente
                          </h5>
                          <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Nombre Completo</span>
                              <span className="font-bold text-white block mt-0.5">
                                {order.metadata?.firstName || order.metadata?.lastName
                                  ? `${order.metadata.firstName || ''} ${order.metadata.lastName || ''}`.trim()
                                  : order.user?.name || 'No especificado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Email</span>
                              <span className="font-bold text-white block mt-0.5 break-all">
                                {order.metadata?.email || 'No especificado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Teléfono</span>
                              <span className="font-bold text-white block mt-0.5 font-mono">
                                {order.metadata?.phone || 'No especificado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Columna 2: Método y Datos de Pago/Cobro */}
                        <div className="space-y-3">
                          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                            Método de Pago / Payout
                          </h5>
                          <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5 min-h-[120px]">
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Canal Elegido</span>
                              <span className="font-bold text-accent block mt-0.5 uppercase tracking-wide">
                                {order.paymentMethod === 'mercado_pago' ? 'Mercado Pago' : 
                                 order.paymentMethod === 'paypal' ? 'PayPal' : 
                                 order.paymentMethod === 'ethereum' ? 'Ethereum (Web3)' : 
                                 order.paymentMethod === 'binance' ? 'Binance Pay' : 
                                 order.paymentMethod || 'No especificado'}
                              </span>
                            </div>

                            {/* Detalle dinámico según el método de pago */}
                            {order.paymentMethod === 'mercado_pago' && (
                              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">CBU / CVU / Alias</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.cbu || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Titular</span>
                                  <span className="font-bold text-white block">{order.metadata?.accountHolder || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">CUIL / CUIT</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all">{order.metadata?.cuil || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {order.paymentMethod === 'paypal' && (
                              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Correo PayPal</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.cbu || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Titular</span>
                                  <span className="font-bold text-white block">{order.metadata?.accountHolder || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {(order.paymentMethod === 'ethereum' || order.paymentMethod === 'binance') && (
                              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Dirección / Wallet</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.walletAddress || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Red Blockchain</span>
                                  <span className="font-bold text-white block">{order.metadata?.network || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {!order.paymentMethod && (
                              <p className="text-[10px] text-white/35 italic mt-2">Sin datos de cobro adicionales.</p>
                            )}
                          </div>
                        </div>

                        {/* Columna 3: Steam Trade Link */}
                        <div className="space-y-3">
                          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                            Steam Trade Link
                          </h5>
                          <div className="space-y-3 bg-white/[0.01] p-3 rounded-xl border border-white/5 min-h-[120px] flex flex-col justify-between font-sans">
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">URL de Intercambio</span>
                              <span className="font-mono text-[10px] text-white/80 block mt-1 break-all select-all leading-normal">
                                {order.user?.tradeUrl || 'Sin Trade URL registrado en el perfil'}
                              </span>
                            </div>
                            
                            {order.user?.tradeUrl && (
                              <button
                                onClick={() => order.user.tradeUrl && handleCopyTradeLink(order.user.tradeUrl, order.id)}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  copiedOrderId === order.id
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                    : 'bg-white/5 border-white/5 text-[#84849b] hover:text-white hover:bg-white/10 hover:border-white/10 active:scale-95'
                                }`}
                              >
                                {copiedOrderId === order.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Copiado Exitosamente</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar Tradelink</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                    
                    <details className="group">
                      <summary className="text-[10px] text-[#84849b] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors flex items-center justify-between font-sans">
                        <span>Ítems de la orden ({order.items.length})</span>
                        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-3 mt-3">
                        {order.items.map(item => {
                          const resolvedDetails = resolvedItemsMap[item.assetId] || {};
                          const finalFloat = item.float !== null && item.float !== undefined ? item.float : (resolvedDetails.float !== undefined ? resolvedDetails.float : null);
                          const finalPattern = item.pattern !== null && item.pattern !== undefined ? item.pattern : (resolvedDetails.pattern !== undefined ? resolvedDetails.pattern : null);
                          const finalRarity = item.rarity || resolvedDetails.rarity || getItemRarity(item);
                          const finalExterior = item.exterior || resolvedDetails.exterior || getItemExterior(item);
                          const finalProvider = item.provider || (item.assetId && typeof item.assetId === 'string' && item.assetId.startsWith("resell-") ? (hashCode(item.assetId) % 2 === 0 ? "youpin" : "buff") : "bots");

                          return (
                            <div 
                              key={item.id} 
                              className={`flex flex-col sm:flex-row sm:items-center gap-4 bg-[#110f1e] p-4 rounded-xl border border-white/5 relative overflow-hidden group ${
                                rarityColors[finalRarity] || ''
                              }`}
                            >
                              {/* Icon image */}
                              <div className="w-16 h-12 relative bg-white/[0.01] border border-white/[0.02] rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
                                {item.iconUrl ? (
                                  <img src={item.iconUrl} className="w-full h-full object-contain drop-shadow-md" alt={item.name} />
                                ) : (
                                  <span className="text-[8px] text-[#84849b] font-mono">No Image</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-extrabold text-white block truncate">{item.name}</span>
                                  {finalProvider === 'youpin' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono">Youpin</span>
                                  )}
                                  {finalProvider === 'buff' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono">Buff</span>
                                  )}
                                  {finalProvider === 'bots' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">Bots</span>
                                  )}
                                  {finalProvider === 'user' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono">Usuario</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-mono">
                                  {finalExterior && (
                                    <span className="text-white/80 font-sans uppercase tracking-wider font-bold bg-white/5 px-1.5 py-0.5 rounded-sm">
                                      {finalExterior}
                                    </span>
                                  )}
                                  {finalPattern !== null && finalPattern !== undefined && (
                                    <span className="text-[#84849b] bg-white/[0.02] px-1.5 py-0.5 rounded-sm border border-white/5">
                                      Semilla: <span className="text-white font-bold">{finalPattern}</span>
                                    </span>
                                  )}
                                  <span className="text-[#84849b] bg-white/[0.02] px-1.5 py-0.5 rounded-sm border border-white/5">
                                    AssetID: <span className="text-white font-semibold select-all">{item.assetId}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Float display */}
                              {finalFloat !== null && finalFloat !== undefined ? (
                                <div className="sm:w-32 flex-shrink-0">
                                  <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block">Float</span>
                                  <span className="text-[10px] font-bold font-mono text-white block mt-0.5">
                                    {finalFloat.toFixed(8)}
                                  </span>
                                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                                    <div 
                                      className="h-full bg-accent rounded-full animate-pulse" 
                                      style={{ width: `${Math.min(100, finalFloat * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="sm:w-32 flex-shrink-0">
                                  <span className="text-[9px] uppercase tracking-wider font-black text-white/20 font-mono block">Float</span>
                                  <span className="text-[10px] text-white/35 font-mono block mt-0.5">N/A</span>
                                </div>
                              )}

                              {/* Price */}
                              <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                                <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block sm:hidden">Precio</span>
                                <div>
                                  <span className="text-sm sm:text-base font-black text-accent">${item.price.toLocaleString()}</span>
                                  <span className="text-[9px] text-[#84849b] font-bold block">USD</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                  <Tag className="w-5 h-5 text-accent" />
                  Órdenes de Venta
                </h2>
                <p className="text-xs text-[#84849b] mt-1 font-medium">Solicitudes de venta de los usuarios. Cada tarjeta agrupa todos los items de una orden.</p>
              </div>
              <button
                onClick={fetchListings}
                disabled={loadingListings}
                className="flex items-center gap-2 h-10 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingListings ? 'animate-spin text-accent' : ''}`} />
                Actualizar
              </button>
            </div>

            {loadingListings ? (
              <div className="flex justify-center py-20 bg-[#110f1e]/40 border border-white/5 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : sellOrders.length === 0 ? (
              <div className="text-center py-20 bg-[#110f1e]/40 rounded-2xl border border-white/5">
                <Tag className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-[#84849b] font-bold">No hay órdenes de venta todavía.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellOrders.map(order => (
                  <div key={order.id} className="bg-[#110f1e]/40 border border-white/5 rounded-xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Order ID</span>
                        <span className="font-mono font-bold text-sm">{order.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Vendedor</span>
                        <div className="flex items-center gap-2">
                          {order.user?.avatar && (
                            <img src={order.user.avatar} className="w-5 h-5 rounded-sm" />
                          )}
                          <span className="text-sm font-bold">{order.user?.name || 'Usuario desconocido'}</span>
                          <span className="text-[10px] text-accent font-mono">({order.user?.steamId})</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Total a pagar</span>
                        <span className="text-emerald-400 font-black text-lg">${order.totalPrice.toLocaleString()} USD</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#84849b] font-mono block">Fecha</span>
                        <span className="text-sm font-bold text-white/70">
                          {new Date(order.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
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

                    {/* Sección Detallada de Cliente y Facturación/Cobro */}
                    <div className="mb-6 bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                        <div className="w-1.5 h-4 bg-accent rounded-full animate-pulse" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
                          Detalles del Vendedor y Facturación / Cobro
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                        
                        {/* Columna 1: Datos Personales */}
                        <div className="space-y-3">
                          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                            Datos del Vendedor
                          </h5>
                          <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Nombre Completo</span>
                              <span className="font-bold text-white block mt-0.5">
                                {order.metadata?.firstName || order.metadata?.lastName
                                  ? `${order.metadata.firstName || ''} ${order.metadata.lastName || ''}`.trim()
                                  : order.user?.name || 'No especificado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Email</span>
                              <span className="font-bold text-white block mt-0.5 break-all">
                                {order.metadata?.email || 'No especificado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Teléfono</span>
                              <span className="font-bold text-white block mt-0.5 font-mono">
                                {order.metadata?.phone || 'No especificado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Columna 2: Método y Datos de Pago/Cobro */}
                        <div className="space-y-3">
                          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                            Método de Cobro (Payout)
                          </h5>
                          <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5 min-h-[120px]">
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Canal Elegido</span>
                              <span className="font-bold text-accent block mt-0.5 uppercase tracking-wide">
                                {order.paymentMethod === 'mercado_pago' ? 'Mercado Pago' : 
                                 order.paymentMethod === 'paypal' ? 'PayPal' : 
                                 order.paymentMethod === 'ethereum' ? 'Ethereum (Web3)' : 
                                 order.paymentMethod === 'binance' ? 'Binance Pay' : 
                                 order.paymentMethod || 'No especificado'}
                              </span>
                            </div>

                            {/* Detalle dinámico según el método de pago */}
                            {order.paymentMethod === 'mercado_pago' && (
                              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">CBU / CVU / Alias</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.cbu || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Titular</span>
                                  <span className="font-bold text-white block">{order.metadata?.accountHolder || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">CUIL / CUIT</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all">{order.metadata?.cuil || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {order.paymentMethod === 'paypal' && (
                              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Correo PayPal</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.cbu || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Titular</span>
                                  <span className="font-bold text-white block">{order.metadata?.accountHolder || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {(order.paymentMethod === 'ethereum' || order.paymentMethod === 'binance') && (
                              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Dirección / Wallet</span>
                                  <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.walletAddress || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#84849b] block">Red Blockchain</span>
                                  <span className="font-bold text-white block">{order.metadata?.network || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {!order.paymentMethod && (
                              <p className="text-[10px] text-white/35 italic mt-2">Sin datos de cobro adicionales.</p>
                            )}
                          </div>
                        </div>

                        {/* Columna 3: Steam Trade Link */}
                        <div className="space-y-3">
                          <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                            Steam Trade Link
                          </h5>
                          <div className="space-y-3 bg-white/[0.01] p-3 rounded-xl border border-white/5 min-h-[120px] flex flex-col justify-between font-sans">
                            <div>
                              <span className="text-[9px] text-[#84849b] uppercase block font-semibold">URL de Intercambio</span>
                              <span className="font-mono text-[10px] text-white/80 block mt-1 break-all select-all leading-normal">
                                {order.user?.tradeUrl || 'Sin Trade URL registrado en el perfil'}
                              </span>
                            </div>
                            
                            {order.user?.tradeUrl && (
                              <button
                                onClick={() => order.user.tradeUrl && handleCopyTradeLink(order.user.tradeUrl, order.id)}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  copiedOrderId === order.id
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                    : 'bg-white/5 border-white/5 text-[#84849b] hover:text-white hover:bg-white/10 hover:border-white/10 active:scale-95'
                                }`}
                              >
                                {copiedOrderId === order.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Copiado Exitosamente</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar Tradelink</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    <details className="group">
                      <summary className="text-[10px] text-[#84849b] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors flex items-center justify-between font-sans">
                        <span>Ítems a vender ({order.items.length})</span>
                        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-3 mt-3">
                        {order.items.map(item => {
                          const resolvedDetails = resolvedItemsMap[item.assetId] || {};
                          const finalFloat = item.float !== null && item.float !== undefined ? item.float : (resolvedDetails.float !== undefined ? resolvedDetails.float : null);
                          const finalPattern = item.pattern !== null && item.pattern !== undefined ? item.pattern : (resolvedDetails.pattern !== undefined ? resolvedDetails.pattern : null);
                          const finalRarity = item.rarity || resolvedDetails.rarity || getItemRarity(item);
                          const finalExterior = item.exterior || resolvedDetails.exterior || getItemExterior(item);
                          const finalProvider = item.provider || (item.assetId && typeof item.assetId === 'string' && item.assetId.startsWith("resell-") ? (hashCode(item.assetId) % 2 === 0 ? "youpin" : "buff") : "bots");

                          return (
                            <div 
                              key={item.id} 
                              className={`flex flex-col sm:flex-row sm:items-center gap-4 bg-[#110f1e] p-4 rounded-xl border border-white/5 relative overflow-hidden group ${
                                rarityColors[finalRarity] || ''
                              }`}
                            >
                              {/* Icon image */}
                              <div className="w-16 h-12 relative bg-white/[0.01] border border-white/[0.02] rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
                                {item.iconUrl ? (
                                  <img src={item.iconUrl} className="w-full h-full object-contain drop-shadow-md" alt={item.name} />
                                ) : (
                                  <span className="text-[8px] text-[#84849b] font-mono">No Image</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-extrabold text-white block truncate">{item.name}</span>
                                  {finalProvider === 'youpin' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono">Youpin</span>
                                  )}
                                  {finalProvider === 'buff' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono">Buff</span>
                                  )}
                                  {finalProvider === 'bots' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">Bots</span>
                                  )}
                                  {finalProvider === 'user' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono">Usuario</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-mono">
                                  {finalExterior && (
                                    <span className="text-white/80 font-sans uppercase tracking-wider font-bold bg-white/5 px-1.5 py-0.5 rounded-sm">
                                      {finalExterior}
                                    </span>
                                  )}
                                  {finalPattern !== null && finalPattern !== undefined && (
                                    <span className="text-[#84849b] bg-white/[0.02] px-1.5 py-0.5 rounded-sm border border-white/5">
                                      Semilla: <span className="text-white font-bold">{finalPattern}</span>
                                    </span>
                                  )}
                                  <span className="text-[#84849b] bg-white/[0.02] px-1.5 py-0.5 rounded-sm border border-white/5">
                                    AssetID: <span className="text-white font-semibold select-all">{item.assetId}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Float display */}
                              {finalFloat !== null && finalFloat !== undefined ? (
                                <div className="sm:w-32 flex-shrink-0">
                                  <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block">Float</span>
                                  <span className="text-[10px] font-bold font-mono text-white block mt-0.5">
                                    {finalFloat.toFixed(8)}
                                  </span>
                                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                                    <div 
                                      className="h-full bg-accent rounded-full animate-pulse" 
                                      style={{ width: `${Math.min(100, finalFloat * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="sm:w-32 flex-shrink-0">
                                  <span className="text-[9px] uppercase tracking-wider font-black text-white/20 font-mono block">Float</span>
                                  <span className="text-[10px] text-white/35 font-mono block mt-0.5">N/A</span>
                                </div>
                              )}

                              {/* Price */}
                              <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                                <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block sm:hidden">Precio</span>
                                <div>
                                  <span className="text-sm sm:text-base font-black text-accent">${item.price.toLocaleString()}</span>
                                  <span className="text-[9px] text-[#84849b] font-bold block">USD</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="w-full min-h-[calc(100vh-180px)] rounded-2xl overflow-hidden bg-[#110f1e]/20 border border-white/5">
            <iframe src="/admin/panel/settings" className="w-full h-full min-h-[calc(100vh-180px)] bg-transparent" />
          </div>
        )}

        {currentTab === 'bots' && (
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-8">
            <AdminBotsPanel />
          </div>
        )}

      </main>

      {/* ─── Price Edit Modal ─── */}
      {priceModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closePriceModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-md bg-[#110f1e] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(217,70,239,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                {priceModalItem.iconUrl ? (
                  <img src={priceModalItem.iconUrl} alt={priceModalItem.name} className="w-10 h-8 object-contain" />
                ) : (
                  <div className="w-10 h-8 bg-white/5 rounded-lg" />
                )}
                <div>
                  <p className="text-xs font-black text-white line-clamp-1">{priceModalItem.name}</p>
                  <p className="text-[10px] text-[#84849b] font-mono mt-0.5">{priceModalItem.exterior ?? priceModalItem.type}</p>
                </div>
              </div>
              <button
                onClick={closePriceModal}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6">

              {/* Switch de precio manual */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <p className="text-sm font-bold text-white">Precio Manual</p>
                  <p className="text-[11px] text-[#84849b] mt-0.5 leading-snug">
                    {modalManualEnabled
                      ? 'Activo — la sincronización automática no sobreescribirá este precio.'
                      : 'Desactivado — el precio se actualiza automáticamente con el mercado.'}
                  </p>
                </div>
                <button
                  onClick={() => setModalManualEnabled(v => !v)}
                  className="ml-4 flex-shrink-0 cursor-pointer transition-all"
                  aria-label="Toggle precio manual"
                >
                  {modalManualEnabled ? (
                    <ToggleRight className="w-12 h-12 text-accent drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-white/20" />
                  )}
                </button>
              </div>

              {/* Input de precio */}
              <div className={`space-y-2 transition-opacity duration-200 ${modalManualEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <label className="text-xs font-black uppercase tracking-widest text-[#84849b] font-mono">
                  Precio en USD
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modalPriceValue}
                    onChange={(e) => setModalPriceValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrice(); }}
                    disabled={!modalManualEnabled}
                    className="w-full pl-10 pr-4 py-3.5 bg-[#0d0b1a] border-2 border-accent/30 focus:border-accent rounded-xl text-white text-base font-bold font-mono focus:outline-none focus:shadow-[0_0_20px_rgba(217,70,239,0.15)] transition-all placeholder-white/20"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[10px] text-[#84849b] font-mono">
                  Precio actual del mercado: <span className="text-white font-bold">${priceModalItem.price.toLocaleString()}</span>
                </p>
              </div>

              {/* Error */}
              {modalError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {modalError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={closePriceModal}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePrice}
                disabled={modalSaving}
                className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(217,70,239,0.3)] disabled:opacity-50"
              >
                {modalSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Guardar Precio</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
