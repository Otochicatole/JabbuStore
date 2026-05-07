"use client";

import React, { useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { InventoryCard } from './InventoryCard';
import { SteamLoginButton } from '@/shared/components/SteamLoginButton';
import { useFilters } from '@/features/filters/context/FilterContext';
import { applyFilters } from '@/features/filters/utils/applyFilters';

interface InventoryGridProps {
  variant?: 'simple' | 'sell';
}

export const InventoryGrid = ({ variant = 'sell' }: InventoryGridProps) => {
  const { inventoryItems, loading, error, syncing, refetchInventory } = useInventory();
  const filters = useFilters();
  const filteredItems = useMemo(() => applyFilters(inventoryItems, filters), [inventoryItems, filters]);

  const gridCols = variant === 'sell'
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5";

  if (loading) {
    return (
      <div className={`grid gap-6 ${gridCols}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl h-[300px] animate-pulse border border-white/5 flex items-center justify-center">
            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Cargando...</span>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    const isLoginRequired = error === "Inicia sesión para ver tu inventario" || error.toLowerCase().includes("sesión expirada");
    const isRateLimit = error.includes("429") || error.toLowerCase().includes("too many requests");

    if (isLoginRequired) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-accent/20 shadow-[0_0_50px_rgba(217,70,239,0.05)] relative overflow-hidden group">
          {/* Glow Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/10 blur-[60px] rounded-full transition-opacity duration-500 group-hover:bg-accent/15" />
          
          <div className="w-20 h-20 rounded-2xl bg-accent/5 border border-accent/20 flex items-center justify-center mb-6 relative z-10 shadow-inner">
            <svg 
              viewBox="0 0 24 24" 
              className="w-10 h-10 fill-current text-accent"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 .002C5.372.002 0 5.374 0 12c0 1.034.133 2.036.381 2.991l5.483 2.27c.224-.134.484-.216.761-.216.14 0 .272.023.398.061l2.508-3.66a3.11 3.11 0 0 1-.035-3.136c.038-.07.078-.139.123-.205.81-1.18 2.39-1.488 3.528-.688 1.139.8 1.436 2.36.626 3.539-.374.545-.929.89-1.54.996l-1.077 4.195c.002.016.006.03.006.046 0 1.258-1.018 2.278-2.275 2.278-.293 0-.57-.058-.823-.16L2.35 20.916C4.832 22.84 7.95 24 11.34 24 18.332 24 24 18.332 24 11.34S18.332-.002 11.34-.002h.66zm-.92 14.507c.803 0 1.453.651 1.453 1.454a1.454 1.454 0 1 1-1.453-1.454zm1.378-4.577a1.64 1.64 0 1 0-3.279.002 1.64 1.64 0 0 0 3.279-.002z" />
            </svg>
          </div>
          
          <div className="relative z-10 max-w-sm flex flex-col items-center">
            <p className="text-lg font-black text-white uppercase tracking-wider mb-2">Conecta tu cuenta de Steam</p>
            <p className="text-xs text-[#84849b] leading-relaxed mb-8 text-center font-medium">
              Inicia sesión de forma segura usando OpenID para visualizar, valorar y vender tus skins de Counter-Strike 2 al instante.
            </p>
            <SteamLoginButton />
          </div>
        </div>
      );
    }

    // Temporary Steam API rate limit or generic communication error
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.03)] relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/5 blur-[60px] rounded-full transition-opacity duration-500" />
        
        <div className="w-20 h-20 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-center mb-6 relative z-10 shadow-inner animate-pulse">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <p className="text-lg font-black text-white uppercase tracking-wider mb-2">
            {isRateLimit ? "Límite de Consultas de Steam" : "Error de Conexión con Steam"}
          </p>
          <p className="text-xs text-[#84849b] leading-relaxed mb-8 text-center font-medium">
            {isRateLimit 
              ? "Los servidores de Steam están saturados y limitando temporalmente las consultas de inventario debido al alto tráfico general. Tu sesión sigue activa. Espera un momento y vuelve a intentarlo."
              : `No pudimos sincronizar tu inventario: "${error}". Por favor, intenta de nuevo en unos instantes.`
            }
          </p>
          
          <button 
            onClick={() => refetchInventory(true)}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.89M9 11l3-3 3 3" />
            </svg>
            {syncing ? "Sincronizando..." : "Reintentar Sincronización"}
          </button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = !!(filters.searchQuery || filters.minPrice || filters.maxPrice || filters.selectedCategories.length || filters.selectedConditions.length);

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-white/5 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        {hasActiveFilters ? (
          <>
            <p className="text-sm font-black text-white uppercase tracking-wider mb-2">Sin resultados</p>
            <p className="text-xs text-[#84849b] max-w-sm font-medium">Ninguna skin de tu inventario coincide con los filtros activos. Prueba ajustando los criterios.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-black text-white uppercase tracking-wider mb-2">Tu inventario de Steam está vacío</p>
            <p className="text-xs text-[#84849b] max-w-sm font-medium">Asegúrate de que tus skins de Counter-Strike 2 sean públicas y se encuentren visibles en tu cuenta de Steam.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${gridCols}`}>
      {filteredItems.map((skin) => (
        <InventoryCard key={skin.id} skin={skin} variant={variant} />
      ))}
    </div>
  );
};
