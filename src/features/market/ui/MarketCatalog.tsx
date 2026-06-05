"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketListing } from '../domain/types';
import { BACKEND_URL } from '@/shared/lib/api';
import { rarityColors } from '@/features/admin/ui/components/utils';

function getCleanSearchName(fullName: string): string {
  if (!fullName) return '';
  let name = fullName;
  const phases = [' | Phase 1', ' | Phase 2', ' | Phase 3', ' | Phase 4', ' | Ruby', ' | Sapphire', ' | Black Pearl', ' | Emerald'];
  phases.forEach(p => { name = name.replace(p, ''); });
  const exteriors = [' (Factory New)', ' (Minimal Wear)', ' (Field-Tested)', ' (Well-Worn)', ' (Battle-Scarred)'];
  exteriors.forEach(ext => { name = name.replace(ext, ''); });
  name = name.replace('★ ', '').replace('★', '');
  return name.trim();
}

export function MarketCatalog() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'buff' | 'youpin'>('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'price_desc' | 'price_asc' | 'name'>('price_desc');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/market/listings`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar el catálogo de mercado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/market/sync`, { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.message || 'Sincronización completada.');
      await fetchListings();
    } catch {
      setSyncMessage('Error al sincronizar el catálogo.');
    } finally {
      setSyncing(false);
    }
  };

  // Filtrar y ordenar
  const filtered = listings
    .filter(l => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (providerFilter !== 'all' && l.provider !== providerFilter) return false;
      if (rarityFilter !== 'all' && l.rarity !== rarityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'price_asc') return a.price - b.price;
      return a.name.localeCompare(b.name);
    });

  const youpinCount = listings.filter(l => l.provider === 'youpin').length;
  const buffCount = listings.filter(l => l.provider === 'buff').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">Catálogo de Mercado</h2>
          <p className="text-[10px] text-[#84849b] font-mono mt-0.5 uppercase tracking-wider">
            Buff163 + YouPin via SteamWebAPI — {listings.length.toLocaleString()} listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncMessage && (
            <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
              {syncMessage}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#110f1e] border border-white/5 rounded-xl p-3">
          <div className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider">Total</div>
          <div className="text-lg font-black text-white mt-0.5">{listings.length.toLocaleString()}</div>
        </div>
        <div className="bg-[#110f1e] border border-indigo-500/10 rounded-xl p-3">
          <div className="text-[9px] text-indigo-400 font-mono uppercase tracking-wider">YouPin</div>
          <div className="text-lg font-black text-white mt-0.5">{youpinCount.toLocaleString()}</div>
        </div>
        <div className="bg-[#110f1e] border border-yellow-500/10 rounded-xl p-3">
          <div className="text-[9px] text-yellow-400 font-mono uppercase tracking-wider">Buff163</div>
          <div className="text-lg font-black text-white mt-0.5">{buffCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#84849b]" />
          <input
            type="text"
            placeholder="Buscar skin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#110f1e] border border-white/5 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-[#84849b] focus:outline-none focus:border-accent/30 font-mono"
          />
        </div>
        <select
          value={providerFilter}
          onChange={e => setProviderFilter(e.target.value as any)}
          className="bg-[#110f1e] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/30 font-mono"
        >
          <option value="all">Todos los proveedores</option>
          <option value="youpin">YouPin</option>
          <option value="buff">Buff163</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-[#110f1e] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/30 font-mono"
        >
          <option value="price_desc">Precio: Mayor a Menor</option>
          <option value="price_asc">Precio: Menor a Mayor</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#84849b] text-xs font-mono">Cargando catálogo de mercado...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center text-red-400 text-xs font-mono">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#84849b] text-xs font-mono uppercase">
          No se encontraron listings.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                <th className="pb-3 pl-4 w-[38%]">Artículo</th>
                <th className="pb-3 w-[14%]">Desgaste</th>
                <th className="pb-3 w-[14%]">Proveedor</th>
                <th className="pb-3 w-[17%]">Precios Mercado</th>
                <th className="pb-3 text-right pr-4 w-[17%]">Precio Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filtered.slice(0, 500).map((listing) => (
                <MarketListingRow key={listing.id} listing={listing} />
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <p className="text-center text-[10px] text-[#84849b] font-mono py-4">
              Mostrando 500 de {filtered.length.toLocaleString()} resultados. Usar el filtro de búsqueda para acotar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MarketListingRow({ listing }: { listing: MarketListing }) {
  const rarity = listing.rarity?.toLowerCase() || 'common';
  const borderClass = rarityColors[rarity] || '';

  const buffUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodeURIComponent(getCleanSearchName(listing.name))}&sort_by=price.asc&tab=selling`;
  const youpinUrl = `https://www.youpin898.com/goodList?game=730&keyword=${encodeURIComponent(getCleanSearchName(listing.name))}`;

  return (
    <tr className={`group hover:bg-white/[0.015] transition-colors ${borderClass}`}>
      {/* Artículo */}
      <td className="py-3 pl-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-9 bg-white/[0.02] border border-white/[0.03] rounded-lg p-1 flex items-center justify-center flex-shrink-0">
            {listing.iconUrl ? (
              <img src={listing.iconUrl} className="w-full h-full object-contain" alt={listing.name} />
            ) : (
              <span className="text-[7px] text-[#84849b] font-mono">IMG</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate max-w-[260px]">{listing.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {listing.isStatTrak && (
                <span className="text-[8px] font-black bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-mono">ST</span>
              )}
              {listing.isSouvenir && (
                <span className="text-[8px] font-black bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono">SV</span>
              )}
              <span className="text-[8px] text-[#84849b] font-mono">{listing.category}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Desgaste */}
      <td className="py-3">
        <span className="text-[10px] font-bold text-white uppercase">{listing.exterior || 'N/A'}</span>
      </td>

      {/* Proveedor con enlace */}
      <td className="py-3">
        {listing.provider === 'youpin' ? (
          <a
            href={youpinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105"
          >
            <span>YouPin</span>
            <ExternalLink className="w-2 h-2" />
          </a>
        ) : (
          <a
            href={buffUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono transition-all hover:scale-105"
          >
            <span>Buff163</span>
            <ExternalLink className="w-2 h-2" />
          </a>
        )}
      </td>

      {/* Precios de mercado */}
      <td className="py-3">
        <div className="space-y-0.5">
          {listing.youpinAsk != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-indigo-400 font-mono w-10">YP:</span>
              <span className="text-[9px] font-bold text-white font-mono">${listing.youpinAsk.toFixed(2)}</span>
              {listing.youpinVolume != null && (
                <span className="text-[7px] text-[#84849b] font-mono">×{listing.youpinVolume}</span>
              )}
            </div>
          )}
          {listing.buffAsk != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-yellow-400 font-mono w-10">BF:</span>
              <span className="text-[9px] font-bold text-white font-mono">${listing.buffAsk.toFixed(2)}</span>
              {listing.buffVolume != null && (
                <span className="text-[7px] text-[#84849b] font-mono">×{listing.buffVolume}</span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Precio base */}
      <td className="py-3 text-right pr-4">
        <div className="text-sm font-extrabold text-white">${listing.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        {listing.isPriceManual && (
          <span className="text-[7px] font-black bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-1.5 py-0.5 rounded font-mono uppercase">Manual</span>
        )}
      </td>
    </tr>
  );
}
