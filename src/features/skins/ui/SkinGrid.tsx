"use client";

import { useMemo } from 'react';
import { Skin } from '../domain/skin';
import { SkinCard } from './SkinCard';
import { useFilters } from '@/features/filters/context/FilterContext';
import { applyFilters } from '@/features/filters/utils/applyFilters';

interface SkinGridProps {
  skins: Skin[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const SkinGrid = ({ skins, loading, error, onRetry }: SkinGridProps) => {
  const filters = useFilters();
  const filteredSkins = useMemo(() => applyFilters(skins, filters), [skins, filters]);
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="group relative flex flex-col bg-card rounded-2xl p-4 border border-white/5 animate-pulse">
            
            {/* 1. Item Name Skeleton at the very top */}
            <div className="mb-2.5">
              <div className="w-32 h-3.5 bg-white/5 rounded-full" />
            </div>

            {/* 2. Compact Info Panel Skeleton below the name */}
            <div className="flex flex-col gap-1.5 p-2 rounded-[8px] mb-3 bg-white/[0.01] border border-white/5">
              <div className="flex items-center justify-between">
                <div className="w-16 h-2.5 bg-white/5 rounded-full" />
                <div className="w-10 h-2.5 bg-white/5 rounded-full" />
              </div>
              <div className="h-0.5 w-full bg-white/5 rounded-full mt-0.5" />
            </div>

            {/* 3. Image Container Skeleton */}
            <div className="relative aspect-[4/3] w-full flex items-center justify-center my-2 bg-white/[0.01] rounded-xl border border-white/5">
              <div className="w-24 h-12 bg-white/5 rounded-lg" />
            </div>

            {/* 4. Rarity Divider Skeleton */}
            <div className="h-[2px] w-full mb-3 bg-white/5 rounded-full" />

            {/* 5. Price Section Skeleton */}
            <div className="flex flex-col mb-4">
              <div className="w-16 h-5 bg-white/5 rounded" />
            </div>

            {/* 6. Action Buttons Skeleton */}
            <div className="flex gap-2 h-10 mt-auto">
              <div className="flex-1 bg-white/5 rounded-lg" />
              <div className="w-10 bg-white/5 rounded-lg" />
            </div>
            
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.03)] relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/5 blur-[60px] rounded-full transition-opacity duration-500" />
        
        <div className="w-20 h-20 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-center mb-6 relative z-10 shadow-inner">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <p className="text-lg font-black text-white uppercase tracking-wider mb-2">Error de Sincronización</p>
          <p className="text-xs text-[#84849b] leading-relaxed mb-8 text-center font-medium">
            No pudimos conectar con los servidores de JabbuStore para obtener el catálogo de skins: &quot;{error}&quot;. Asegúrate de que el servidor de back-end esté en ejecución.
          </p>
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.89M9 11l3-3 3 3" />
              </svg>
              Reintentar Conexión
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasActiveFilters = !!(filters.searchQuery || filters.minPrice || filters.maxPrice || filters.selectedCategories.length || filters.selectedConditions.length);

  if (filteredSkins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/5 blur-[50px] rounded-full" />

        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 relative z-10">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        {hasActiveFilters ? (
          <>
            <p className="text-sm font-black text-white uppercase tracking-wider mb-2 relative z-10">Sin resultados</p>
            <p className="text-xs text-[#84849b] max-w-sm font-medium relative z-10">Ninguna skin coincide con los filtros activos. Prueba ajustando los criterios de búsqueda.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-black text-white uppercase tracking-wider mb-2 relative z-10">No hay nada a la venta</p>
            <p className="text-xs text-[#84849b] max-w-sm font-medium relative z-10">Actualmente no hay artículos disponibles en el mercado. Vuelve a consultar más tarde.</p>
          </>
        )}
      </div>
    );
  }

  const getNormalizedCondition = (skin: Skin) => {
    if (skin.exterior) {
      const ext = skin.exterior.toLowerCase().trim();
      if (ext.includes('recién') || ext.includes('factory') || ext.includes('fn')) return 'fn';
      if (ext.includes('casi') || ext.includes('minimal') || ext.includes('mw')) return 'mw';
      if (ext.includes('algo') || ext.includes('field') || ext.includes('ft')) return 'ft';
      if (ext.includes('bastante') || ext.includes('well') || ext.includes('ww')) return 'ww';
      if (ext.includes('deplorable') || ext.includes('battle') || ext.includes('bs')) return 'bs';
      return ext;
    }
    if (skin.float === undefined) return 'fn';
    if (skin.float < 0.07) return 'fn';
    if (skin.float < 0.15) return 'mw';
    if (skin.float < 0.38) return 'ft';
    if (skin.float < 0.45) return 'ww';
    return 'bs';
  };

  const getSkinGroupKey = (skin: Skin) => {
    const cond = getNormalizedCondition(skin);
    return `${skin.weapon}|${skin.name}|${cond}|${skin.isStatTrak ? 'st' : ''}|${skin.isSouvenir ? 'sv' : ''}|${skin.phase || ''}|${skin.price}`;
  };

  const groupedSkins = useMemo(() => {
    const groups: Skin[][] = [];
    const seenKeys = new Set<string>();
    
    for (const skin of filteredSkins) {
      const key = getSkinGroupKey(skin);
      if (seenKeys.has(key)) continue;
      
      const matchingSkins = filteredSkins.filter(s => getSkinGroupKey(s) === key);
      groups.push(matchingSkins);
      seenKeys.add(key);
    }
    
    return groups;
  }, [filteredSkins]);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {groupedSkins.map((group) => (
        <SkinCard key={group[0].id} skinsInGroup={group} />
      ))}
    </div>
  );
};

