"use client";

import { Skin } from '../domain/skin';
import { SkinCard } from './SkinCard';

interface SkinGridProps {
  skins: Skin[];
  loading: boolean;
}

export const SkinGrid = ({ skins, loading }: SkinGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl h-[310px] animate-pulse border border-white/5 flex flex-col p-4 justify-between">
            <div className="w-12 h-4 bg-white/5 rounded-full" />
            <div className="w-full aspect-square bg-white/5 rounded-xl my-4" />
            <div className="space-y-2">
              <div className="w-2/3 h-3 bg-white/5 rounded" />
              <div className="w-1/2 h-4 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (skins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/5 blur-[50px] rounded-full" />

        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 relative z-10">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-sm font-black text-white uppercase tracking-wider mb-2 relative z-10">No hay nada a la venta</p>
        <p className="text-xs text-[#84849b] max-w-sm font-medium relative z-10">Actualmente no hay artículos disponibles en el mercado. Vuelve a consultar más tarde.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {skins.map((skin) => (
        <SkinCard key={skin.id} skin={skin} />
      ))}
    </div>
  );
};
