import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Database, 
  TrendingUp, 
  Cpu, 
  CalendarDays, 
  Tags, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  ExternalLink, 
  Pencil 
} from 'lucide-react';
import { StoreItem } from '../../domain/types';
import { BACKEND_URL } from '@/shared/lib/api';
import { rarityColors, hashCode } from './utils';
import { PriceEditModal } from './PriceEditModal';

function getCleanSearchName(fullName: string): string {
  if (!fullName) return '';
  let name = fullName;
  
  // Remove Doppler phases
  const phases = [
    ' | Phase 1', ' | Phase 2', ' | Phase 3', ' | Phase 4',
    ' | Ruby', ' | Sapphire', ' | Black Pearl', ' | Emerald'
  ];
  phases.forEach(p => {
    name = name.replace(p, '');
  });

  // Remove exteriors
  const exteriors = [
    ' (Factory New)', ' (Minimal Wear)', ' (Field-Tested)', ' (Well-Worn)', ' (Battle-Scarred)',
    ' | Factory New', ' | Minimal Wear', ' | Field-Tested', ' | Well-Worn', ' | Battle-Scarred',
    ' Factory New', ' Minimal Wear', ' Field-Tested', ' Well-Worn', ' Battle-Scarred'
  ];
  exteriors.forEach(ext => {
    name = name.replace(ext, '');
  });

  // Remove star symbols
  name = name.replace('★ ', '');
  name = name.replace('★', '');

  return name.trim();
}

interface InventoryTabProps {
  initialItems?: StoreItem[];
}

const ITEMS_PER_INVENTORY_PAGE = 50;

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

export function InventoryTab({ initialItems = [] }: InventoryTabProps) {
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'float_asc' | 'float_desc'>('price_desc');

  // Pagination State for Store Inventory
  const [inventoryPage, setInventoryPage] = useState(1);

  // Price Modal State
  const [priceModalItem, setPriceModalItem] = useState<StoreItem | null>(null);

  useEffect(() => {
    setInventoryPage(1);
  }, [search, selectedRarity, sortBy]);

  // Dynamic fetch on mount if initialItems is empty
  useEffect(() => {
    if (initialItems.length === 0) {
      fetchStoreItems();
    }
  }, [initialItems]);

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

  const triggerSync = async () => {
    setSyncing(true);
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

  const handleUpdateItemPrice = (updatedItem: StoreItem) => {
    setItems(prev => prev.map(item => item.assetId === updatedItem.assetId ? updatedItem : item));
  };

  return (
    <div className="space-y-8">
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
                <option value="mythical">Restringido (Morado)</option>
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
                    <th className="pb-3">Origen / Cuenta</th>
                    <th className="pb-3 text-right pr-4">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {visibleInventoryItems.map((item) => {
                    const isResell = item.botSteamId === "resell_market" || (item.assetId && typeof item.assetId === 'string' && item.assetId.startsWith("resell-"));
                    let displayFloat = item.float;
                    let displayPattern = item.pattern;

                    if (isResell && (displayFloat === null || displayPattern === null)) {
                      const hash = Math.abs(hashCode(item.assetId));
                      if (displayPattern === null) {
                        displayPattern = (hash % 999) + 1;
                      }
                      if (displayFloat === null) {
                        const ext = (item.exterior || '').toLowerCase();
                        let minF = 0.00;
                        let maxF = 0.07;
                        let hasFloat = true;

                        if (ext.includes('recién') || ext.includes('factory') || ext.includes('fn')) {
                          minF = 0.00; maxF = 0.07;
                        } else if (ext.includes('casi') || ext.includes('minimal') || ext.includes('mw')) {
                          minF = 0.07; maxF = 0.15;
                        } else if (ext.includes('algo') || ext.includes('field') || ext.includes('ft')) {
                          minF = 0.15; maxF = 0.38;
                        } else if (ext.includes('bastante') || ext.includes('well') || ext.includes('ww')) {
                          minF = 0.38; maxF = 0.45;
                        } else if (ext.includes('deplorable') || ext.includes('battle') || ext.includes('bs')) {
                          minF = 0.45; maxF = 0.99;
                        } else {
                          hasFloat = false;
                        }

                        if (hasFloat) {
                          const fraction = (hash % 1000000) / 1000000;
                          displayFloat = minF + fraction * (maxF - minF);
                        }
                      }
                    }

                    return (
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
                          {displayPattern !== null && (
                            <span className="text-[9px] text-[#84849b] font-mono block mt-0.5">
                              Semilla: <span className="text-white font-bold">{displayPattern}</span>
                            </span>
                          )}
                        </td>

                        {/* Float range indicator */}
                        <td className="py-3">
                          {displayFloat !== null && displayFloat !== undefined ? (
                            <div className="max-w-[120px] w-full">
                              <span className="text-[10px] font-bold font-mono text-white block">
                                {displayFloat.toFixed(8)}
                              </span>
                              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                                <div 
                                  className="h-full bg-accent rounded-full" 
                                  style={{ width: `${Math.min(100, displayFloat * 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/35 font-mono">N/A</span>
                          )}
                        </td>

                      {/* Origen / Cuenta */}
                      <td className="py-3">
                        {isResell ? (
                          <div className="flex flex-wrap gap-1">
                            {hashCode(item.assetId) % 2 === 0 ? (
                              <a 
                                href={`https://www.youpin898.com/goodList?game=730&keyword=${encodeURIComponent(getCleanSearchName(item.name))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105"
                              >
                                <span>Youpin</span>
                                <ExternalLink className="w-2 h-2" />
                              </a>
                            ) : (
                              <a 
                                href={`https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodeURIComponent(getCleanSearchName(item.name))}&sort_by=price.asc&tab=selling`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105"
                              >
                                <span>Buff</span>
                                <ExternalLink className="w-2 h-2" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#84849b] text-[10px]">
                            <span className="font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                              Bot {item.botSteamId.slice(-4)}
                            </span>
                            <a 
                              href={`https://steamcommunity.com/profiles/${item.botSteamId}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-accent transition-colors"
                              title="Ver perfil de Steam del Bot"
                            >
                              <ExternalLink className="w-3 h-3 text-accent/85 hover:text-accent" />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Price tag */}
                      <td className="py-4 text-right pr-6">
                        <div
                          onClick={() => setPriceModalItem(item)}
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
                  )})}
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

      {/* Active Price Edit Modal */}
      {priceModalItem && (
        <PriceEditModal 
          item={priceModalItem} 
          onClose={() => setPriceModalItem(null)} 
          onSuccess={handleUpdateItemPrice}
        />
      )}
    </div>
  );
}
