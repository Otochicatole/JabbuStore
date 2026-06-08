"use client";

import React from "react";
import {
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { rarityColors } from "@/features/admin/ui/components/utils";
import { useMarketCatalog } from "./useMarketCatalog";

function getCleanSearchName(fullName: string): string {
  if (!fullName) return "";
  let name = fullName;
  const phases = [
    " | Phase 1",
    " | Phase 2",
    " | Phase 3",
    " | Phase 4",
    " | Ruby",
    " | Sapphire",
    " | Black Pearl",
    " | Emerald",
  ];
  phases.forEach((p) => {
    name = name.replace(p, "");
  });
  const exteriors = [
    " (Factory New)",
    " (Minimal Wear)",
    " (Field-Tested)",
    " (Well-Worn)",
    " (Battle-Scarred)",
  ];
  exteriors.forEach((ext) => {
    name = name.replace(ext, "");
  });
  name = name.replace("★ ", "").replace("★", "");
  return name.trim();
}

const ITEMS_PER_PAGE = 50;

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
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
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return pages;
}

export function MarketCatalog() {
  const {
    listings,
    loading,
    syncing,
    error,
    syncMessage,
    search,
    setSearch,
    providerFilter,
    setProviderFilter,
    rarityFilter,
    setRarityFilter,
    sortBy,
    setSortBy,
    filtered,
    youpinCount,
    buffCount,
    handleSync,
    currentPage,
    setCurrentPage,
  } = useMarketCatalog();

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentActivePage = currentPage > totalPages ? 1 : currentPage;
  const paginatedListings = filtered.slice(
    (currentActivePage - 1) * ITEMS_PER_PAGE,
    currentActivePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            Catálogo de Mercado
          </h2>
          <p className="text-[10px] text-[#84849b] font-mono mt-0.5 uppercase tracking-wider">
            Buff163 + YouPin via SteamWebAPI —{" "}
            {listings.length.toLocaleString()} listings
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
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider rounded-[3px] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#110f1e] border border-white/5 rounded-[3px] p-3">
          <div className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider">
            Total
          </div>
          <div className="text-xl font-bold mt-1 text-white">
            {listings.length.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#110f1e] border border-white/5 rounded-[3px] p-3">
          <div className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider">
            Buff163 Listings
          </div>
          <div className="text-xl font-bold mt-1 text-accent">
            {buffCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#110f1e] border border-white/5 rounded-[3px] p-3">
          <div className="text-[9px] text-[#84849b] font-mono uppercase tracking-wider">
            YouPin Listings
          </div>
          <div className="text-xl font-bold mt-1 text-emerald-400">
            {youpinCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#84849b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar listings de Buff o YouPin..."
              className="w-full bg-[#110f1e]/80 border border-white/5 pl-9 pr-3 py-2 text-xs font-bold text-white placeholder-[#84849b] rounded-[3px] outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Provider */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value as any)}
              className="bg-[#110f1e]/80 border border-white/5 text-[11px] font-bold px-3 py-2 rounded-[3px] text-white outline-none cursor-pointer"
            >
              <option value="all">Todos los Proveedores</option>
              <option value="buff">Buff163 Only</option>
              <option value="youpin">YouPin Only</option>
            </select>

            {/* Rarity */}
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="bg-[#110f1e]/80 border border-white/5 text-[11px] font-bold px-3 py-2 rounded-[3px] text-white outline-none cursor-pointer"
            >
              <option value="all">Todas las rarezas</option>
              <option value="coverte">★ Covert (Rojo)</option>
              <option value="classified">Classified (Rosado)</option>
              <option value="restricted">Restricted (Púrpura)</option>
              <option value="mil-spec">Mil-Spec (Azul)</option>
              <option value="industrial">Industrial (Celeste)</option>
              <option value="consumer">Consumer (Gris)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#110f1e]/80 border border-white/5 text-[11px] font-bold px-3 py-2 rounded-[3px] text-white outline-none cursor-pointer"
            >
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="name">Alfabético</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[3px] text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Listings List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mb-2" />
            <span className="text-[10px] text-[#84849b] font-black uppercase tracking-widest">
              Sincronizando listings...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#84849b] font-bold">
            No se encontraron listings para tu búsqueda.
          </div>
        ) : (
          <div className="border border-white/5 rounded-[3px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 bg-[#110f1e]/60 text-[#84849b] text-[9px] font-black uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Estado / Wear</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Precio Sugerido Youpin</th>
                    <th className="py-3 px-4">Precio Sugerido Buff</th>
                    <th className="py-3 px-4">Precio Sugerido Steam</th>
                    <th className="py-3 px-4">Precio de Reventa</th>
                    <th className="py-3 px-4 text-right">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedListings.map((l) => {
                    const color =
                      rarityColors[l.rarity.toLowerCase()] ||
                      rarityColors.common;
                    return (
                      <tr
                        key={l.id}
                        className="hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="py-2.5 px-4 font-black text-white flex items-center gap-3">
                          <div
                            className="relative w-10 h-10 rounded-[3px] bg-[#110f1e]/60 border border-white/[0.03] flex items-center justify-center p-1 shrink-0"
                            style={{ borderColor: `${color}15` }}
                          >
                            <div
                              className="absolute inset-0 blur-md opacity-20 pointer-events-none rounded-[3px]"
                              style={{
                                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                              }}
                            />
                            {l.iconUrl && (
                              <img
                                src={l.iconUrl}
                                alt={l.name}
                                className="w-8 h-8 object-contain z-10"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-white">{l.name}</p>
                            <p className="text-[10px] text-[#84849b] uppercase font-mono mt-0.5">
                              {l.category}
                            </p>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs">
                          {l.exterior ? (
                            <span className="text-white font-medium uppercase text-[10px]">
                              {l.exterior}
                            </span>
                          ) : (
                            <span className="text-[#84849b]">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-[3px] text-[9px] font-mono uppercase font-black ${
                              l.provider === "buff"
                                ? "bg-accent/10 text-accent border border-accent/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {l.provider}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#84849b]">
                          {l.youpinAsk ? `$${l.youpinAsk}` : "—"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#84849b]">
                          {l.buffAsk ? `$${l.buffAsk}` : "—"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#84849b]">
                          {/* En MarketListing de front el precio de steam se aproxima por price o displayPrice si no existe steamPrice */}
                          —
                        </td>
                        <td className="py-2.5 px-4 font-mono text-green-400 font-bold">
                          ${l.price.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {l.provider === "buff" ? (
                              <a
                                href={`https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(getCleanSearchName(l.name))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-accent/80 hover:text-accent hover:border-accent/30 transition-all cursor-pointer text-[10px] font-bold"
                                title="Buscar en Buff163"
                              >
                                Buff163 <ExternalLink className="w-3 h-3 inline-block ml-1" />
                              </a>
                            ) : (
                              <a
                                href={`https://www.youpin898.com/goodList?gameId=730&keywords=${encodeURIComponent(getCleanSearchName(l.name))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-all cursor-pointer text-[10px] font-bold"
                                title="Buscar en YouPin"
                              >
                                YouPin <ExternalLink className="w-3 h-3 inline-block ml-1" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-[#110f1e]/20 border-t border-white/5">
                <span className="text-[10px] text-[#84849b] font-bold uppercase tracking-wider font-mono">
                  Página {currentActivePage} de {totalPages} ({filtered.length.toLocaleString()} items)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentActivePage === 1}
                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
                  >
                    Anterior
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers(currentActivePage, totalPages).map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (typeof page === "number") setCurrentPage(page);
                        }}
                        disabled={page === "..."}
                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-[3px] border transition-all cursor-pointer select-none ${
                          page === currentActivePage
                            ? "bg-accent border-accent text-white font-black"
                            : "bg-white/[0.02] border-white/5 text-[#84849b] hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentActivePage === totalPages}
                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-35 text-white text-[10px] font-bold uppercase rounded-[3px] border border-white/5 cursor-pointer select-none"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default MarketCatalog;
